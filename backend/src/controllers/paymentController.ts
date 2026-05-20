import { Request, Response } from 'express';
import prisma from '../prisma';
import { logActivity } from '../services/auditTrailService';
import { getInvoicePaymentSummary } from '../services/paymentService';

const includePayment = { invoice: { include: { client: true } } };
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

const assertOwnedPayment = async (id: string, companyId: string) =>
  prisma.payment.findFirst({ where: { id, companyId }, include: includePayment });

const parseAmount = (value: any) => {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('INVALID_AMOUNT');
  return amount;
};

const syncInvoicePaymentStatus = async (invoiceId: string, companyId: string) => {
  const summary = await getInvoicePaymentSummary(invoiceId, companyId);
  if (summary?.paymentStatus) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { paymentStatus: String(summary.paymentStatus).toLowerCase() },
    });
  }
  return summary;
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { companyId: (req as any).company.id },
      include: includePayment,
      orderBy: { paymentDate: 'desc' },
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await assertOwnedPayment(routeParam(req.params.id), (req as any).company.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createPaymentRecord = async (companyId: string, body: any, invoiceIdFromRoute?: string) => {
  const invoiceId = invoiceIdFromRoute || body.invoiceId;
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, companyId } });
  if (!invoice) throw new Error('INVOICE_NOT_FOUND');

  const payment = await prisma.payment.create({
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

export const createPayment = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const { payment, summary } = await createPaymentRecord(companyId, req.body);
    await logActivity({
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
  } catch (error: any) {
    if (error.message === 'INVOICE_NOT_FOUND') return res.status(404).json({ message: 'Invoice not found' });
    if (error.message === 'INVALID_AMOUNT') return res.status(400).json({ message: 'Invalid payment amount' });
    res.status(500).json({ message: 'Server error' });
  }
};

export const createInvoicePayment = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const { payment, summary } = await createPaymentRecord(companyId, req.body, routeParam(req.params.id));
    await logActivity({
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
  } catch (error: any) {
    if (error.message === 'INVOICE_NOT_FOUND') return res.status(404).json({ message: 'Invoice not found' });
    if (error.message === 'INVALID_AMOUNT') return res.status(400).json({ message: 'Invalid payment amount' });
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const existing = await assertOwnedPayment(routeParam(req.params.id), companyId);
    if (!existing) return res.status(404).json({ message: 'Payment not found' });

    const updated = await prisma.payment.update({
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
    await logActivity({
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
  } catch (error: any) {
    if (error.message === 'INVALID_AMOUNT') return res.status(400).json({ message: 'Invalid payment amount' });
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const existing = await assertOwnedPayment(routeParam(req.params.id), companyId);
    if (!existing) return res.status(404).json({ message: 'Payment not found' });
    await prisma.payment.delete({ where: { id: existing.id } });
    const summary = await syncInvoicePaymentStatus(existing.invoiceId, companyId);
    await logActivity({
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInvoicePayments = async (req: Request, res: Response) => {
  try {
    const summary = await getInvoicePaymentSummary(routeParam(req.params.id), (req as any).company.id);
    if (!summary) return res.status(404).json({ message: 'Invoice not found' });
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
