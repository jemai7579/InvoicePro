"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.createInvoice = exports.getInvoiceXml = exports.getInvoicePdf = exports.getInvoiceById = exports.getInvoices = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const pdfGenerator_1 = require("../utils/pdfGenerator");
const teifGenerator_1 = require("../utils/teifGenerator");
const getInvoices = async (req, res) => {
    try {
        const invoices = await prisma_1.default.invoice.findMany({
            where: { companyId: req.company.id },
            include: {
                client: true,
                lines: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(invoices);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getInvoices = getInvoices;
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getInvoiceById = getInvoiceById;
const getInvoicePdf = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
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
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const pdfBuffer = await (0, pdfGenerator_1.generateInvoicePdf)(invoice);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.id}.pdf`);
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error('Error generating PDF', error);
        res.status(500).json({ message: 'Server error generating PDF' });
    }
};
exports.getInvoicePdf = getInvoicePdf;
const getInvoiceXml = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
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
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const xmlContent = (0, teifGenerator_1.generateTeifXml)(invoice);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=TEIF_${invoice.id}.xml`);
        res.status(200).send(xmlContent);
    }
    catch (error) {
        console.error('Error generating XML', error);
        // Send back specialized error message for validation failures
        res.status(400).json({ message: error.message || 'Error generating TEIF XML' });
    }
};
exports.getInvoiceXml = getInvoiceXml;
const createInvoice = async (req, res) => {
    try {
        const { devisId, clientId, lines, status, stampDuty, withholdingTax } = req.body;
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
        const invoice = await prisma_1.default.invoice.create({
            data: {
                companyId: req.company.id,
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
            await prisma_1.default.devis.update({
                where: { id: devisId },
                data: { status: 'ACCEPTED' } // Auto-accept devis when turning to invoice
            });
        }
        res.status(201).json(invoice);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createInvoice = createInvoice;
const deleteInvoice = async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        await prisma_1.default.invoice.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: 'Invoice removed' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteInvoice = deleteInvoice;
