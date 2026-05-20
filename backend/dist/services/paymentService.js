"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoicePaymentSummary = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getInvoicePaymentSummary = async (invoiceId, companyId) => {
    const [invoice, payments] = await Promise.all([
        prisma_1.default.invoice.findFirst({ where: { id: invoiceId, companyId } }),
        prisma_1.default.payment.findMany({ where: { invoiceId, companyId } }),
    ]);
    if (!invoice)
        return null;
    const totalPaid = payments
        .filter((payment) => ['PAID', 'PARTIALLY_PAID'].includes(payment.status))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const remainingAmount = Math.max(0, Number(invoice.netToPay || 0) - totalPaid);
    const paymentStatus = totalPaid <= 0 ? 'UNPAID' :
        remainingAmount <= 0 ? 'PAID' :
            'PARTIALLY_PAID';
    return { invoice, payments, totalPaid, remainingAmount, paymentStatus };
};
exports.getInvoicePaymentSummary = getInvoicePaymentSummary;
