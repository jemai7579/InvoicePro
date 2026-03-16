import { Request, Response } from 'express';
import prisma from '../prisma';
import generatePdf from '../utils/pdfGenerator';
import { generateTeifXml } from '../utils/teifGenerator';

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { companyId: (req as any).company.id },
      include: {
        client: true,
        lines: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      },
      include: {
        client: true,
        lines: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoicePdf = async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
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

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfBuffer = await generatePdf(invoice, 'FACTURE');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.id}.pdf`);
    
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF', error);
    res.status(500).json({ message: 'Server error generating PDF' });
  }
};

import fs from 'fs-extra';
import { signXml } from '../utils/signer';

export const getInvoiceXml = async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
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

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    let xmlContent = generateTeifXml(invoice);

    // If company has uploaded a certificate, sign the XML
    if (invoice.company.certificatePath && invoice.company.certificatePassword) {
      try {
        const p12Buffer = await fs.readFile(invoice.company.certificatePath);
        xmlContent = signXml({
          xmlString: xmlContent,
          p12Buffer: p12Buffer,
          password: invoice.company.certificatePassword
        });
      } catch (signError: any) {
        console.error('Signing failed:', signError.message);
        // Fallback to sending unsigned if signing fails, or return error depending on strictness
        // returning error since TTN requires signed
        return res.status(500).json({ message: 'Failed to sign the invoice with the registered certificate: ' + signError.message });
      }
    }
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=TEIF_${invoice.id}.xml`);
    
    res.status(200).send(xmlContent);
  } catch (error: any) {
    console.error('Error generating XML', error);
    // Send back specialized error message for validation failures
    res.status(400).json({ message: error.message || 'Error generating TEIF XML' });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { devisId, clientId, lines, status, stampDuty, withholdingTax } = req.body;

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

    const invoice = await prisma.invoice.create({
      data: {
        companyId: (req as any).company.id,
        clientId,
        devisId: devisId || null,
        status: status || 'DRAFT',
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

    if (devisId) {
       await prisma.devis.update({
         where: { id: devisId },
         data: { status: 'ACCEPTED' } // Auto-accept devis when turning to invoice
       });
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await prisma.invoice.delete({
      where: { id: req.params.id as string }
    });

    res.status(200).json({ message: 'Invoice removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import { sendEmail } from '../utils/mailer';
import nodemailer from 'nodemailer';

export const sendInvoiceEmailController = async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
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

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.client.email) {
      return res.status(400).json({ message: 'Client does not have an email address' });
    }

    // 1. Generate PDF
    const pdfBuffer = await generatePdf(invoice, 'FACTURE');
    
    // 2. Generate XML (signed if cert exists)
    let xmlContent = generateTeifXml(invoice);
    if (invoice.company.certificatePath && invoice.company.certificatePassword) {
      try {
        const p12Buffer = await fs.readFile(invoice.company.certificatePath);
        xmlContent = signXml({
          xmlString: xmlContent,
          p12Buffer: p12Buffer,
          password: invoice.company.certificatePassword
        });
      } catch (signError: any) {
         console.warn('Signing failed for email attachment:', signError.message);
      }
    }

    // 3. Send Email
    const subject = `Invoice ${invoice.id} from ${invoice.company.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${invoice.client.name},</p>
        <p>Please find attached your invoice <b>#${invoice.id}</b>.</p>
        <p>Total amount due: <strong>${invoice.netToPay.toFixed(3)} TND</strong></p>
        <br/>
        <p>Thank you for your business!</p>
        <p>${invoice.company.name}</p>
      </div>
    `;

    const attachments = [
      {
        filename: `Invoice_${invoice.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      },
      {
        filename: `TEIF_${invoice.id}.xml`,
        content: xmlContent,
        contentType: 'application/xml'
      }
    ];

    const info = await sendEmail(invoice.client.email, subject, html, attachments);

    res.status(200).json({ 
      message: 'Email sent successfully',
      previewUrl: process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST ? nodemailer.getTestMessageUrl(info) : undefined
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};

import { submitInvoiceToTTN } from '../services/ttnService';

export const submitToTTNController = async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id as string;
    const companyId = (req as any).company.id;

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        company: true,
        client: true,
        lines: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'VALIDATED') {
      return res.status(400).json({ message: 'Invoice is already validated by TTN.' });
    }

    let xmlContent = generateTeifXml(invoice);

    if (invoice.company.certificatePath && invoice.company.certificatePassword) {
      try {
        const p12Buffer = await fs.readFile(invoice.company.certificatePath);
        xmlContent = signXml({
          xmlString: xmlContent,
          p12Buffer: p12Buffer,
          password: invoice.company.certificatePassword
        });
      } catch (signError: any) {
         return res.status(500).json({ message: 'Failed to sign the invoice before sending to TTN. ' + signError.message });
      }
    } else {
       return res.status(400).json({ message: 'A digital certificate is required to submit to TTN. Please configure it in Settings.' });
    }

    // Call Mock TTN Service
    const ttnResponse = await submitInvoiceToTTN(xmlContent, invoice.company.matriculeFiscal, invoice.id);

    // Update the invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: ttnResponse.status }
    });

    res.status(200).json({
      message: ttnResponse.message,
      invoice: updatedInvoice
    });

  } catch (error) {
    console.error('Error submitting to TTN:', error);
    res.status(500).json({ message: 'Server error during TTN submission' });
  }
};
