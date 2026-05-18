import { Request, Response } from 'express';
import prisma from '../prisma';
import { createOfferForCompany, getOfferPublicToken } from '../services/offerService';
import { logActivity } from '../services/auditTrailService';
import { generateBusinessNumber } from '../services/numberingService';

const includeOffer = { client: true, comments: { orderBy: { createdAt: 'desc' as const } } };
const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

const assertOwnedOffer = async (id: string, companyId: string) =>
  prisma.offer.findFirst({ where: { id, companyId }, include: includeOffer });

export const getOffers = async (req: Request, res: Response) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { companyId: (req as any).company.id },
      include: includeOffer,
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOfferById = async (req: Request, res: Response) => {
  try {
    const offer = await assertOwnedOffer(routeParam(req.params.id), (req as any).company.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createOffer = async (req: Request, res: Response) => {
  try {
    if (!req.body.title?.trim()) {
      return res.status(400).json({ message: 'Offer title is required.' });
    }
    const companyId = (req as any).company.id;
    const offer = await createOfferForCompany(companyId, req.body);
    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'CREATED',
      objectType: 'OFFER',
      objectId: offer.id,
      message: `Offre ${offer.number || offer.title} creee.`,
      newValue: offer,
    });
    res.status(201).json(offer);
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOffer = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const existing = await assertOwnedOffer(routeParam(req.params.id), companyId);
    if (!existing) return res.status(404).json({ message: 'Offer not found' });

    const updated = await prisma.offer.update({
      where: { id: existing.id },
      data: {
        clientId: req.body.clientId === '' ? null : req.body.clientId ?? existing.clientId,
        invoiceRequestId: req.body.invoiceRequestId === '' ? null : req.body.invoiceRequestId ?? existing.invoiceRequestId,
        title: req.body.title ?? existing.title,
        description: req.body.description ?? existing.description,
        estimatedAmount: req.body.estimatedAmount !== undefined ? Number(req.body.estimatedAmount) : existing.estimatedAmount,
        deliveryDelay: req.body.deliveryDelay ?? existing.deliveryDelay,
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : existing.validUntil,
        terms: req.body.terms ?? existing.terms,
        purchaseOrderReference: req.body.purchaseOrderReference ?? existing.purchaseOrderReference,
        status: req.body.status ?? existing.status,
      },
      include: includeOffer,
    });

    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'UPDATED',
      objectType: 'OFFER',
      objectId: updated.id,
      message: `Offre ${updated.number || updated.title} mise a jour.`,
      oldValue: existing,
      newValue: updated,
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteOffer = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const existing = await assertOwnedOffer(routeParam(req.params.id), companyId);
    if (!existing) return res.status(404).json({ message: 'Offer not found' });
    await prisma.offer.delete({ where: { id: existing.id } });
    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'DELETED',
      objectType: 'OFFER',
      objectId: existing.id,
      message: `Offre ${existing.number || existing.title} supprimee.`,
      oldValue: existing,
    });
    res.status(200).json({ message: 'Offer removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendOffer = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const existing = await assertOwnedOffer(routeParam(req.params.id), companyId);
    if (!existing) return res.status(404).json({ message: 'Offer not found' });

    const updated = await prisma.offer.update({
      where: { id: existing.id },
      data: { status: 'SENT', publicToken: existing.publicToken || getOfferPublicToken() },
      include: includeOffer,
    });
    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'SENT',
      objectType: 'OFFER',
      objectId: updated.id,
      message: `Offre ${updated.number || updated.title} envoyee au client.`,
      metadata: { publicTokenCreated: !existing.publicToken },
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const convertOfferToDevis = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const offer = await assertOwnedOffer(routeParam(req.params.id), companyId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (!offer.clientId) return res.status(400).json({ message: 'Select a client before converting this offer.' });
    const clientId = offer.clientId;

    const devis = await prisma.$transaction(async (tx) => {
      const visibleNumber = await generateBusinessNumber(tx, companyId, 'DEVIS');
      const totalHT = Number(offer.estimatedAmount || 0);
      const totalTVA = totalHT * 0.19;
      const totalTTC = totalHT + totalTVA;
      const created = await tx.devis.create({
        data: {
          companyId,
          clientId,
          number: visibleNumber,
          status: 'PENDING',
          note: offer.terms || undefined,
          totalHT,
          totalTVA,
          totalTTC,
          stampDuty: 1,
          netToPay: totalTTC + 1,
          lines: {
            create: [{
              description: offer.title,
              quantity: 1,
              unitPrice: totalHT,
              tvaRate: 19,
              totalHT,
            }],
          },
        },
      });
      await tx.offer.update({ where: { id: offer.id }, data: { status: 'CONVERTED_TO_DEVIS' } });
      return created;
    });

    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'STATUS_CHANGED',
      objectType: 'OFFER',
      objectId: offer.id,
      message: `Offre ${offer.number || offer.title} convertie en devis.`,
      metadata: { devisId: devis.id },
    });
    res.status(201).json(devis);
  } catch (error) {
    console.error('Error converting offer to devis:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const convertOfferToInvoice = async (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Conversion directe Offre -> Facture preparee mais non activee. TODO: confirmer les regles metier avant creation fiscale directe.',
  });
};

export const getPublicOffer = async (req: Request, res: Response) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { publicToken: routeParam(req.params.token) }, include: includeOffer });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondToPublicOffer = async (req: Request, res: Response) => {
  try {
    const { action, comment } = req.body;
    const offer = await prisma.offer.findUnique({ where: { publicToken: routeParam(req.params.token) } });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const status =
      action === 'accept' ? 'ACCEPTED' :
      action === 'reject' ? 'REJECTED' :
      'MODIFICATION_REQUESTED';
    const actionType =
      action === 'accept' ? 'ACCEPTED' :
      action === 'reject' ? 'REJECTED' :
      'REQUESTED_CHANGE';

    const updated = await prisma.offer.update({
      where: { id: offer.id },
      data: {
        status,
        comments: comment ? { create: { actorType: 'CLIENT', message: String(comment) } } : undefined,
      },
      include: includeOffer,
    });
    await logActivity({
      companyId: offer.companyId,
      actorType: 'CLIENT',
      actionType,
      objectType: 'OFFER',
      objectId: offer.id,
      message: `Reponse client sur l'offre ${offer.number || offer.title}: ${status}.`,
      metadata: { comment: comment || null },
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error responding to offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
