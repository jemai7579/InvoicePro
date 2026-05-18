import { Request, Response } from 'express';
import prisma from '../prisma';
import { createNotif } from '../utils/notificationHelper';
import {
  generateBusinessNumber,
  getDevisVisibleNumber,
  getInvoiceVisibleNumber,
  sanitizeBusinessNumberForFileName,
} from '../services/numberingService';

type NormalizedDevisLine = {
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
};

export const getDevis = async (req: Request, res: Response) => {
  try {
    const devisList = await prisma.devis.findMany({
      where: { companyId: (req as any).company.id },
      include: {
        client: true,
        lines: true,
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(devisList);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDevisById = async (req: Request, res: Response) => {
  try {
    const devis = await prisma.devis.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      },
      include: {
        client: true,
        lines: true,
        invoice: true
      }
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis not found' });
    }

    res.status(200).json(devis);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDevis = async (req: Request, res: Response) => {
  try {
    const { clientId, lines, status, stampDuty, withholdingTax, note } = req.body;
    const companyId = (req as any).company.id;

    if (!clientId || !lines || lines.length === 0) {
      return res.status(400).json({ message: 'Client ID and at least one line are required' });
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, companyId },
      select: { id: true },
    });
    if (!client) {
      return res.status(400).json({ message: 'Selected client does not belong to your company.' });
    }

    const normalizedLines: NormalizedDevisLine[] = lines.map((line: any) => ({
      productId: line.productId || null,
      description: String(line.description || '').trim(),
      quantity: Number(line.quantity || 0),
      unitPrice: Number(line.unitPrice || 0),
      tvaRate: Number(line.tvaRate || 0),
    }));

    if (normalizedLines.some((line) => !line.description || line.quantity <= 0 || line.unitPrice < 0)) {
      return res.status(400).json({ message: 'Each quote line must include a description, quantity and unit price.' });
    }

    const productIds = Array.from(
      new Set(
        normalizedLines
          .map((line) => line.productId)
          .filter((productId): productId is string => Boolean(productId))
      )
    );
    if (productIds.length > 0) {
      const ownedProducts = await prisma.product.findMany({
        where: { companyId, id: { in: productIds } },
        select: { id: true },
      });
      if (ownedProducts.length !== productIds.length) {
        return res.status(400).json({ message: 'One or more selected products do not belong to your company.' });
      }
    }

    let totalHT = 0;
    let totalTVA = 0;

    const processedLines = normalizedLines.map((line: NormalizedDevisLine) => {
      const lineTotalHT = line.quantity * line.unitPrice;
      const lineTVA = lineTotalHT * (line.tvaRate / 100);
      
      totalHT += lineTotalHT;
      totalTVA += lineTVA;

      return {
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        tvaRate: line.tvaRate,
        totalHT: lineTotalHT
      };
    });

    const totalTTC = totalHT + totalTVA;
    const netToPay = totalTTC + (stampDuty || 1.0) - (withholdingTax || 0);

    const normalizedStatus =
      status === 'ACCEPTED' ? 'ACCEPTED' :
      status === 'REJECTED' || status === 'REFUSED' ? 'REJECTED' :
      'PENDING';

    const devis = await prisma.$transaction(async (tx) => {
      const number = await generateBusinessNumber(tx, companyId, 'DEVIS');
      return tx.devis.create({
        data: {
          companyId,
          number,
          clientId,
          status: normalizedStatus,
          note: note || null,
          totalHT,
          totalTVA,
          totalTTC,
          stampDuty: stampDuty || 1.0,
          withholdingTax: withholdingTax || 0,
          netToPay,
          lines: {
            create: processedLines
          }
        },
        include: {
          lines: true,
          client: true,
          invoice: true
        }
      });
    });

    // Notification
    const clientRecord = await prisma.client.findUnique({ where: { id: clientId } });
    await createNotif(
      (req as any).company.id,
      'Demande envoyée',
      `Demande envoyée au client ${clientRecord?.name ?? clientId}.`,
      'DEMANDE_SENT'
    );

    res.status(201).json(devis);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateDevisStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const devis = await prisma.devis.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      },
      include: { client: true }
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis not found' });
    }

    const updatedDevis = await prisma.devis.update({
      where: { id: req.params.id as string },
      data: { status }
    });

    // Notification
    const clientName = devis.client?.name ?? devis.clientId;
    if (status === 'ACCEPTED') {
      await createNotif((req as any).company.id, 'Demande acceptée',
        `La demande pour ${clientName} a été acceptée.`, 'DEMANDE_ACCEPTED');
    } else if (status === 'REJECTED') {
      await createNotif((req as any).company.id, 'Demande rejetée',
        `La demande pour ${clientName} a été rejetée.`, 'DEMANDE_REJECTED');
    }

    res.status(200).json(updatedDevis);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export const convertDevisToInvoice = async (req: Request, res: Response) => {
  try {
    const devis = await prisma.devis.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      },
      include: {
        lines: true
      }
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis not found' });
    }

    // Check if an invoice already exists for this devis
    const existingInvoice = await prisma.invoice.findFirst({
      where: { devisId: devis.id }
    });

    if (existingInvoice) {
      return res.status(400).json({ message: 'An invoice already exists for this Devis', invoiceId: existingInvoice.id });
    }

    // Create Invoice from Devis data
    const invoiceLinesToCreate = devis.lines.map((line) => ({
      productId: line.productId,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      tvaRate: line.tvaRate,
      totalHT: line.totalHT
    }));

    const newInvoice = await prisma.$transaction(async (tx) => {
      const number = await generateBusinessNumber(tx, devis.companyId, 'INVOICE');
      const createdInvoice = await tx.invoice.create({
        data: {
          companyId: devis.companyId,
          clientId: devis.clientId,
          devisId: devis.id,
          number,
          status: 'DRAFT',
          ttnStatus: 'DRAFT',
          totalHT: devis.totalHT,
          totalTVA: devis.totalTVA,
          totalTTC: devis.totalTTC,
          stampDuty: devis.stampDuty,
          withholdingTax: devis.withholdingTax,
          netToPay: devis.netToPay,
          lines: {
            create: invoiceLinesToCreate
          }
        }
      });

      await tx.devis.update({
        where: { id: devis.id },
        data: { status: 'ACCEPTED' }
      });

      return createdInvoice;
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error converting devis to invoice', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteDevis = async (req: Request, res: Response) => {
  try {
    const devis = await prisma.devis.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis not found' });
    }

    await prisma.devis.delete({
      where: { id: req.params.id as string }
    });

    res.status(200).json({ message: 'Devis removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import generatePdf from '../utils/pdfGenerator';
import { sendEmail } from '../utils/mailer';
import nodemailer from 'nodemailer';

export const getDevisPdf = async (req: Request, res: Response) => {
  try {
    const devis = await prisma.devis.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      },
      include: {
        company: true,
        client: true,
        lines: true
      }
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis not found' });
    }

    const pdfBuffer = await generatePdf(devis, 'DEVIS');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Devis_${sanitizeBusinessNumberForFileName(getDevisVisibleNumber(devis))}.pdf`);
    
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF', error);
    res.status(500).json({ message: 'Server error generating PDF' });
  }
};

export const sendDevisEmailController = async (req: Request, res: Response) => {
  try {
    const devis = await prisma.devis.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      },
      include: {
        company: true,
        client: true,
        lines: true
      }
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis not found' });
    }

    if (!devis.client.email) {
      return res.status(400).json({ message: 'Client does not have an email address' });
    }

    // 1. Generate PDF
    const pdfBuffer = await generatePdf(devis, 'DEVIS');
    
    // 2. Send Email
    const devisNumber = getDevisVisibleNumber(devis);
    const subject = `Devis ${devisNumber} from ${devis.company.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${devis.client.name},</p>
        <p>Please find attached your Devis <b>${devisNumber}</b>.</p>
        <p>Total amount due: <strong>${devis.netToPay.toFixed(3)} TND</strong></p>
        <br/>
        <p>Thank you for your business!</p>
        <p>${devis.company.name}</p>
      </div>
    `;

    const attachments = [
      {
        filename: `Devis_${sanitizeBusinessNumberForFileName(devisNumber)}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];

    const info = await sendEmail(devis.client.email, subject, html, attachments);

    res.status(200).json({ 
      message: 'Email sent successfully',
      previewUrl: process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST ? nodemailer.getTestMessageUrl(info) : undefined
    });
  } catch (error) {
    console.error('Error sending devis email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};
