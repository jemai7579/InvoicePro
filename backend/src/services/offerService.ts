import crypto from 'crypto';
import prisma from '../prisma';
import { generateBusinessNumber } from './numberingService';

export const createOfferForCompany = async (companyId: string, payload: any) => {
  return prisma.$transaction(async (tx) => {
    const number = await generateBusinessNumber(tx, companyId, 'OFFER');
    return tx.offer.create({
      data: {
        companyId,
        clientId: payload.clientId || null,
        invoiceRequestId: payload.invoiceRequestId || null,
        number,
        title: String(payload.title || '').trim(),
        description: payload.description || null,
        estimatedAmount: Number(payload.estimatedAmount || 0),
        deliveryDelay: payload.deliveryDelay || null,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
        terms: payload.terms || null,
        purchaseOrderReference: payload.purchaseOrderReference || null,
        status: payload.status || 'DRAFT',
      },
      include: { client: true, comments: true },
    });
  });
};

export const getOfferPublicToken = () => crypto.randomBytes(24).toString('hex');
