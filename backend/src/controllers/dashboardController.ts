import { Request, Response } from 'express';
import prisma from '../prisma';
import { enrichInvoiceWithCompliance } from '../services/teifWorkflowService';
import { getEInvoiceReadiness } from '../services/einvoiceConfig';

const paidStatuses = ['PAID', 'PARTIALLY_PAID'];

const toNumber = (value: any) => Number(value || 0);

const getProjectsForCompany = async (companyId: string) => {
  try {
    return await (prisma as any).project.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  } catch {
    return [];
  }
};

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const [company, clients, invoices, payments, projects, devis] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        include: { subscription: true, adminProfile: true },
      }),
      prisma.client.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.invoice.findMany({
        where: { companyId },
        include: { client: true, lines: true, payments: true, company: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { companyId },
        include: { invoice: { select: { id: true, number: true, netToPay: true, client: { select: { name: true } } } } },
        orderBy: { paymentDate: 'desc' },
        take: 10,
      }),
      getProjectsForCompany(companyId),
      prisma.devis.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
    ]);

    if (!company) return res.status(404).json({ message: 'Company not found' });

    const enrichedInvoices = await Promise.all(invoices.map((invoice) => enrichInvoiceWithCompliance(invoice as any)));
    const totalInvoiced = enrichedInvoices.reduce((sum, invoice: any) => sum + toNumber(invoice.netToPay), 0);
    const totalPaid = payments
      .filter((payment) => paidStatuses.includes(payment.status))
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    const totalUnpaid = Math.max(0, totalInvoiced - totalPaid);
    const paidInvoices = enrichedInvoices.filter((invoice: any) => invoice.paymentStatus === 'paid').length;
    const partiallyPaidInvoices = enrichedInvoices.filter((invoice: any) => invoice.paymentStatus === 'partially_paid').length;
    const unpaidInvoices = enrichedInvoices.filter((invoice: any) => invoice.paymentStatus === 'unpaid').length;
    const overdueInvoices = enrichedInvoices.filter((invoice: any) => {
      const dueDate = new Date(new Date(invoice.createdAt).getTime() + 30 * 86400000);
      return invoice.paymentStatus !== 'paid' && dueDate < new Date();
    }).length;
    const pendingTtn = enrichedInvoices.filter((invoice: any) => ['SENT_TO_TTN', 'PENDING_TTN'].includes(invoice.complianceStatus)).length;
    const readiness = getEInvoiceReadiness(company);
    const acceptedProjects = projects.filter((project: any) => project.status === 'ACCEPTED').length;
    const acceptedQuotes = devis.filter((quote) => ['ACCEPTED', 'CONVERTED_TO_INVOICE'].includes(String(quote.status))).length;

    res.status(200).json({
      totals: {
        clients: clients.length,
        projects: projects.length,
        quotes: devis.length,
        invoices: enrichedInvoices.length,
        paidInvoices,
        partiallyPaidInvoices,
        unpaidInvoices,
        totalInvoiced,
        totalRevenue: totalPaid,
        totalPaid,
        totalUnpaid,
        remainingBalance: totalUnpaid,
        overdueInvoices,
      },
      progress: {
        clients: clients.length > 0 ? 100 : 0,
        projects: projects.length > 0 ? (acceptedProjects / Math.max(projects.length, 1)) * 100 : 0,
        quotes: devis.length > 0 ? (acceptedQuotes / Math.max(devis.length, 1)) * 100 : 0,
        invoices: enrichedInvoices.length > 0 ? (paidInvoices / Math.max(enrichedInvoices.length, 1)) * 100 : 0,
      },
      recentInvoices: enrichedInvoices.slice(0, 5),
      recentClients: clients.slice(0, 5),
      recentPayments: payments,
      companyReadiness: {
        profileComplete: Boolean(company.name && company.matriculeFiscal && company.address),
        signatureConfigured: Boolean(company.certificatePath) || company.eHouwiyaStatus === 'HAS_IDENTIFIER',
        ttnMode: readiness.mode,
        ttnConfigured: readiness.ttnConfigured,
        teifReady: readiness.teifConfigured,
        productionAllowed: readiness.canIssueLegalInvoices,
        blockedReasons: readiness.missingRequirements,
        pendingTtn,
      },
      subscription: {
        plan: company.subscription?.plan || 'STARTER',
        status: company.subscription?.status || 'TRIAL',
        endDate: company.subscription?.endDate || null,
        accountStatus: company.adminProfile?.status || null,
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Unable to load dashboard summary' });
  }
};
