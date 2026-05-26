import { Request, Response } from 'express';
import { convert } from 'xmlbuilder2';
import nodemailer from 'nodemailer';
import prisma from '../prisma';
import generatePdf from '../utils/pdfGenerator';
import { createNotif } from '../utils/notificationHelper';
import { sendEmail } from '../utils/mailer';
import {
  enrichInvoiceWithCompliance,
  finalizeInvoicePdf,
  generateInvoiceTeifXml,
  getDownloadableTeifXml,
  getInvoiceByIdForCompliance,
  signInvoiceTeifXml,
  submitInvoiceToTTNWorkflow,
  syncInvoiceTTNStatus,
  validateTeifXml,
} from '../services/teifWorkflowService';
import {
  generateBusinessNumber,
  getInvoiceVisibleNumber,
  sanitizeBusinessNumberForFileName,
} from '../services/numberingService';
import { appendComplianceStatus, writeComplianceMetadata } from '../services/complianceStorage';
import { logActivity, getRequestAuditMeta } from '../services/auditTrailService';

const MANUAL_STATUSES = ['DRAFT', 'VALIDATED', 'CANCELLED'];
const WORKFLOW_ONLY_STATUSES = ['TEIF_GENERATED', 'SIGNED', 'SENT_TO_TTN', 'PENDING_TTN', 'ACCEPTED_TTN', 'REJECTED_TTN'];

const getOwnedInvoice = async (invoiceId: string, companyId: string) =>
  getInvoiceByIdForCompliance(invoiceId, companyId);

const getSerializedInvoice = async (invoiceId: string, companyId: string) => {
  const invoice = await getOwnedInvoice(invoiceId, companyId);
  return invoice ? enrichInvoiceWithCompliance(invoice as any) : null;
};

type NormalizedInvoiceLine = {
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
};

const normalizeInvoiceLine = (line: any) => ({
  productId: line.productId || null,
  description: String(line.description || '').trim(),
  quantity: Number(line.quantity || 0),
  unitPrice: Number(line.unitPrice || 0),
  tvaRate: Number(line.tvaRate || 0),
}) satisfies NormalizedInvoiceLine;

const buildInvoiceTotals = (normalizedLines: NormalizedInvoiceLine[], stampDuty = 1.0, withholdingTax = 0) => {
  let totalHT = 0;
  let totalTVA = 0;

  const processedLines = normalizedLines.map((line: NormalizedInvoiceLine) => {
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
      totalHT: lineTotalHT,
    };
  });

  const totalTTC = totalHT + totalTVA;
  const netToPay = totalTTC + stampDuty - withholdingTax;

  return {
    processedLines,
    totalHT,
    totalTVA,
    totalTTC,
    netToPay,
  };
};

