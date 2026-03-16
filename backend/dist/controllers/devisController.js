"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDevis = exports.convertDevisToInvoice = exports.updateDevisStatus = exports.createDevis = exports.getDevisById = exports.getDevis = void 0;
const prisma_1 = __importDefault(require("../prisma"));
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
        const { clientId, lines, status, stampDuty, withholdingTax } = req.body;
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
            }
        });
        if (!devis) {
            return res.status(404).json({ message: 'Devis not found' });
        }
        const updatedDevis = await prisma_1.default.devis.update({
            where: { id: req.params.id },
            data: { status }
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
