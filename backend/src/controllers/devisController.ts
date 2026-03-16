import { Request, Response } from 'express';
import prisma from '../prisma';

export const getDevis = async (req: Request, res: Response) => {
  try {
    const devisList = await prisma.devis.findMany({
      where: { companyId: (req as any).company.id },
      include: {
        client: true,
        lines: true
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
        lines: true
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
    const { clientId, lines, status, stampDuty, withholdingTax } = req.body;

    if (!clientId || !lines || lines.length === 0) {
      return res.status(400).json({ message: 'Client ID and at least one line are required' });
    }

    let totalHT = 0;
    let totalTVA = 0;

    const processedLines = lines.map((line: any) => {
      const lineTotalHT = line.quantity * line.unitPrice;
      const lineTVA = lineTotalHT * (line.tvaRate / 100);
      
      totalHT += lineTotalHT;
      totalTVA += lineTVA;

      return {
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        tvaRate: line.tvaRate,
        totalHT: lineTotalHT
      };
    });

    const totalTTC = totalHT + totalTVA;
    const netToPay = totalTTC + (stampDuty || 1.0) - (withholdingTax || 0);

    const devis = await prisma.devis.create({
      data: {
        companyId: (req as any).company.id,
        clientId,
        status: status || 'PENDING',
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
        lines: true
      }
    });

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
      }
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis not found' });
    }

    const updatedDevis = await prisma.devis.update({
      where: { id: req.params.id as string },
      data: { status }
    });

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
    const invoiceLinesToCreate = devis.lines.map(line => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      tvaRate: line.tvaRate,
      totalHT: line.totalHT
    }));

    const newInvoice = await prisma.invoice.create({
      data: {
        companyId: devis.companyId,
        clientId: devis.clientId,
        devisId: devis.id,
        status: 'DRAFT',
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

    // Mark devis as accepted
    await prisma.devis.update({
      where: { id: devis.id },
      data: { status: 'ACCEPTED' }
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
    res.setHeader('Content-Disposition', `attachment; filename=Devis_${devis.id}.pdf`);
    
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
    const subject = `Devis ${devis.id} from ${devis.company.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${devis.client.name},</p>
        <p>Please find attached your Devis <b>#${devis.id}</b>.</p>
        <p>Total amount due: <strong>${devis.netToPay.toFixed(3)} TND</strong></p>
        <br/>
        <p>Thank you for your business!</p>
        <p>${devis.company.name}</p>
      </div>
    `;

    const attachments = [
      {
        filename: `Devis_${devis.id}.pdf`,
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
