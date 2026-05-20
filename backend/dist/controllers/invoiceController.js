"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importInvoiceXml = exports.checkTTNStatusController = exports.submitToTTNController = exports.updateInvoiceStatus = exports.sendInvoiceEmailController = exports.deleteInvoice = exports.updateInvoice = exports.createInvoice = exports.signInvoiceTeifController = exports.generateInvoiceTeifController = exports.validateInvoiceTeifController = exports.getInvoiceXml = exports.getFinalInvoicePdf = exports.getInvoicePdf = exports.getInvoiceById = exports.getInvoices = void 0;
const xmlbuilder2_1 = require("xmlbuilder2");
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = __importDefault(require("../prisma"));
const pdfGenerator_1 = __importDefault(require("../utils/pdfGenerator"));
const notificationHelper_1 = require("../utils/notificationHelper");
const mailer_1 = require("../utils/mailer");
const teifWorkflowService_1 = require("../services/teifWorkflowService");
const numberingService_1 = require("../services/numberingService");
const complianceStorage_1 = require("../services/complianceStorage");
const auditTrailService_1 = require("../services/auditTrailService");
const VALID_STATUSES = ['DRAFT', 'VALIDATED', 'TEIF_GENERATED', 'SIGNED', 'SENT_TO_TTN', 'PENDING_TTN', 'ACCEPTED_TTN', 'REJECTED_TTN', 'CANCELLED'];
const getOwnedInvoice = async (invoiceId, companyId) => (0, teifWorkflowService_1.getInvoiceByIdForCompliance)(invoiceId, companyId);
const getSerializedInvoice = async (invoiceId, companyId) => {
    const invoice = await getOwnedInvoice(invoiceId, companyId);
    return invoice ? (0, teifWorkflowService_1.enrichInvoiceWithCompliance)(invoice) : null;
};
const normalizeInvoiceLine = (line) => ({
    productId: line.productId || null,
    description: String(line.description || '').trim(),
    quantity: Number(line.quantity || 0),
    unitPrice: Number(line.unitPrice || 0),
    tvaRate: Number(line.tvaRate || 0),
});
const buildInvoiceTotals = (normalizedLines, stampDuty = 1.0, withholdingTax = 0) => {
    let totalHT = 0;
    let totalTVA = 0;
    const processedLines = normalizedLines.map((line) => {
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
const getInvoices = async (req, res) => {
    try {
        const invoices = await prisma_1.default.invoice.findMany({
            where: { companyId: req.company.id },
            include: {
                company: true,
                client: true,
                lines: true,
                payments: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const enriched = await Promise.all(invoices.map((invoice) => (0, teifWorkflowService_1.enrichInvoiceWithCompliance)(invoice)));
        res.status(200).json(enriched);
    }
    catch (error) {
        console.error('Error loading invoices:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getInvoices = getInvoices;
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id,
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
        res.status(200).json(await (0, teifWorkflowService_1.enrichInvoiceWithCompliance)(invoice));
    }
    catch (error) {
        console.error('Error loading invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getInvoiceById = getInvoiceById;
const getInvoicePdf = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const enriched = await (0, teifWorkflowService_1.enrichInvoiceWithCompliance)(invoice);
        const pdfBuffer = await (0, pdfGenerator_1.default)(invoice, 'FACTURE', enriched);
        const invoiceNumber = (0, numberingService_1.sanitizeBusinessNumberForFileName)((0, numberingService_1.getInvoiceVisibleNumber)(invoice));
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: 'PDF_DOWNLOADED',
            objectType: 'INVOICE',
            objectId: invoice.id,
            message: 'PDF facture telecharge.',
            metadata: { final: false },
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoiceNumber}.pdf`);
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error('Error generating PDF', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
};
exports.getInvoicePdf = getInvoicePdf;
const getFinalInvoicePdf = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const { pdfBuffer } = await (0, teifWorkflowService_1.finalizeInvoicePdf)(invoice);
        const invoiceNumber = (0, numberingService_1.sanitizeBusinessNumberForFileName)((0, numberingService_1.getInvoiceVisibleNumber)(invoice));
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: 'PDF_DOWNLOADED',
            objectType: 'INVOICE',
            objectId: invoice.id,
            message: 'PDF final facture telecharge.',
            metadata: { final: true },
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoiceNumber}_final.pdf`);
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error('Error generating final invoice PDF', error);
        res.status(400).json({ message: error.message || 'Final PDF is not available yet.' });
    }
};
exports.getFinalInvoicePdf = getFinalInvoicePdf;
const getInvoiceXml = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const xmlContent = await (0, teifWorkflowService_1.getDownloadableTeifXml)(invoice);
        const invoiceNumber = (0, numberingService_1.sanitizeBusinessNumberForFileName)((0, numberingService_1.getInvoiceVisibleNumber)(invoice));
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: 'XML_DOWNLOADED',
            objectType: 'INVOICE',
            objectId: invoice.id,
            message: 'XML TEIF telecharge.',
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=TEIF_${invoiceNumber}.xml`);
        res.status(200).send(xmlContent);
    }
    catch (error) {
        console.error('Error generating XML', error);
        res.status(400).json({ message: error.message || 'Error generating TEIF XML' });
    }
};
exports.getInvoiceXml = getInvoiceXml;
const validateInvoiceTeifController = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const validation = await (0, teifWorkflowService_1.validateTeifXml)(invoice);
        if (!validation.valid) {
            return res.status(400).json(validation);
        }
        res.status(200).json({
            valid: true,
            message: 'Les donnees de la facture sont pretes pour la generation TEIF.',
        });
    }
    catch (error) {
        console.error('Error validating TEIF XML', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
exports.validateInvoiceTeifController = validateInvoiceTeifController;
const generateInvoiceTeifController = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const { metadata } = await (0, teifWorkflowService_1.generateInvoiceTeifXml)(invoice);
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: 'XML_GENERATED',
            objectType: 'INVOICE',
            objectId: invoice.id,
            message: 'XML TEIF genere pour la facture.',
            metadata: { teifXmlPath: metadata.teifXmlPath },
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        const updatedInvoice = await getSerializedInvoice(invoice.id, req.company.id);
        res.status(200).json({
            message: 'Le fichier XML TEIF a ete genere avec succes.',
            teifXmlPath: metadata.teifXmlPath,
            invoice: updatedInvoice,
        });
    }
    catch (error) {
        console.error('Error generating invoice TEIF', error);
        res.status(400).json({ message: error.message || 'Failed to generate TEIF XML.' });
    }
};
exports.generateInvoiceTeifController = generateInvoiceTeifController;
const signInvoiceTeifController = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const { metadata } = await (0, teifWorkflowService_1.signInvoiceTeifXml)(invoice, req.company.id);
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: 'SIGNED',
            objectType: 'INVOICE',
            objectId: invoice.id,
            message: 'Facture signee electroniquement.',
            metadata: { signatureProvider: metadata.signatureProvider },
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        const updatedInvoice = await getSerializedInvoice(invoice.id, req.company.id);
        const isMockSignature = metadata.signatureStatus === 'mock_signed';
        res.status(200).json({
            message: isMockSignature
                ? "La facture a été signée en mode simulation. Ce document n'a pas de valeur légale."
                : 'La facture a été signée électroniquement avec succès via le fournisseur configuré.',
            signedXmlPath: metadata.signedXmlPath,
            signatureProvider: metadata.signatureProvider,
            invoice: updatedInvoice,
        });
    }
    catch (error) {
        console.error('Error signing TEIF XML', error);
        const companyId = req.company?.id;
        if (companyId) {
            await (0, auditTrailService_1.logActivity)({
                companyId,
                actorId: companyId,
                actorType: 'USER',
                actionType: 'SIGNATURE_FAILED',
                objectType: 'INVOICE',
                objectId: req.params.id,
                message: 'Signature electronique echouee.',
                errorMessage: error.message,
                ...(0, auditTrailService_1.getRequestAuditMeta)(req),
            }).catch(console.error);
        }
        res.status(400).json({ message: error.message || 'Failed to sign TEIF XML.' });
    }
};
exports.signInvoiceTeifController = signInvoiceTeifController;
const createInvoice = async (req, res) => {
    try {
        const { devisId, clientId, lines, stampDuty, withholdingTax } = req.body;
        const companyId = req.company.id;
        if (!clientId || !lines || lines.length === 0) {
            return res.status(400).json({ message: 'Client ID and at least one line are required' });
        }
        const client = await prisma_1.default.client.findFirst({
            where: { id: clientId, companyId },
            select: { id: true },
        });
        if (!client) {
            return res.status(400).json({ message: 'Selected client does not belong to your company.' });
        }
        const normalizedLines = lines.map(normalizeInvoiceLine);
        if (normalizedLines.some((line) => !line.description || line.quantity <= 0 || line.unitPrice < 0)) {
            return res.status(400).json({ message: 'Each invoice line must include a description, quantity and unit price.' });
        }
        const productIds = Array.from(new Set(normalizedLines
            .map((line) => line.productId)
            .filter((productId) => Boolean(productId))));
        if (productIds.length > 0) {
            const ownedProducts = await prisma_1.default.product.findMany({
                where: { companyId, id: { in: productIds } },
                select: { id: true },
            });
            if (ownedProducts.length !== productIds.length) {
                return res.status(400).json({ message: 'One or more selected products do not belong to your company.' });
            }
        }
        const safeStampDuty = Number(stampDuty ?? 1.0);
        const safeWithholdingTax = Number(withholdingTax ?? 0);
        const { processedLines, totalHT, totalTVA, totalTTC, netToPay } = buildInvoiceTotals(normalizedLines, safeStampDuty, safeWithholdingTax);
        const createdInvoice = await prisma_1.default.$transaction(async (tx) => {
            // Assign the invoice number immediately at creation so it is visible
            // even while the invoice is still a draft.
            const number = await (0, numberingService_1.generateBusinessNumber)(tx, companyId, 'INVOICE');
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
        await (0, auditTrailService_1.logActivity)({
            companyId,
            actorId: companyId,
            actorType: 'USER',
            actionType: 'CREATED',
            objectType: 'INVOICE',
            objectId: createdInvoice.id,
            message: 'Facture creee.',
            newValue: invoice,
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        res.status(201).json(invoice);
    }
    catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createInvoice = createInvoice;
const updateInvoice = async (req, res) => {
    try {
        const { clientId, lines, stampDuty, withholdingTax } = req.body;
        const companyId = req.company.id;
        const existingInvoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
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
        const client = await prisma_1.default.client.findFirst({
            where: { id: clientId, companyId },
            select: { id: true },
        });
        if (!client) {
            return res.status(400).json({ message: 'Selected client does not belong to your company.' });
        }
        const normalizedLines = lines.map(normalizeInvoiceLine);
        if (normalizedLines.some((line) => !line.description || line.quantity <= 0 || line.unitPrice < 0)) {
            return res.status(400).json({ message: 'Each invoice line must include a description, quantity and unit price.' });
        }
        const productIds = Array.from(new Set(normalizedLines
            .map((line) => line.productId)
            .filter((productId) => Boolean(productId))));
        if (productIds.length > 0) {
            const ownedProducts = await prisma_1.default.product.findMany({
                where: { companyId, id: { in: productIds } },
                select: { id: true },
            });
            if (ownedProducts.length !== productIds.length) {
                return res.status(400).json({ message: 'One or more selected products do not belong to your company.' });
            }
        }
        const safeStampDuty = Number(stampDuty ?? 1.0);
        const safeWithholdingTax = Number(withholdingTax ?? 0);
        const { processedLines, totalHT, totalTVA, totalTTC, netToPay } = buildInvoiceTotals(normalizedLines, safeStampDuty, safeWithholdingTax);
        await prisma_1.default.$transaction(async (tx) => {
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
        await (0, complianceStorage_1.writeComplianceMetadata)(companyId, existingInvoice.id, {
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
        await (0, auditTrailService_1.logActivity)({
            companyId,
            actorId: companyId,
            actorType: 'USER',
            actionType: 'UPDATED',
            objectType: 'INVOICE',
            objectId: existingInvoice.id,
            message: 'Facture mise a jour et remise en brouillon.',
            oldValue: existingInvoice,
            newValue: updated,
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        res.status(200).json(updated);
    }
    catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.updateInvoice = updateInvoice;
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id,
            },
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        await prisma_1.default.invoice.delete({
            where: { id: req.params.id },
        });
        res.status(200).json({ message: 'Invoice removed' });
    }
    catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteInvoice = deleteInvoice;
const sendInvoiceEmailController = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (!invoice.client.email) {
            return res.status(400).json({ message: 'Client does not have an email address' });
        }
        const enriched = await (0, teifWorkflowService_1.enrichInvoiceWithCompliance)(invoice);
        const pdfBuffer = await (0, pdfGenerator_1.default)(invoice, 'FACTURE', enriched);
        const xmlContent = await (0, teifWorkflowService_1.getDownloadableTeifXml)(invoice);
        const invoiceNumber = (0, numberingService_1.getInvoiceVisibleNumber)(invoice);
        const safeInvoiceNumber = (0, numberingService_1.sanitizeBusinessNumberForFileName)(invoiceNumber);
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
        const info = await (0, mailer_1.sendEmail)(invoice.client.email, subject, html, attachments);
        res.status(200).json({
            message: 'Email sent successfully',
            previewUrl: process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST
                ? nodemailer_1.default.getTestMessageUrl(info)
                : undefined,
        });
    }
    catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({ message: 'Failed to send email' });
    }
};
exports.sendInvoiceEmailController = sendInvoiceEmailController;
const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `Statut invalide. Valeurs acceptees : ${VALID_STATUSES.join(', ')}`,
            });
        }
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id,
            },
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (status === 'VALIDATED') {
            if (invoice.status !== 'DRAFT' && invoice.status !== 'REJECTED_TTN') {
                return res.status(400).json({ message: 'Only draft or rejected invoices can be validated.' });
            }
            const ownedInvoice = await getOwnedInvoice(req.params.id, req.company.id);
            if (!ownedInvoice) {
                return res.status(404).json({ message: 'Invoice not found' });
            }
            const validation = await (0, teifWorkflowService_1.validateTeifXml)({
                ...ownedInvoice,
                status: 'VALIDATED',
                number: ownedInvoice.number || 'PENDING_VALIDATION_NUMBER',
            });
            if (!validation.valid) {
                return res.status(400).json({ message: validation.errors.join(' ') });
            }
            await prisma_1.default.$transaction(async (tx) => {
                const number = invoice.number || await (0, numberingService_1.generateBusinessNumber)(tx, req.company.id, 'INVOICE');
                await tx.invoice.update({
                    where: { id: req.params.id },
                    data: {
                        number,
                        status: 'VALIDATED',
                        ttnStatus: 'VALIDATED',
                        legalStatus: 'ready_for_signature',
                    },
                });
            });
            await (0, complianceStorage_1.appendComplianceStatus)(req.company.id, req.params.id, 'VALIDATED', {}, 'Invoice validated');
        }
        else {
            await prisma_1.default.invoice.update({
                where: { id: req.params.id },
                data: { status },
            });
        }
        const updated = await getSerializedInvoice(req.params.id, req.company.id);
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: status === 'VALIDATED' ? 'STATUS_CHANGED' : 'UPDATED',
            objectType: 'INVOICE',
            objectId: req.params.id,
            message: `Statut facture change vers ${status}.`,
            metadata: { status },
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        res.status(200).json(updated);
    }
    catch (error) {
        console.error('Error updating invoice status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateInvoiceStatus = updateInvoiceStatus;
const submitToTTNController = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const result = await (0, teifWorkflowService_1.submitInvoiceToTTNWorkflow)(invoice);
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: 'SUBMITTED_TTN',
            objectType: 'TTN_SUBMISSION',
            objectId: invoice.id,
            message: 'Facture envoyee a TTN.',
            metadata: { message: result.message },
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        const updatedInvoice = await getSerializedInvoice(invoice.id, req.company.id);
        res.status(200).json({
            message: result.message,
            invoice: updatedInvoice,
        });
    }
    catch (error) {
        console.error('Error submitting to TTN:', error);
        res.status(400).json({ message: error.message || 'Server error during TTN submission' });
    }
};
exports.submitToTTNController = submitToTTNController;
const checkTTNStatusController = async (req, res) => {
    try {
        const invoice = await getOwnedInvoice(req.params.id, req.company.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const { simulateDecision } = req.body || {};
        const { result } = await (0, teifWorkflowService_1.syncInvoiceTTNStatus)(invoice, simulateDecision || null);
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorType: 'TTN',
            actionType: result.status === 'ACCEPTED_TTN' ? 'VALIDATED_TTN' : result.status === 'REJECTED_TTN' ? 'REJECTED_TTN' : 'STATUS_CHANGED',
            objectType: 'TTN_SUBMISSION',
            objectId: invoice.id,
            message: result.message,
            metadata: { status: result.status, ttnReference: result.ttnReference, rejectionReason: result.rejectionReason },
            ...(0, auditTrailService_1.getRequestAuditMeta)(req),
        });
        const updatedInvoice = await getSerializedInvoice(invoice.id, req.company.id);
        res.status(200).json({
            message: result.message,
            status: result.status,
            ttnReference: result.ttnReference,
            rejectionReason: result.rejectionReason,
            invoice: updatedInvoice,
        });
    }
    catch (error) {
        console.error('Error checking TTN status:', error);
        res.status(400).json({ message: error.message || 'Unable to sync TTN status.' });
    }
};
exports.checkTTNStatusController = checkTTNStatusController;
const importInvoiceXml = async (req, res) => {
    try {
        const xmlString = req.file?.buffer?.toString('utf-8') ?? req.body?.xml;
        if (!xmlString) {
            return res.status(400).json({ message: 'Aucun fichier XML fourni.' });
        }
        let doc;
        try {
            doc = (0, xmlbuilder2_1.convert)(xmlString, { format: 'object' });
        }
        catch {
            return res.status(400).json({ message: 'XML invalide ou non lisible.' });
        }
        const invoice = doc?.Invoice ?? doc;
        const companyId = req.company.id;
        const customerParty = invoice?.['cac:AccountingCustomerParty']?.['cac:Party'];
        const clientMf = customerParty?.['cac:PartyIdentification']?.['cbc:ID']?.['#'] ??
            customerParty?.['cac:PartyIdentification']?.['cbc:ID'];
        const clientName = customerParty?.['cac:PartyName']?.['cbc:Name']?.['#'] ??
            customerParty?.['cac:PartyName']?.['cbc:Name'] ??
            'Importe depuis XML';
        const clientAddress = customerParty?.['cac:PostalAddress']?.['cbc:StreetName']?.['#'] ??
            customerParty?.['cac:PostalAddress']?.['cbc:StreetName'] ??
            '';
        const clientCity = customerParty?.['cac:PostalAddress']?.['cbc:CityName']?.['#'] ??
            customerParty?.['cac:PostalAddress']?.['cbc:CityName'] ??
            '';
        const clientEmail = customerParty?.['cac:Contact']?.['cbc:ElectronicMail']?.['#'] ??
            customerParty?.['cac:Contact']?.['cbc:ElectronicMail'] ??
            undefined;
        const clientPhone = customerParty?.['cac:Contact']?.['cbc:Telephone']?.['#'] ??
            customerParty?.['cac:Contact']?.['cbc:Telephone'] ??
            undefined;
        let client = null;
        if (clientMf && clientMf !== 'NOT_PROVIDED') {
            client = await prisma_1.default.client.findFirst({ where: { companyId, matriculeFiscal: String(clientMf) } });
        }
        if (!client) {
            client = await prisma_1.default.client.create({
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
        const parsedLines = lineArray.map((line) => {
            const qty = parseFloat(line?.['cbc:InvoicedQuantity']?.['#'] ?? line?.['cbc:InvoicedQuantity'] ?? '1');
            const unitPrice = parseFloat(line?.['cac:Price']?.['cbc:PriceAmount']?.['#'] ?? '0');
            const tvaRate = parseFloat(line?.['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:Percent']?.['#'] ??
                line?.['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:Percent'] ??
                '19');
            const description = String(line?.['cac:Item']?.['cbc:Description']?.['#'] ??
                line?.['cac:Item']?.['cbc:Description'] ??
                line?.['cac:Item']?.['cbc:Name']?.['#'] ??
                line?.['cac:Item']?.['cbc:Name'] ??
                'Article importe');
            const totalHT = parseFloat((qty * unitPrice).toFixed(3));
            return { description, quantity: qty, unitPrice, tvaRate, totalHT };
        });
        const totalHT = parseFloat(parsedLines.reduce((sum, line) => sum + line.totalHT, 0).toFixed(3));
        const totalTVA = parseFloat(parsedLines.reduce((sum, line) => sum + line.totalHT * (line.tvaRate / 100), 0).toFixed(3));
        const stampDuty = 1.0;
        const totalTTC = parseFloat((totalHT + totalTVA + stampDuty).toFixed(3));
        const netToPay = totalTTC;
        const created = await prisma_1.default.$transaction(async (tx) => {
            const number = await (0, numberingService_1.generateBusinessNumber)(tx, companyId, 'INVOICE');
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
        await (0, notificationHelper_1.createNotif)(companyId, 'Facture importee', `Facture importee depuis XML avec succes (client: ${client?.name ?? 'inconnu'}).`, 'XML_IMPORTED');
        res.status(201).json({
            message: 'Facture importee avec succes.',
            invoice: await getSerializedInvoice(created.id, companyId),
        });
    }
    catch (error) {
        console.error('Error importing XML:', error);
        res.status(500).json({ message: "Erreur serveur lors de l'import XML." });
    }
};
exports.importInvoiceXml = importInvoiceXml;
