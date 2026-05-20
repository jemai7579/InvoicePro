"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoicePayments = exports.deletePayment = exports.updatePayment = exports.createInvoicePayment = exports.createPayment = exports.getPaymentById = exports.getPayments = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const auditTrailService_1 = require("../services/auditTrailService");
const paymentService_1 = require("../services/paymentService");
const includePayment = { invoice: { include: { client: true } } };
const routeParam = (value) => Array.isArray(value) ? value[0] : value;
const assertOwnedPayment = async (id, companyId) => prisma_1.default.payment.findFirst({ where: { id, companyId }, include: includePayment });
const parseAmount = (value) => {
    const normalized = String(value ?? '').trim().replace(',', '.');
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0)
        throw new Error('INVALID_AMOUNT');
    return amount;
};
const syncInvoicePaymentStatus = async (invoiceId, companyId) => {
    const summary = await (0, paymentService_1.getInvoicePaymentSummary)(invoiceId, companyId);
    if (summary?.paymentStatus) {
        await prisma_1.default.invoice.update({
            where: { id: invoiceId },
            data: { paymentStatus: String(summary.paymentStatus).toLowerCase() },
        });
    }
    return summary;
};
const getPayments = async (req, res) => {
    try {
        const payments = await prisma_1.default.payment.findMany({
            where: { companyId: req.company.id },
            include: includePayment,
            orderBy: { paymentDate: 'desc' },
        });
        res.status(200).json(payments);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPayments = getPayments;
const getPaymentById = async (req, res) => {
    try {
        const payment = await assertOwnedPayment(routeParam(req.params.id), req.company.id);
        if (!payment)
            return res.status(404).json({ message: 'Payment not found' });
        res.status(200).json(payment);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPaymentById = getPaymentById;
const createPaymentRecord = async (companyId, body, invoiceIdFromRoute) => {
    const invoiceId = invoiceIdFromRoute || body.invoiceId;
    const invoice = await prisma_1.default.invoice.findFirst({ where: { id: invoiceId, companyId } });
    if (!invoice)
        throw new Error('INVOICE_NOT_FOUND');
    const payment = await prisma_1.default.payment.create({
        data: {
            companyId,
            invoiceId,
            amount: parseAmount(body.amount),
            paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
            method: body.method || 'CASH',
            status: body.status || 'PAID',
            reference: body.reference || null,
            notes: body.notes || null,
        },
        include: includePayment,
    });
    const summary = await syncInvoicePaymentStatus(invoiceId, companyId);
    return { payment, summary };
};
const createPayment = async (req, res) => {
    try {
        const companyId = req.company.id;
        const { payment, summary } = await createPaymentRecord(companyId, req.body);
        await (0, auditTrailService_1.logActivity)({
            companyId,
            actorId: companyId,
            actorType: 'USER',
            actionType: summary?.paymentStatus === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'PAID',
            objectType: 'PAYMENT',
            objectId: payment.id,
            message: `Reglement de ${payment.amount.toFixed(3)} TND enregistre.`,
            newValue: payment,
            metadata: { invoiceId: payment.invoiceId, paymentStatus: summary?.paymentStatus },
        });
        res.status(201).json({ payment, summary });
    }
    catch (error) {
        if (error.message === 'INVOICE_NOT_FOUND')
            return res.status(404).json({ message: 'Invoice not found' });
        if (error.message === 'INVALID_AMOUNT')
            return res.status(400).json({ message: 'Invalid payment amount' });
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createPayment = createPayment;
const createInvoicePayment = async (req, res) => {
    try {
        const companyId = req.company.id;
        const { payment, summary } = await createPaymentRecord(companyId, req.body, routeParam(req.params.id));
        await (0, auditTrailService_1.logActivity)({
            companyId,
            actorId: companyId,
            actorType: 'USER',
            actionType: summary?.paymentStatus === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'PAID',
            objectType: 'PAYMENT',
            objectId: payment.id,
            message: `Reglement ajoute sur la facture ${payment.invoice?.number || payment.invoiceId}.`,
            newValue: payment,
            metadata: { invoiceId: payment.invoiceId, paymentStatus: summary?.paymentStatus },
        });
        res.status(201).json({ payment, summary });
    }
    catch (error) {
        if (error.message === 'INVOICE_NOT_FOUND')
            return res.status(404).json({ message: 'Invoice not found' });
        if (error.message === 'INVALID_AMOUNT')
            return res.status(400).json({ message: 'Invalid payment amount' });
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createInvoicePayment = createInvoicePayment;
const updatePayment = async (req, res) => {
    try {
        const companyId = req.company.id;
        const existing = await assertOwnedPayment(routeParam(req.params.id), companyId);
        if (!existing)
            return res.status(404).json({ message: 'Payment not found' });
        const updated = await prisma_1.default.payment.update({
            where: { id: existing.id },
            data: {
                amount: req.body.amount !== undefined ? parseAmount(req.body.amount) : existing.amount,
                paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : existing.paymentDate,
                method: req.body.method ?? existing.method,
                status: req.body.status ?? existing.status,
                reference: req.body.reference ?? existing.reference,
                notes: req.body.notes ?? existing.notes,
            },
            include: includePayment,
        });
        const summary = await syncInvoicePaymentStatus(updated.invoiceId, companyId);
        await (0, auditTrailService_1.logActivity)({
            companyId,
            actorId: companyId,
            actorType: 'USER',
            actionType: updated.status === 'CANCELLED' ? 'CANCELLED' : updated.status === 'PAID' ? 'PAID' : 'UPDATED',
            objectType: 'PAYMENT',
            objectId: updated.id,
            message: updated.status === 'CANCELLED'
                ? `Reglement ${updated.reference || updated.id.slice(0, 8)} annule.`
                : updated.status === 'PAID'
                    ? `Reglement ${updated.reference || updated.id.slice(0, 8)} marque comme paye.`
                    : `Reglement ${updated.reference || updated.id.slice(0, 8)} mis a jour.`,
            oldValue: existing,
            newValue: updated,
            metadata: { invoiceId: updated.invoiceId, paymentStatus: summary?.paymentStatus },
        });
        res.status(200).json({ payment: updated, summary });
    }
    catch (error) {
        if (error.message === 'INVALID_AMOUNT')
            return res.status(400).json({ message: 'Invalid payment amount' });
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updatePayment = updatePayment;
const deletePayment = async (req, res) => {
    try {
        const companyId = req.company.id;
        const existing = await assertOwnedPayment(routeParam(req.params.id), companyId);
        if (!existing)
            return res.status(404).json({ message: 'Payment not found' });
        await prisma_1.default.payment.delete({ where: { id: existing.id } });
        const summary = await syncInvoicePaymentStatus(existing.invoiceId, companyId);
        await (0, auditTrailService_1.logActivity)({
            companyId,
            actorId: companyId,
            actorType: 'USER',
            actionType: 'DELETED',
            objectType: 'PAYMENT',
            objectId: existing.id,
            message: `Reglement ${existing.reference || existing.id.slice(0, 8)} supprime.`,
            oldValue: existing,
            metadata: { invoiceId: existing.invoiceId, paymentStatus: summary?.paymentStatus },
        });
        res.status(200).json({ message: 'Payment removed', summary });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deletePayment = deletePayment;
const getInvoicePayments = async (req, res) => {
    try {
        const summary = await (0, paymentService_1.getInvoicePaymentSummary)(routeParam(req.params.id), req.company.id);
        if (!summary)
            return res.status(404).json({ message: 'Invoice not found' });
        res.status(200).json(summary);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getInvoicePayments = getInvoicePayments;
