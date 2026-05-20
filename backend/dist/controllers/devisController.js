"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDevisEmailController = exports.getDevisPdf = exports.deleteDevis = exports.convertDevisToInvoice = exports.updateDevisStatus = exports.createDevis = exports.getDevisById = exports.getDevis = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const notificationHelper_1 = require("../utils/notificationHelper");
const numberingService_1 = require("../services/numberingService");
const auditTrailService_1 = require("../services/auditTrailService");
const getDevis = async (req, res) => {
    try {
        const devisList = await prisma_1.default.devis.findMany({
            where: { companyId: req.company.id },
            include: {
                client: true,
                lines: true,
                invoice: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(devisList);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getDevis = getDevis;
const getDevisById = async (req, res) => {
    try {
        const devis = await prisma_1.default.devis.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getDevisById = getDevisById;
const createDevis = async (req, res) => {
    try {
        const { clientId, lines, status, stampDuty, withholdingTax, note } = req.body;
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
        const normalizedLines = lines.map((line) => ({
            productId: line.productId || null,
            description: String(line.description || '').trim(),
            quantity: Number(line.quantity || 0),
            unitPrice: Number(line.unitPrice || 0),
            tvaRate: Number(line.tvaRate || 0),
        }));
        if (normalizedLines.some((line) => !line.description || line.quantity <= 0 || line.unitPrice < 0)) {
            return res.status(400).json({ message: 'Each quote line must include a description, quantity and unit price.' });
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
                totalHT: lineTotalHT
            };
        });
        const totalTTC = totalHT + totalTVA;
        const netToPay = totalTTC + (stampDuty || 1.0) - (withholdingTax || 0);
        const normalizedStatus = status === 'ACCEPTED' ? 'ACCEPTED' :
            status === 'REJECTED' || status === 'REFUSED' ? 'REJECTED' :
                'PENDING';
        const devis = await prisma_1.default.$transaction(async (tx) => {
            const number = await (0, numberingService_1.generateBusinessNumber)(tx, companyId, 'DEVIS');
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
        const clientRecord = await prisma_1.default.client.findUnique({ where: { id: clientId } });
        await (0, notificationHelper_1.createNotif)(req.company.id, 'Demande envoyée', `Demande envoyée au client ${clientRecord?.name ?? clientId}.`, 'DEMANDE_SENT');
        await (0, auditTrailService_1.logActivity)({
            companyId,
            actorId: companyId,
            actorType: 'USER',
            actionType: 'CREATED',
            objectType: 'DEVIS',
            objectId: devis.id,
            message: `Devis ${devis.number || devis.id.slice(0, 8)} cree.`,
            newValue: devis,
        });
        res.status(201).json(devis);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createDevis = createDevis;
const updateDevisStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        const devis = await prisma_1.default.devis.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            },
            include: { client: true }
        });
        if (!devis) {
            return res.status(404).json({ message: 'Devis not found' });
        }
        const updatedDevis = await prisma_1.default.devis.update({
            where: { id: req.params.id },
            data: { status }
        });
        // Notification
        const clientName = devis.client?.name ?? devis.clientId;
        if (status === 'ACCEPTED') {
            await (0, notificationHelper_1.createNotif)(req.company.id, 'Demande acceptée', `La demande pour ${clientName} a été acceptée.`, 'DEMANDE_ACCEPTED');
        }
        else if (status === 'REJECTED') {
            await (0, notificationHelper_1.createNotif)(req.company.id, 'Demande rejetée', `La demande pour ${clientName} a été rejetée.`, 'DEMANDE_REJECTED');
        }
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: status === 'ACCEPTED' ? 'ACCEPTED' : status === 'REJECTED' ? 'REJECTED' : 'STATUS_CHANGED',
            objectType: 'DEVIS',
            objectId: devis.id,
            message: `Statut devis change vers ${status}.`,
            oldValue: { status: devis.status },
            newValue: { status },
        });
        res.status(200).json(updatedDevis);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateDevisStatus = updateDevisStatus;
const convertDevisToInvoice = async (req, res) => {
    try {
        const devis = await prisma_1.default.devis.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            },
            include: {
                lines: true
            }
        });
        if (!devis) {
            return res.status(404).json({ message: 'Devis not found' });
        }
        // Check if an invoice already exists for this devis
        const existingInvoice = await prisma_1.default.invoice.findFirst({
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
        const newInvoice = await prisma_1.default.$transaction(async (tx) => {
            const number = await (0, numberingService_1.generateBusinessNumber)(tx, devis.companyId, 'INVOICE');
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
        await (0, auditTrailService_1.logActivity)({
            companyId: devis.companyId,
            actorId: devis.companyId,
            actorType: 'USER',
            actionType: 'STATUS_CHANGED',
            objectType: 'DEVIS',
            objectId: devis.id,
            message: `Devis ${devis.number || devis.id.slice(0, 8)} converti en facture.`,
            metadata: { invoiceId: newInvoice.id },
        });
        res.status(201).json(newInvoice);
    }
    catch (error) {
        console.error('Error converting devis to invoice', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.convertDevisToInvoice = convertDevisToInvoice;
const deleteDevis = async (req, res) => {
    try {
        const devis = await prisma_1.default.devis.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!devis) {
            return res.status(404).json({ message: 'Devis not found' });
        }
        await prisma_1.default.devis.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: 'Devis removed' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteDevis = deleteDevis;
const pdfGenerator_1 = __importDefault(require("../utils/pdfGenerator"));
const mailer_1 = require("../utils/mailer");
const nodemailer_1 = __importDefault(require("nodemailer"));
const getDevisPdf = async (req, res) => {
    try {
        const devis = await prisma_1.default.devis.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
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
        const pdfBuffer = await (0, pdfGenerator_1.default)(devis, 'DEVIS');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Devis_${(0, numberingService_1.sanitizeBusinessNumberForFileName)((0, numberingService_1.getDevisVisibleNumber)(devis))}.pdf`);
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error('Error generating PDF', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
};
exports.getDevisPdf = getDevisPdf;
const sendDevisEmailController = async (req, res) => {
    try {
        const devis = await prisma_1.default.devis.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
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
        const pdfBuffer = await (0, pdfGenerator_1.default)(devis, 'DEVIS');
        // 2. Send Email
        const devisNumber = (0, numberingService_1.getDevisVisibleNumber)(devis);
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
                filename: `Devis_${(0, numberingService_1.sanitizeBusinessNumberForFileName)(devisNumber)}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ];
        const info = await (0, mailer_1.sendEmail)(devis.client.email, subject, html, attachments);
        res.status(200).json({
            message: 'Email sent successfully',
            previewUrl: process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST ? nodemailer_1.default.getTestMessageUrl(info) : undefined
        });
    }
    catch (error) {
        console.error('Error sending devis email:', error);
        res.status(500).json({ message: 'Failed to send email' });
    }
};
exports.sendDevisEmailController = sendDevisEmailController;
