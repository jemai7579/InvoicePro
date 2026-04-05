"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDevisEmailController = exports.getDevisPdf = exports.deleteDevis = exports.convertDevisToInvoice = exports.updateDevisStatus = exports.createDevis = exports.getDevisById = exports.getDevis = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const notificationHelper_1 = require("../utils/notificationHelper");
const getDevis = async (req, res) => {
    try {
        const devisList = await prisma_1.default.devis.findMany({
            where: { companyId: req.company.id },
            include: {
                client: true,
                lines: true
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
                lines: true
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
        if (!clientId || !lines || lines.length === 0) {
            return res.status(400).json({ message: 'Client ID and at least one line are required' });
        }
        let totalHT = 0;
        let totalTVA = 0;
        const processedLines = lines.map((line) => {
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
        const devis = await prisma_1.default.devis.create({
            data: {
                companyId: req.company.id,
                clientId,
                status: status || 'PENDING',
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
                lines: true
            }
        });
        // Notification
        const client = await prisma_1.default.client.findUnique({ where: { id: clientId } });
        await (0, notificationHelper_1.createNotif)(req.company.id, 'Demande envoyée', `Demande envoyée au client ${client?.name ?? clientId}.`, 'DEMANDE_SENT');
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
        const invoiceLinesToCreate = devis.lines.map(line => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            tvaRate: line.tvaRate,
            totalHT: line.totalHT
        }));
        const newInvoice = await prisma_1.default.invoice.create({
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
        await prisma_1.default.devis.update({
            where: { id: devis.id },
            data: { status: 'ACCEPTED' }
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
        res.setHeader('Content-Disposition', `attachment; filename=Devis_${devis.id}.pdf`);
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
