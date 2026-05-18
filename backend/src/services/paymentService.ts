import prisma from '../prisma';

export const getInvoicePaymentSummary = async (invoiceId: string, companyId: string) => {
  const [invoice, payments] = await Promise.all([
    prisma.invoice.findFirst({ where: { id: invoiceId, companyId } }),
    prisma.payment.findMany({ where: { invoiceId, companyId } }),
  ]);

  if (!invoice) return null;

  const totalPaid = payments
    .filter((payment) => ['PAID', 'PARTIALLY_PAID'].includes(payment.status))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remainingAmount = Math.max(0, Number(invoice.netToPay || 0) - totalPaid);
  const paymentStatus =
    totalPaid <= 0 ? 'UNPAID' :
    remainingAmount <= 0 ? 'PAID' :
    'PARTIALLY_PAID';

  return { invoice, payments, totalPaid, remainingAmount, paymentStatus };
};

