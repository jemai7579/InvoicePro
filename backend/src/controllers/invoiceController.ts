import { Request, Response } from 'express';
import prisma from '../prisma';
import generatePdf from '../utils/pdfGenerator';
import { generateTeifXml } from '../utils/teifGenerator';
import { createNotif } from '../utils/notificationHelper';

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

const VALID_STATUSES = ['DRAFT', 'PENDING_VALIDATION', 'SENT_TO_TTN', 'VALIDATED', 'PAID', 'REJECTED'];

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Statut invalide. Valeurs acceptées : ${VALID_STATUSES.join(', ')}`
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id as string },
      data: { status }
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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

// ── Import TEIF XML ──────────────────────────────────────────────────────────
import { convert } from 'xmlbuilder2';

export const importInvoiceXml = async (req: Request, res: Response) => {
  try {
    const xmlString: string = (req as any).file?.buffer?.toString('utf-8') ?? req.body?.xml;
    if (!xmlString) {
      return res.status(400).json({ message: 'Aucun fichier XML fourni.' });
    }

    // Parse the XML into a plain JS object
    let doc: any;
    try {
      doc = convert(xmlString, { format: 'object' }) as any;
    } catch {
      return res.status(400).json({ message: 'XML invalide ou non lisible.' });
    }

    const invoice = doc?.Invoice ?? doc;
    const companyId = (req as any).company.id;

    // ── Extract client info ──────────────────────────────────────────────
    const customerParty  = invoice?.['cac:AccountingCustomerParty']?.['cac:Party'];
    const clientMf       = customerParty?.['cac:PartyIdentification']?.['cbc:ID']?.['#'] ??
                           customerParty?.['cac:PartyIdentification']?.['cbc:ID'];
    const clientName     = customerParty?.['cac:PartyName']?.['cbc:Name']?.['#'] ??
                           customerParty?.['cac:PartyName']?.['cbc:Name'] ?? 'Importé depuis XML';
    const clientAddress  = customerParty?.['cac:PostalAddress']?.['cbc:StreetName']?.['#'] ??
                           customerParty?.['cac:PostalAddress']?.['cbc:StreetName'] ?? '';
    const clientCity     = customerParty?.['cac:PostalAddress']?.['cbc:CityName']?.['#'] ??
                           customerParty?.['cac:PostalAddress']?.['cbc:CityName'] ?? '';
    const clientEmail    = customerParty?.['cac:Contact']?.['cbc:ElectronicMail']?.['#'] ??
                           customerParty?.['cac:Contact']?.['cbc:ElectronicMail'] ?? undefined;
    const clientPhone    = customerParty?.['cac:Contact']?.['cbc:Telephone']?.['#'] ??
                           customerParty?.['cac:Contact']?.['cbc:Telephone'] ?? undefined;

    // ── Find or create client ────────────────────────────────────────────
    let client = null;
    if (clientMf && clientMf !== 'NOT_PROVIDED') {
      client = await prisma.client.findFirst({ where: { companyId, matriculeFiscal: String(clientMf) } });
    }
    if (!client) {
      client = await prisma.client.create({
        data: {
          companyId,
          name: String(clientName),
          matriculeFiscal: clientMf ? String(clientMf) : undefined,
          address: clientAddress ? String(clientAddress) : undefined,
          city:    clientCity    ? String(clientCity)    : undefined,
          email:   clientEmail   ? String(clientEmail)   : undefined,
          phone:   clientPhone   ? String(clientPhone)   : undefined,
        }
      });
    }

    // ── Extract invoice lines ────────────────────────────────────────────
    const rawLines = invoice?.['cac:InvoiceLine'];
    const lineArray = Array.isArray(rawLines) ? rawLines : (rawLines ? [rawLines] : []);

    if (lineArray.length === 0) {
      return res.status(400).json({ message: 'Le XML ne contient aucune ligne de facture.' });
    }

    const parsedLines = lineArray.map((l: any) => {
      const qty       = parseFloat(l?.['cbc:InvoicedQuantity']?.['#'] ?? l?.['cbc:InvoicedQuantity'] ?? '1');
      const unitPrice = parseFloat(l?.['cac:Price']?.['cbc:PriceAmount']?.['#'] ?? '0');
      const tvaRate   = parseFloat(
        l?.['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:Percent']?.['#'] ??
        l?.['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:Percent'] ?? '19'
      );
      const description = String(
        l?.['cac:Item']?.['cbc:Description']?.['#'] ??
        l?.['cac:Item']?.['cbc:Description'] ??
        l?.['cac:Item']?.['cbc:Name']?.['#'] ??
        l?.['cac:Item']?.['cbc:Name'] ?? 'Article importé'
      );
      const totalHT = parseFloat((qty * unitPrice).toFixed(3));
      return { description, quantity: qty, unitPrice, tvaRate, totalHT };
    });

    // ── Compute totals ───────────────────────────────────────────────────
    const totalHT  = parseFloat(parsedLines.reduce((s: number, l: any) => s + l.totalHT, 0).toFixed(3));
    const totalTVA = parseFloat(parsedLines.reduce((s: number, l: any) => s + l.totalHT * (l.tvaRate / 100), 0).toFixed(3));
    const stampDuty   = 1.000;
    const totalTTC    = parseFloat((totalHT + totalTVA + stampDuty).toFixed(3));
    const netToPay    = totalTTC;

    // ── Create invoice ───────────────────────────────────────────────────
    const created = await prisma.invoice.create({
      data: {
        companyId,
        clientId:  client.id,
        status:    'PENDING_VALIDATION',
        totalHT,
        totalTVA,
        totalTTC,
        stampDuty,
        netToPay,
        lines: {
          create: parsedLines
        }
      },
      include: { client: true, lines: true }
    });

    await createNotif(
      companyId,
      'Facture importée',
      `Facture importée depuis XML avec succès (client: ${created.client?.name ?? 'inconnu'}).`,
      'XML_IMPORTED'
    );

    res.status(201).json({
      message: 'Facture importée avec succès.',
      invoice: created
    });
  } catch (error: any) {
    console.error('Error importing XML:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'import XML.' });
  }
};

