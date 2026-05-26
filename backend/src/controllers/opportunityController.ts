import { Request, Response } from 'express';
import prisma from '../prisma';

const getJsonObject = (value: any): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const daysUntil = (dateValue?: string | null) => {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
};

export const getOpportunitySummary = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const [requests, offers, devis, invoices] = await Promise.all([
      prisma.invoiceRequest.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.offer.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.devis.findMany({
        where: { companyId },
        include: { invoice: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.findMany({
        where: {
          companyId,
          devisId: { not: null },
        },
        include: { payments: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const ideas = requests.filter((request) => getJsonObject(request.data).kind === 'PROJECT');
    const sharedIdeasCount = ideas.filter((request) => Boolean(getJsonObject(request.data).connectedCompanyId)).length;
    const devisNotConverted = devis.filter((quote) => !quote.invoice);
    const opportunityDevisIds = new Set(devis.map((quote) => quote.id));
    const opportunityInvoices = invoices.filter((invoice) => invoice.devisId && opportunityDevisIds.has(invoice.devisId));
    const isPaidInvoice = (invoice: (typeof opportunityInvoices)[number]) =>
      ['PAID', 'paid'].includes(String(invoice.paymentStatus || invoice.status)) ||
      invoice.payments.some((payment) => payment.status === 'PAID');
    const unpaidInvoices = opportunityInvoices.filter((invoice) => !isPaidInvoice(invoice));
    const paidInvoices = opportunityInvoices.filter((invoice) => isPaidInvoice(invoice));

    const offersWithoutDevis = offers.filter((offer) => !['CONVERTED_TO_DEVIS', 'CONVERTED_TO_INVOICE'].includes(offer.status));
    const ideasWithoutDevis = Math.max(ideas.length - devis.length, 0);

    const progressScore =
      paidInvoices.length > 0 ? 100 :
      opportunityInvoices.length > 0 ? 80 :
      devis.length > 0 ? 60 :
      offers.length > 0 ? 40 :
      ideas.length > 0 ? 20 :
      0;

    let recommendedAction = {
      type: 'CREATE_IDEA',
      title: 'Commencez votre pipeline',
      description: 'Votre pipeline commercial est vide. Commencez par créer une idée de projet.',
      actionLabel: 'Créer une idée',
      target: 'ideas',
    };

    if (ideas.length > 0 && devis.length === 0) {
      recommendedAction = {
        type: 'CREATE_DEVIS',
        title: 'Transformez vos idées en devis',
        description: `Vous avez ${ideasWithoutDevis || ideas.length} idées sans devis. Transformez une idée en devis pour avancer vers la facturation.`,
        actionLabel: 'Créer un devis',
        target: 'ideas',
      };
    } else if (offersWithoutDevis.length > 0) {
      recommendedAction = {
        type: 'CONVERT_OFFER',
        title: 'Convertissez vos offres',
        description: `Vous avez ${offersWithoutDevis.length} offres ou bons de commande à transformer en devis.`,
        actionLabel: 'Créer un devis',
        target: 'offers',
      };
    } else if (devisNotConverted.length > 0) {
      recommendedAction = {
        type: 'CONVERT_DEVIS',
        title: 'Passez à la facturation',
        description: `Vous avez ${devisNotConverted.length} devis prêts à convertir en facture.`,
        actionLabel: 'Convertir en facture',
        target: 'quotes',
      };
    } else if (unpaidInvoices.length > 0) {
      recommendedAction = {
        type: 'FOLLOW_PAYMENT',
        title: 'Suivez les paiements',
        description: `Vous avez ${unpaidInvoices.length} factures encore impayées.`,
        actionLabel: 'Suivre les règlements',
        target: 'payments',
      };
    }

    const alerts: Array<{ type: string; message: string; actionLabel: string; target: string }> = [];
    if (ideasWithoutDevis > 0) {
      alerts.push({ type: 'IDEAS_WITHOUT_DEVIS', message: `${ideasWithoutDevis} idées n’ont pas encore de devis.`, actionLabel: 'Voir les idées', target: 'ideas' });
    }
    if (offersWithoutDevis.length > 0) {
      alerts.push({ type: 'OFFERS_WITHOUT_DEVIS', message: `${offersWithoutDevis.length} offres attendent une conversion en devis.`, actionLabel: 'Créer un devis', target: 'offers' });
    }
    if (devisNotConverted.length > 0) {
      alerts.push({ type: 'DEVIS_WITHOUT_INVOICE', message: `${devisNotConverted.length} devis attendent une conversion en facture.`, actionLabel: 'Convertir', target: 'quotes' });
    }
    if (unpaidInvoices.length > 0) {
      alerts.push({ type: 'UNPAID_INVOICES', message: `${unpaidInvoices.length} factures sont encore impayées.`, actionLabel: 'Traiter', target: 'payments' });
    }

    const dueSoon = ideas.find((idea) => {
      const remaining = daysUntil(String(getJsonObject(idea.data).deadline || ''));
      return remaining !== null && remaining >= 0 && remaining <= 7;
    });
    if (dueSoon) {
      alerts.push({ type: 'IDEA_DUE_SOON', message: 'Une idée arrive bientôt à échéance.', actionLabel: 'Voir', target: 'ideas' });
    }

    const oldPendingQuote = devisNotConverted.find((quote) => Date.now() - new Date(quote.createdAt).getTime() > 7 * 86400000);
    if (oldPendingQuote) {
      alerts.push({ type: 'OLD_PENDING_DEVIS', message: 'Un devis est en attente depuis plusieurs jours.', actionLabel: 'Voir', target: 'quotes' });
    }

    res.status(200).json({
      ideasCount: ideas.length,
      sharedIdeasCount,
      offersCount: offers.length,
      devisCount: devis.length,
      invoicesCount: opportunityInvoices.length,
      paidInvoicesCount: paidInvoices.length,
      progressScore,
      recommendedAction,
      alerts,
    });
  } catch (error) {
    console.error('Error loading opportunity summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