const validateActiveTvaRates = async (lines: NormalizedInvoiceLine[]) => {
  const activeRates = await prisma.tvaRate.findMany({ where: { active: true }, select: { rate: true } });
  const allowedRates = activeRates.length ? activeRates.map((item) => item.rate) : [0, 7, 13, 19];
  return lines.every((line) => allowedRates.includes(line.tvaRate));
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { companyId: (req as any).company.id },
      include: {
        company: true,
        client: true,
        lines: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(invoices.map((invoice) => enrichInvoiceWithCompliance(invoice as any)));
    res.status(200).json(enriched);
  } catch (error) {
    console.error('Error loading invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id as string,
        companyId: (req as any).company.id,
      },
      include: {
        client: true,
        lines: true,
        company: true,
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json(await enrichInvoiceWithCompliance(invoice as any));
  } catch (error) {
    console.error('Error loading invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoicePdf = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const enriched = await enrichInvoiceWithCompliance(invoice as any);
    const pdfBuffer = await generatePdf(invoice, 'FACTURE', enriched);
    const invoiceNumber = sanitizeBusinessNumberForFileName(getInvoiceVisibleNumber(invoice));
    await logActivity({
      companyId: (req as any).company.id,
      actorId: (req as any).company.id,
      actorType: 'USER',
      actionType: 'PDF_DOWNLOADED',
      objectType: 'INVOICE',
      objectId: invoice.id,
      message: 'PDF facture telecharge.',
      metadata: { final: false },
      ...getRequestAuditMeta(req),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoiceNumber}.pdf`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF', error);
    res.status(500).json({ message: 'Server error generating PDF' });
  }
};

export const getFinalInvoicePdf = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { pdfBuffer } = await finalizeInvoicePdf(invoice as any);
    const invoiceNumber = sanitizeBusinessNumberForFileName(getInvoiceVisibleNumber(invoice));
    await logActivity({
      companyId: (req as any).company.id,
      actorId: (req as any).company.id,
      actorType: 'USER',
      actionType: 'PDF_DOWNLOADED',
      objectType: 'INVOICE',
      objectId: invoice.id,
      message: 'PDF final facture telecharge.',
      metadata: { final: true },
      ...getRequestAuditMeta(req),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoiceNumber}_final.pdf`);
    res.status(200).send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating final invoice PDF', error);
    res.status(400).json({ message: error.message || 'Final PDF is not available yet.' });
  }
};

export const getInvoiceXml = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const xmlContent = await getDownloadableTeifXml(invoice as any);
    const invoiceNumber = sanitizeBusinessNumberForFileName(getInvoiceVisibleNumber(invoice));
    await logActivity({
      companyId: (req as any).company.id,
      actorId: (req as any).company.id,
      actorType: 'USER',
      actionType: 'XML_DOWNLOADED',
      objectType: 'INVOICE',
      objectId: invoice.id,
      message: 'XML TEIF telecharge.',
      ...getRequestAuditMeta(req),
    });

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=TEIF_${invoiceNumber}.xml`);
    res.status(200).send(xmlContent);
  } catch (error: any) {
    console.error('Error generating XML', error);
    res.status(400).json({ message: error.message || 'Error generating TEIF XML' });
  }
};

export const validateInvoiceTeifController = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const validation = await validateTeifXml(invoice as any);
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    res.status(200).json({
      valid: true,
      message: 'Les donnees de la facture sont pretes pour la generation TEIF.',
    });
  } catch (error: any) {
    console.error('Error validating TEIF XML', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const generateInvoiceTeifController = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { metadata } = await generateInvoiceTeifXml(invoice as any);
    await logActivity({
      companyId: (req as any).company.id,
      actorId: (req as any).company.id,
      actorType: 'USER',
      actionType: 'XML_GENERATED',
      objectType: 'INVOICE',
      objectId: invoice.id,
      message: 'XML TEIF genere pour la facture.',
      metadata: { teifXmlPath: metadata.teifXmlPath },
      ...getRequestAuditMeta(req),
    });
    const updatedInvoice = await getSerializedInvoice(invoice.id, (req as any).company.id);
    res.status(200).json({
      message: 'Le fichier XML TEIF a ete genere avec succes.',
      teifXmlPath: metadata.teifXmlPath,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error generating invoice TEIF', error);
    res.status(400).json({ message: error.message || 'Failed to generate TEIF XML.' });
  }
};

export const signInvoiceTeifController = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { metadata } = await signInvoiceTeifXml(invoice as any, (req as any).company.id);
    await logActivity({
      companyId: (req as any).company.id,
      actorId: (req as any).company.id,
      actorType: 'USER',
      actionType: 'SIGNED',
      objectType: 'INVOICE',
      objectId: invoice.id,
      message: 'Facture signee electroniquement.',
      metadata: { signatureProvider: metadata.signatureProvider },
      ...getRequestAuditMeta(req),
    });
    const updatedInvoice = await getSerializedInvoice(invoice.id, (req as any).company.id);
    const isMockSignature = metadata.signatureStatus === 'mock_signed';
    res.status(200).json({
      message: isMockSignature
        ? "La facture a été signée en mode simulation. Ce document n'a pas de valeur légale."
        : 'La facture a été signée électroniquement avec succès via le fournisseur configuré.',
      signedXmlPath: metadata.signedXmlPath,
      signatureProvider: metadata.signatureProvider,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error signing TEIF XML', error);
    const companyId = (req as any).company?.id;
    if (companyId) {
      await logActivity({
        companyId,
        actorId: companyId,
        actorType: 'USER',
        actionType: 'SIGNATURE_FAILED',
        objectType: 'INVOICE',
        objectId: req.params.id as string,
        message: 'Signature electronique echouee.',
        errorMessage: error.message,
        ...getRequestAuditMeta(req),
      }).catch(console.error);
    }
    res.status(400).json({ message: error.message || 'Failed to sign TEIF XML.' });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { devisId, clientId, lines, stampDuty, withholdingTax } = req.body;
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

    const normalizedLines: NormalizedInvoiceLine[] = lines.map(normalizeInvoiceLine);
    if (normalizedLines.some((line) => !line.description || line.quantity <= 0 || line.unitPrice < 0)) {
      return res.status(400).json({ message: 'Each invoice line must include a description, quantity and unit price.' });
    }
    if (!(await validateActiveTvaRates(normalizedLines))) {
      return res.status(400).json({ message: 'One or more TVA rates are not active.' });
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

    const safeStampDuty = Number(stampDuty ?? 1.0);
    const safeWithholdingTax = Number(withholdingTax ?? 0);
    const { processedLines, totalHT, totalTVA, totalTTC, netToPay } = buildInvoiceTotals(
      normalizedLines,
      safeStampDuty,
      safeWithholdingTax
    );

    const createdInvoice = await prisma.$transaction(async (tx) => {
      // Assign the invoice number immediately at creation so it is visible
      // even while the invoice is still a draft.
      const number = await generateBusinessNumber(tx, companyId, 'INVOICE');
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          clientId,
          number,
          devisId: devisId || null,
          status: 'DRAFT',
          ttnStatus: 'DRAFT',
          legalStatus: 'draft',
          paymentStatus: 'unpaid',
          totalHT,
          totalTVA,
          totalTTC,
          stampDuty: safeStampDuty,
          withholdingTax: safeWithholdingTax,
          netToPay,
          lines: {
            create: processedLines,
          },
        },
      });

      if (devisId) {
        await tx.devis.update({
          where: { id: devisId },
          data: { status: 'ACCEPTED' },
        });
      }

      return invoice;
    });

    const invoice = await getSerializedInvoice(createdInvoice.id, companyId);
    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'CREATED',
      objectType: 'INVOICE',
      objectId: createdInvoice.id,
      message: 'Facture creee.',
      newValue: invoice,
      ...getRequestAuditMeta(req),
    });
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { clientId, lines, stampDuty, withholdingTax } = req.body;
    const companyId = (req as any).company.id;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id as string,
        companyId,
      },
      include: {
        lines: true,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!['DRAFT', 'REJECTED_TTN', 'REJECTED'].includes(existingInvoice.status)) {
      return res.status(400).json({ message: 'Only draft or rejected invoices can be edited.' });
    }

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

    const normalizedLines: NormalizedInvoiceLine[] = lines.map(normalizeInvoiceLine);
    if (normalizedLines.some((line) => !line.description || line.quantity <= 0 || line.unitPrice < 0)) {
      return res.status(400).json({ message: 'Each invoice line must include a description, quantity and unit price.' });
    }
    if (!(await validateActiveTvaRates(normalizedLines))) {
      return res.status(400).json({ message: 'One or more TVA rates are not active.' });
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

    const safeStampDuty = Number(stampDuty ?? 1.0);
    const safeWithholdingTax = Number(withholdingTax ?? 0);
    const { processedLines, totalHT, totalTVA, totalTTC, netToPay } = buildInvoiceTotals(
      normalizedLines,
      safeStampDuty,
      safeWithholdingTax
    );

    await prisma.$transaction(async (tx) => {
      await tx.invoiceLine.deleteMany({ where: { invoiceId: existingInvoice.id } });
      await tx.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          clientId,
          status: 'DRAFT',
          ttnStatus: 'DRAFT',
          ttnId: null,
          ttnReference: null,
          legalStatus: 'draft',
          paymentStatus: 'unpaid',
          teifXmlPath: null,
          teifXmlHash: null,
          teifGeneratedAt: null,
          teifVersion: null,
          signedXmlPath: null,
          signatureStatus: null,
          signatureTimestamp: null,
          signedByUserId: null,
          certificateIdentifier: null,
          totalHT,
          totalTVA,
          totalTTC,
          stampDuty: safeStampDuty,
          withholdingTax: safeWithholdingTax,
          netToPay,
          lines: {
            create: processedLines,
          },
        },
      });
    });

    await writeComplianceMetadata(companyId, existingInvoice.id, {
      workflowStatus: 'DRAFT',
      teifXmlPath: null,
      signedXmlPath: null,
      finalizedPdfPath: null,
      ttnSubmissionId: null,
      ttnReference: null,
      ttnRejectionReason: null,
      ttnQrCode: null,
      ttnAcceptedAt: null,
      lastTtnSyncAt: null,
      lastStatusAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'DRAFT',
          at: new Date().toISOString(),
          note: 'Invoice updated and reset to draft',
        },
      ],
    });

    const updated = await getSerializedInvoice(existingInvoice.id, companyId);
    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'UPDATED',
      objectType: 'INVOICE',
      objectId: existingInvoice.id,
      message: 'Facture mise a jour et remise en brouillon.',
      oldValue: existingInvoice,
      newValue: updated,
      ...getRequestAuditMeta(req),
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id as string,
        companyId: (req as any).company.id,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await prisma.invoice.delete({
      where: { id: req.params.id as string },
    });

    res.status(200).json({ message: 'Invoice removed' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendInvoiceEmailController = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.client.email) {
      return res.status(400).json({ message: 'Client does not have an email address' });
    }

    const enriched = await enrichInvoiceWithCompliance(invoice as any);
    const pdfBuffer = await generatePdf(invoice, 'FACTURE', enriched);
    const xmlContent = await getDownloadableTeifXml(invoice as any);

    const invoiceNumber = getInvoiceVisibleNumber(invoice);
    const safeInvoiceNumber = sanitizeBusinessNumberForFileName(invoiceNumber);
    const subject = `Invoice ${invoiceNumber} from ${invoice.company.name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${invoice.client.name},</p>
        <p>Please find attached your invoice <b>${invoiceNumber}</b>.</p>
        <p>Total amount due: <strong>${invoice.netToPay.toFixed(3)} TND</strong></p>
        <br/>
        <p>Thank you for your business!</p>
        <p>${invoice.company.name}</p>
      </div>
    `;

    const attachments = [
      {
        filename: `Invoice_${safeInvoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
      {
        filename: `TEIF_${safeInvoiceNumber}.xml`,
        content: xmlContent,
        contentType: 'application/xml',
      },
    ];

    const info = await sendEmail(invoice.client.email, subject, html, attachments);

    res.status(200).json({
      message: 'Email sent successfully',
      previewUrl:
        process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST
          ? nodemailer.getTestMessageUrl(info)
          : undefined,
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (WORKFLOW_ONLY_STATUSES.includes(status)) {
      return res.status(403).json({
        message: 'This legal invoice status is workflow-controlled and cannot be set manually.',
      });
    }

    if (!status || !MANUAL_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Statut invalide. Valeurs modifiables manuellement : ${MANUAL_STATUSES.join(', ')}`,
      });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id as string,
        companyId: (req as any).company.id,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (WORKFLOW_ONLY_STATUSES.includes(invoice.status) && status !== invoice.status) {
      return res.status(403).json({
        message: 'An invoice in a legal workflow cannot be manually reset or cancelled.',
      });
    }

    if (status === 'VALIDATED') {
      if (invoice.status !== 'DRAFT' && invoice.status !== 'REJECTED_TTN') {
        return res.status(400).json({ message: 'Only draft or rejected invoices can be validated.' });
      }

      const ownedInvoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);
      if (!ownedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const validation = await validateTeifXml({
        ...ownedInvoice,
        status: 'VALIDATED',
        number: ownedInvoice.number || 'PENDING_VALIDATION_NUMBER',
      } as any);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.errors.join(' ') });
      }

      await prisma.$transaction(async (tx) => {
        const number = invoice.number || await generateBusinessNumber(tx, (req as any).company.id, 'INVOICE');
        await tx.invoice.update({
          where: { id: req.params.id as string },
          data: {
            number,
            status: 'VALIDATED',
            ttnStatus: 'VALIDATED',
            legalStatus: 'ready_for_signature',
          },
        });
      });
      await appendComplianceStatus((req as any).company.id, req.params.id as string, 'VALIDATED', {}, 'Invoice validated');
    } else {
      await prisma.invoice.update({
        where: { id: req.params.id as string },
        data: {
          status: status as any,
          ttnStatus: status,
          legalStatus: status === 'CANCELLED' ? 'archived' : 'draft',
        },
      });
      await appendComplianceStatus(
        (req as any).company.id,
        req.params.id as string,
        status as 'DRAFT' | 'CANCELLED',
        {},
        `Invoice manually changed to ${status}`
      );
    }

    const updated = await getSerializedInvoice(req.params.id as string, (req as any).company.id);
    await logActivity({
      companyId: (req as any).company.id,
      actorId: (req as any).company.id,
      actorType: 'USER',
      actionType: status === 'VALIDATED' ? 'STATUS_CHANGED' : 'UPDATED',
      objectType: 'INVOICE',
      objectId: req.params.id as string,
      message: `Statut facture change vers ${status}.`,
      metadata: { status },
      ...getRequestAuditMeta(req),
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitToTTNController = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const result = await submitInvoiceToTTNWorkflow(invoice as any);
    await logActivity({
      companyId: (req as any).company.id,
      actorId: (req as any).company.id,
      actorType: 'USER',
      actionType: 'SUBMITTED_TTN',
      objectType: 'TTN_SUBMISSION',
      objectId: invoice.id,
      message: 'Facture envoyee a TTN.',
      metadata: { message: result.message },
      ...getRequestAuditMeta(req),
    });
    const updatedInvoice = await getSerializedInvoice(invoice.id, (req as any).company.id);
    res.status(200).json({
      message: result.message,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error submitting to TTN:', error);
    res.status(400).json({ message: error.message || 'Server error during TTN submission' });
  }
};

export const checkTTNStatusController = async (req: Request, res: Response) => {
  try {
    const invoice = await getOwnedInvoice(req.params.id as string, (req as any).company.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { simulateDecision } = req.body || {};
    const { result } = await syncInvoiceTTNStatus(invoice as any, simulateDecision || null);
    await logActivity({
      companyId: (req as any).company.id,
      actorType: 'TTN',
      actionType: result.status === 'ACCEPTED_TTN' ? 'VALIDATED_TTN' : result.status === 'REJECTED_TTN' ? 'REJECTED_TTN' : 'STATUS_CHANGED',
      objectType: 'TTN_SUBMISSION',
      objectId: invoice.id,
      message: result.message,
      metadata: { status: result.status, ttnReference: result.ttnReference, rejectionReason: result.rejectionReason },
      ...getRequestAuditMeta(req),
    });
    const updatedInvoice = await getSerializedInvoice(invoice.id, (req as any).company.id);

    res.status(200).json({
      message: result.message,
      status: result.status,
      ttnReference: result.ttnReference,
      rejectionReason: result.rejectionReason,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error checking TTN status:', error);
    res.status(400).json({ message: error.message || 'Unable to sync TTN status.' });
  }
};

export const importInvoiceXml = async (req: Request, res: Response) => {
  try {
    const xmlString: string = (req as any).file?.buffer?.toString('utf-8') ?? req.body?.xml;
    if (!xmlString) {
      return res.status(400).json({ message: 'Aucun fichier XML fourni.' });
    }

    let doc: any;
    try {
      doc = convert(xmlString, { format: 'object' }) as any;
    } catch {
      return res.status(400).json({ message: 'XML invalide ou non lisible.' });
    }

    const invoice = doc?.Invoice ?? doc;
    const companyId = (req as any).company.id;

    const customerParty = invoice?.['cac:AccountingCustomerParty']?.['cac:Party'];
    const clientMf =
      customerParty?.['cac:PartyIdentification']?.['cbc:ID']?.['#'] ??
      customerParty?.['cac:PartyIdentification']?.['cbc:ID'];
    const clientName =
      customerParty?.['cac:PartyName']?.['cbc:Name']?.['#'] ??
      customerParty?.['cac:PartyName']?.['cbc:Name'] ??
      'Importe depuis XML';
    const clientAddress =
      customerParty?.['cac:PostalAddress']?.['cbc:StreetName']?.['#'] ??
      customerParty?.['cac:PostalAddress']?.['cbc:StreetName'] ??
      '';
    const clientCity =
      customerParty?.['cac:PostalAddress']?.['cbc:CityName']?.['#'] ??
      customerParty?.['cac:PostalAddress']?.['cbc:CityName'] ??
      '';
    const clientEmail =
      customerParty?.['cac:Contact']?.['cbc:ElectronicMail']?.['#'] ??
      customerParty?.['cac:Contact']?.['cbc:ElectronicMail'] ??
      undefined;
    const clientPhone =
      customerParty?.['cac:Contact']?.['cbc:Telephone']?.['#'] ??
      customerParty?.['cac:Contact']?.['cbc:Telephone'] ??
      undefined;

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
          city: clientCity ? String(clientCity) : undefined,
          email: clientEmail ? String(clientEmail) : undefined,
          phone: clientPhone ? String(clientPhone) : undefined,
        },
      });
    }

    const rawLines = invoice?.['cac:InvoiceLine'];
    const lineArray = Array.isArray(rawLines) ? rawLines : rawLines ? [rawLines] : [];

    if (lineArray.length === 0) {
      return res.status(400).json({ message: 'Le XML ne contient aucune ligne de facture.' });
    }

    const parsedLines = lineArray.map((line: any) => {
      const qty = parseFloat(line?.['cbc:InvoicedQuantity']?.['#'] ?? line?.['cbc:InvoicedQuantity'] ?? '1');
      const unitPrice = parseFloat(line?.['cac:Price']?.['cbc:PriceAmount']?.['#'] ?? '0');
      const tvaRate = parseFloat(
        line?.['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:Percent']?.['#'] ??
          line?.['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:Percent'] ??
          '19'
      );
      const description = String(
        line?.['cac:Item']?.['cbc:Description']?.['#'] ??
          line?.['cac:Item']?.['cbc:Description'] ??
          line?.['cac:Item']?.['cbc:Name']?.['#'] ??
          line?.['cac:Item']?.['cbc:Name'] ??
          'Article importe'
      );
      const totalHT = parseFloat((qty * unitPrice).toFixed(3));
      return { description, quantity: qty, unitPrice, tvaRate, totalHT };
    });

    const totalHT = parseFloat(parsedLines.reduce((sum: number, line) => sum + line.totalHT, 0).toFixed(3));
    const totalTVA = parseFloat(parsedLines.reduce((sum: number, line) => sum + line.totalHT * (line.tvaRate / 100), 0).toFixed(3));
    const stampDuty = 1.0;
    const totalTTC = parseFloat((totalHT + totalTVA + stampDuty).toFixed(3));
    const netToPay = totalTTC;

    const created = await prisma.$transaction(async (tx) => {
      const number = await generateBusinessNumber(tx, companyId, 'INVOICE');
      return tx.invoice.create({
        data: {
          companyId,
          number,
          clientId: client.id,
          status: 'VALIDATED',
          ttnStatus: 'VALIDATED',
          legalStatus: 'ready_for_signature',
          paymentStatus: 'unpaid',
          totalHT,
          totalTVA,
          totalTTC,
          stampDuty,
          netToPay,
          lines: {
            create: parsedLines,
          },
        },
      });
    });

    await createNotif(
      companyId,
      'Facture importee',
      `Facture importee depuis XML avec succes (client: ${client?.name ?? 'inconnu'}).`,
      'XML_IMPORTED'
    );

    res.status(201).json({
      message: 'Facture importee avec succes.',
      invoice: await getSerializedInvoice(created.id, companyId),
    });
  } catch (error: any) {
    console.error('Error importing XML:', error);
    res.status(500).json({ message: "Erreur serveur lors de l'import XML." });
  }
};
