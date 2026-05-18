import { Request, Response } from 'express';
import prisma from '../prisma';
import { enrichInvoiceWithCompliance } from '../services/teifWorkflowService';
import {
  addAdminNote,
  addTicketReply,
  getAdminNotes,
  getPaymentsStore,
  getSupportTickets,
  getSystemErrorsStore,
  upsertPaymentEntry,
  upsertSupportTicket,
  upsertSystemError,
} from '../services/adminOpsStore';
import { getInvoiceVisibleNumber } from '../services/numberingService';

const PLAN_PRICING: Record<string, number> = {
  STARTER: 0,
  PROFESSIONAL: 99,
  ENTERPRISE: 299,
};

const safeNumber = (value: any) => Number(value || 0);
const getRouteId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

const getAdminId = (req: Request) => (req as any).admin?.id;
const getAdminName = (req: Request) => (req as any).admin?.name || 'Platform admin';

const logAdminAction = async (req: Request, action: string, details: string) => {
  const adminId = getAdminId(req);
  if (!adminId) return;
  await prisma.activityLog.create({
    data: {
      adminId,
      action,
      details: `${details} | ip=${req.ip}`,
    },
  });
};

const getCompaniesBase = async () =>
  prisma.company.findMany({
    include: {
      subscription: true,
      _count: {
        select: {
          invoices: true,
          clients: true,
          devis: true,
          products: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

const getInvoicesEnriched = async () => {
  const invoices = await prisma.invoice.findMany({
    include: {
      company: true,
      client: true,
      lines: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return Promise.all(invoices.map((invoice) => enrichInvoiceWithCompliance(invoice as any)));
};

const buildUserDirectory = async () => {
  const [admins, companies] = await Promise.all([
    prisma.admin.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const platformAdmins = admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: 'Platform admin',
    company: 'El Fatoora',
    status: 'Active',
    lastLogin: admin.updatedAt,
    createdAt: admin.createdAt,
    userType: 'admin',
  }));

  const companyOwners = companies.map((company) => ({
    id: company.id,
    name: company.name,
    email: company.email,
    role: 'Company owner',
    company: company.name,
    status: company.subscription?.status === 'CANCELLED' ? 'Blocked' : 'Active',
    lastLogin: company.updatedAt,
    createdAt: company.createdAt,
    userType: 'company_owner',
  }));

  return [...platformAdmins, ...companyOwners];
};

export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    const [companies, invoices, subscriptions, activityLogs, tickets, systemErrors, manualPayments] = await Promise.all([
      getCompaniesBase(),
      getInvoicesEnriched(),
      prisma.subscription.findMany(),
      prisma.activityLog.findMany({
        take: 12,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { name: true, email: true } } },
      }),
      getSupportTickets(),
      getSystemErrorsStore(),
      getPaymentsStore(),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const totalCompanies = companies.length;
    const activeCompanies = companies.filter((company) => company.subscription?.status === 'ACTIVE').length;
    const cancelledCompanies = companies.filter((company) => company.subscription?.status === 'CANCELLED').length;
    const trialCompanies = companies.filter((company) => !company.subscription || company.subscription.plan === 'STARTER').length;
    const paidCompanies = companies.filter((company) => ['PROFESSIONAL', 'ENTERPRISE'].includes(company.subscription?.plan || '')).length;
    const totalUsers = totalCompanies + (await prisma.admin.count());
    const totalInvoices = invoices.length;
    const ttnSubmitted = invoices.filter((invoice) => ['SUBMITTED_TO_TTN', 'TTN_PROCESSING', 'TTN_ACCEPTED', 'TTN_REJECTED', 'FINALIZED'].includes(invoice.complianceStatus)).length;
    const ttnAccepted = invoices.filter((invoice) => ['TTN_ACCEPTED', 'FINALIZED'].includes(invoice.complianceStatus)).length;
    const ttnRejected = invoices.filter((invoice) => invoice.complianceStatus === 'TTN_REJECTED').length;
    const monthlyRevenue = subscriptions
      .filter((sub) => sub.status === 'ACTIVE')
      .reduce((sum, sub) => sum + (PLAN_PRICING[sub.plan] || 0), 0);
    const pendingPayments = manualPayments.filter((payment) => payment.status === 'pending').length +
      companies.filter((company) => company.subscription?.status === 'ACTIVE' && PLAN_PRICING[company.subscription?.plan || 'STARTER'] > 0).length;
    const openSupportTickets = tickets.filter((ticket) => ['open', 'in_progress', 'waiting_user'].includes(ticket.status)).length;
    const systemErrorsToday = systemErrors.filter((entry) => new Date(entry.createdAt) >= todayStart && entry.status !== 'resolved').length;

    const revenueByMonthMap = new Map<string, number>();
    const companiesByMonthMap = new Map<string, number>();
    const invoicesByMonthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonthMap.set(key, 0);
      companiesByMonthMap.set(key, 0);
      invoicesByMonthMap.set(key, 0);
    }

    subscriptions.forEach((sub) => {
      const key = `${new Date(sub.startDate).getFullYear()}-${String(new Date(sub.startDate).getMonth() + 1).padStart(2, '0')}`;
      if (revenueByMonthMap.has(key) && sub.status === 'ACTIVE') {
        revenueByMonthMap.set(key, (revenueByMonthMap.get(key) || 0) + (PLAN_PRICING[sub.plan] || 0));
      }
    });
    companies.forEach((company) => {
      const key = `${new Date(company.createdAt).getFullYear()}-${String(new Date(company.createdAt).getMonth() + 1).padStart(2, '0')}`;
      if (companiesByMonthMap.has(key)) companiesByMonthMap.set(key, (companiesByMonthMap.get(key) || 0) + 1);
    });
    invoices.forEach((invoice) => {
      const key = `${new Date(invoice.createdAt).getFullYear()}-${String(new Date(invoice.createdAt).getMonth() + 1).padStart(2, '0')}`;
      if (invoicesByMonthMap.has(key)) invoicesByMonthMap.set(key, (invoicesByMonthMap.get(key) || 0) + 1);
    });

    const planDistribution = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map((plan) => ({
      plan,
      count: companies.filter((company) => (company.subscription?.plan || 'STARTER') === plan).length,
    }));

    const alerts = {
      nearQuota: companies
        .filter((company) => company.subscription?.status === 'ACTIVE')
        .map((company) => ({
          companyId: company.id,
          companyName: company.name,
          invoicesUsed: company._count.invoices,
          quota: company.subscription?.plan === 'STARTER' ? 7 : company.subscription?.plan === 'PROFESSIONAL' ? 999999 : 999999,
        }))
        .filter((item) => item.quota !== 999999 && item.invoicesUsed >= item.quota - 1),
      failedTtn: invoices.filter((invoice) => invoice.complianceStatus === 'TTN_REJECTED').slice(0, 10),
      missingSignatures: companies.filter((company) => !company.certificatePath).map((company) => ({ companyId: company.id, companyName: company.name })),
      failedPayments: manualPayments.filter((payment) => payment.status === 'failed'),
      inactiveCompanies: companies.filter((company) => company.updatedAt < thirtyDaysAgo).map((company) => ({ companyId: company.id, companyName: company.name })),
      unresolvedTickets: tickets.filter((ticket) => ['open', 'in_progress', 'waiting_user'].includes(ticket.status)),
    };

    const importantActions = [
      ...alerts.failedTtn.slice(0, 4).map((invoice) => ({
        type: 'TTN_REJECTED',
        label: `TTN rejete pour ${invoice.company?.name}`,
        targetId: invoice.id,
        path: '/admin/ttn',
      })),
      ...alerts.nearQuota.slice(0, 4).map((company) => ({
        type: 'QUOTA',
        label: `${company.companyName} proche du quota`,
        targetId: company.companyId,
        path: '/admin/companies',
      })),
      ...alerts.missingSignatures.slice(0, 4).map((company) => ({
        type: 'SIGNATURE',
        label: `Signature manquante pour ${company.companyName}`,
        targetId: company.companyId,
        path: '/admin/compliance',
      })),
      ...alerts.failedPayments.slice(0, 4).map((payment) => ({
        type: 'PAYMENT',
        label: `Paiement en echec pour ${payment.companyId}`,
        targetId: payment.id,
        path: '/admin/payments',
      })),
      ...alerts.unresolvedTickets.slice(0, 4).map((ticket) => ({
        type: 'SUPPORT',
        label: `Ticket ${ticket.subject}`,
        targetId: ticket.id,
        path: '/admin/support',
      })),
      ...systemErrors.slice(0, 4).map((error) => ({
        type: 'SYSTEM',
        label: error.message,
        targetId: error.id,
        path: '/admin/system-errors',
      })),
    ].slice(0, 10);

    res.json({
      success: true,
      data: {
        kpis: {
          totalCompanies,
          activeCompanies,
          trialCompanies,
          paidCompanies,
          cancelledCompanies,
          totalUsers,
          totalInvoices,
          invoicesSentToTtn: ttnSubmitted,
          ttnAcceptedInvoices: ttnAccepted,
          ttnRejectedInvoices: ttnRejected,
          monthlyRevenue,
          pendingPayments,
          openSupportTickets,
          systemErrorsToday,
        },
        charts: {
          revenueOverTime: Array.from(revenueByMonthMap.entries()).map(([period, value]) => ({ period, value })),
          newCompaniesOverTime: Array.from(companiesByMonthMap.entries()).map(([period, value]) => ({ period, value })),
          invoicesCreatedOverTime: Array.from(invoicesByMonthMap.entries()).map(([period, value]) => ({ period, value })),
          ttnAcceptanceVsRejection: [
            { status: 'Accepted', value: ttnAccepted },
            { status: 'Rejected', value: ttnRejected },
            { status: 'Processing', value: invoices.filter((invoice) => ['SUBMITTED_TO_TTN', 'TTN_PROCESSING'].includes(invoice.complianceStatus)).length },
          ],
          subscriptionDistribution: planDistribution,
        },
        alerts,
        importantActions,
        recentLogs: activityLogs,
      },
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const [companies, invoices] = await Promise.all([getCompaniesBase(), getInvoicesEnriched()]);
    const invoiceMap = invoices.reduce<Record<string, any[]>>((acc, invoice) => {
      acc[invoice.companyId] = [...(acc[invoice.companyId] || []), invoice];
      return acc;
    }, {});

    const payload = await Promise.all(
      companies.map(async (company) => {
        const companyInvoices = invoiceMap[company.id] || [];
        const notes = await getAdminNotes('company', company.id);
        return {
          ...company,
          phone: company.phone || null,
          rne: company.registreCommerce || null,
          subscriptionStatus: company.subscription?.status || 'TRIAL',
          invoicesUsedThisMonth: companyInvoices.filter((invoice) => {
            const created = new Date(invoice.createdAt);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }).length,
          ttnStatus: companyInvoices.some((invoice) => ['SUBMITTED_TO_TTN', 'TTN_PROCESSING'].includes(invoice.complianceStatus))
            ? 'processing'
            : companyInvoices.some((invoice) => invoice.complianceStatus === 'TTN_REJECTED')
              ? 'attention'
              : companyInvoices.some((invoice) => ['TTN_ACCEPTED', 'FINALIZED'].includes(invoice.complianceStatus))
                ? 'healthy'
                : 'idle',
          signatureStatus: company.certificatePath ? 'configured' : 'missing',
          lastActivity: company.updatedAt,
          adminNotesCount: notes.length,
        };
      })
    );

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, message: 'Error fetching companies' });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const id = getRouteId(req) as string;
    const [company, invoices, notes, tickets] = await Promise.all([
      prisma.company.findUnique({
        where: { id },
        include: {
          subscription: true,
          _count: { select: { invoices: true, clients: true, products: true, devis: true } },
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 8,
            include: { client: { select: { name: true } }, lines: true },
          },
          clients: { orderBy: { createdAt: 'desc' }, take: 8 },
          settingsHistory: { orderBy: { createdAt: 'desc' }, take: 8 },
        },
      }),
      getInvoicesEnriched(),
      getAdminNotes('company', id),
      getSupportTickets(),
    ]);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Entreprise introuvable' });
    }

    const companyInvoices = invoices.filter((invoice) => invoice.companyId === id);
    const { password: _pw, certificatePassword: _cp, ...safeCompany } = company as any;

    res.json({
      success: true,
      data: {
        ...safeCompany,
        linkedUsers: [
          {
            id: company.id,
            name: company.name,
            email: company.email,
            role: 'Company owner',
            status: company.subscription?.status === 'CANCELLED' ? 'Blocked' : 'Active',
          },
        ],
        invoiceUsage: {
          usedThisMonth: companyInvoices.filter((invoice) => {
            const d = new Date(invoice.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length,
          total: company._count.invoices,
        },
        ttnConfiguration: {
          mode: process.env.TTN_MODE || 'mock',
          hasRecentAccepted: companyInvoices.some((invoice) => ['TTN_ACCEPTED', 'FINALIZED'].includes(invoice.complianceStatus)),
          hasRecentRejected: companyInvoices.some((invoice) => invoice.complianceStatus === 'TTN_REJECTED'),
        },
        signatureConfiguration: {
          configured: !!company.certificatePath,
          provider: process.env.SIGNATURE_PROVIDER_NAME || 'TunTrust / ANCE',
        },
        recentInvoices: companyInvoices.slice(0, 8),
        recentActivityLogs: company.settingsHistory,
        supportTickets: tickets.filter((ticket) => ticket.companyId === id),
        adminNotes: notes,
      },
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const addCompanyAdminNote = async (req: Request, res: Response) => {
  try {
    const note = await addAdminNote({
      targetType: 'company',
      targetId: getRouteId(req) as string,
      authorId: getAdminId(req),
      authorName: getAdminName(req),
      content: req.body.content,
    });
    await logAdminAction(req, 'ADD_COMPANY_NOTE', `Note added on company ${getRouteId(req)}`);
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to save note' });
  }
};

export const getPlatformUsers = async (req: Request, res: Response) => {
  try {
    const users = await buildUserDirectory();
    const notes = await getAdminNotes();
    res.json({
      success: true,
      data: users.map((user) => ({
        ...user,
        notes: notes.filter((note) => note.targetType === 'user' && note.targetId === user.id),
        notesCount: notes.filter((note) => note.targetType === 'user' && note.targetId === user.id).length,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

export const addUserAdminNote = async (req: Request, res: Response) => {
  try {
    const note = await addAdminNote({
      targetType: 'user',
      targetId: getRouteId(req) as string,
      authorId: getAdminId(req),
      authorName: getAdminName(req),
      content: req.body.content,
    });
    await logAdminAction(req, 'ADD_USER_NOTE', `Note added on user ${getRouteId(req)}`);
    res.json({ success: true, data: note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to save note' });
  }
};

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await getInvoicesEnriched();
    const payload = invoices.map((invoice) => ({
      ...invoice,
      invoiceNumber: getInvoiceVisibleNumber(invoice),
      teifStatus: invoice.hasTeifXml ? 'generated' : 'missing',
      signatureStatus: invoice.hasSignedXml ? 'signed' : 'missing',
    }));
    res.json({ success: true, data: payload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching invoices' });
  }
};

export const getTtnMonitoring = async (req: Request, res: Response) => {
  try {
    const invoices = await getInvoicesEnriched();
    const submissions = invoices.filter((invoice) => invoice.ttnSubmissionId || invoice.complianceStatus !== 'DRAFT');
    const processing = submissions.filter((invoice) => ['SUBMITTED_TO_TTN', 'TTN_PROCESSING'].includes(invoice.complianceStatus)).length;
    const accepted = submissions.filter((invoice) => ['TTN_ACCEPTED', 'FINALIZED'].includes(invoice.complianceStatus)).length;
    const rejected = submissions.filter((invoice) => invoice.complianceStatus === 'TTN_REJECTED').length;
    const failedSubmissions = rejected + submissions.filter((invoice) => invoice.nextAction === 'submit-ttn' && invoice.hasSignedXml && invoice.hasTeifXml).length;
    const avgProcessingHours = 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalSubmitted: submissions.length,
          processing,
          accepted,
          rejected,
          failedSubmissions,
          averageProcessingTimeHours: avgProcessingHours,
          lastSync: submissions[0]?.lastTtnSyncAt || null,
        },
        warnings: {
          ttnConnectionNotConfigured: !['webservice', 'sftp', 'provider'].includes(process.env.TTN_MODE || 'mock'),
          manyRejectedInvoices: rejected >= 3,
          signatureMissing: submissions.some((invoice) => !invoice.signatureStatus || invoice.signatureStatus === 'missing'),
          teifGenerationErrors: submissions.some((invoice) => !invoice.hasTeifXml),
          integrationModeInactive: process.env.TTN_MODE === 'mock' || !process.env.TTN_MODE,
        },
        rows: submissions.map((invoice) => ({
          company: invoice.company?.name,
          invoiceId: invoice.id,
          submissionId: invoice.ttnSubmissionId,
          ttnReference: invoice.ttnReference,
          status: invoice.complianceStatus,
          errorMessage: invoice.ttnRejectionReason,
          lastSync: invoice.lastTtnSyncAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch TTN monitoring' });
  }
};

export const getComplianceOverview = async (req: Request, res: Response) => {
  try {
    const [companies, invoices] = await Promise.all([getCompaniesBase(), getInvoicesEnriched()]);
    const rows = companies.map((company) => {
      const companyInvoices = invoices.filter((invoice) => invoice.companyId === company.id);
      const lastSuccessful = companyInvoices.find((invoice) => ['TTN_ACCEPTED', 'FINALIZED'].includes(invoice.complianceStatus));
      const lastError = companyInvoices.find((invoice) => invoice.complianceStatus === 'TTN_REJECTED');
      return {
        companyId: company.id,
        companyName: company.name,
        teifGenerationStatus: companyInvoices.some((invoice) => invoice.hasTeifXml) ? 'available' : 'missing',
        signatureConfigured: !!company.certificatePath,
        signatureProvider: process.env.SIGNATURE_PROVIDER_NAME || 'TunTrust / ANCE',
        certificateExpirationDate: null,
        ttnMode: process.env.TTN_MODE || 'mock',
        lastSuccessfulSubmission: lastSuccessful?.lastTtnSyncAt || null,
        lastError: lastError?.ttnRejectionReason || null,
      };
    });
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch compliance data' });
  }
};

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        company: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json({
      success: true,
      data: subscriptions.map((sub) => ({
        ...sub,
        price: PLAN_PRICING[sub.plan] || 0,
        invoiceQuota: sub.plan === 'STARTER' ? 7 : 'Unlimited',
        aiAccess: ['PROFESSIONAL', 'ENTERPRISE'].includes(sub.plan),
        ttnAccess: true,
        reportsAccess: ['PROFESSIONAL', 'ENTERPRISE'].includes(sub.plan),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions' });
  }
};

export const getPaymentsOverview = async (req: Request, res: Response) => {
  try {
    const [companies, storedPayments] = await Promise.all([getCompaniesBase(), getPaymentsStore()]);
    const derivedPayments = companies
      .filter((company) => PLAN_PRICING[company.subscription?.plan || 'STARTER'] > 0)
      .map((company) => ({
        id: `derived_${company.id}`,
        companyId: company.id,
        companyName: company.name,
        plan: company.subscription?.plan || 'STARTER',
        amount: PLAN_PRICING[company.subscription?.plan || 'STARTER'] || 0,
        status: company.subscription?.status === 'ACTIVE' ? 'pending' : 'failed',
        paymentDate: null,
        nextBillingDate: company.subscription?.endDate || null,
        method: 'Manual / not linked',
        note: null,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

    const payments = [
      ...storedPayments.map((entry) => ({
        ...entry,
        companyName: companies.find((company) => company.id === entry.companyId)?.name || entry.companyId,
      })),
      ...derivedPayments.filter((entry) => !storedPayments.some((stored) => stored.companyId === entry.companyId)),
    ];

    const mrr = companies
      .filter((company) => company.subscription?.status === 'ACTIVE')
      .reduce((sum, company) => sum + (PLAN_PRICING[company.subscription?.plan || 'STARTER'] || 0), 0);

    res.json({
      success: true,
      data: {
        summary: {
          mrr,
          revenueThisMonth: payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + safeNumber(payment.amount), 0),
          failedPayments: payments.filter((payment) => payment.status === 'failed').length,
          pendingPayments: payments.filter((payment) => payment.status === 'pending').length,
          paidInvoices: payments.filter((payment) => payment.status === 'paid').length,
          refunds: payments.filter((payment) => payment.status === 'refunded').length,
        },
        rows: payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch payments' });
  }
};

export const upsertPayment = async (req: Request, res: Response) => {
  try {
    const payment = await upsertPaymentEntry(req.body);
    await logAdminAction(req, 'UPSERT_PAYMENT', `Payment updated for company ${req.body.companyId}`);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update payment' });
  }
};

export const getSupportOverview = async (req: Request, res: Response) => {
  try {
    const [tickets, companies] = await Promise.all([getSupportTickets(), getCompaniesBase()]);
    const rows = tickets.map((ticket) => ({
      ...ticket,
      companyName: companies.find((company) => company.id === ticket.companyId)?.name || ticket.companyId,
    }));
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch support tickets' });
  }
};

export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await upsertSupportTicket(req.body);
    await logAdminAction(req, 'CREATE_SUPPORT_TICKET', `Support ticket ${ticket?.id} created`);
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create ticket' });
  }
};

export const updateSupportTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await upsertSupportTicket({ ...req.body, id: getRouteId(req) as string });
    await logAdminAction(req, 'UPDATE_SUPPORT_TICKET', `Support ticket ${getRouteId(req)} updated`);
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update ticket' });
  }
};

export const replySupportTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await addTicketReply(getRouteId(req) as string, {
      authorId: getAdminId(req),
      authorName: getAdminName(req),
      message: req.body.message,
    });
    await logAdminAction(req, 'REPLY_SUPPORT_TICKET', `Reply added to ticket ${getRouteId(req)}`);
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to reply to ticket' });
  }
};

export const getSystemErrors = async (req: Request, res: Response) => {
  try {
    const [storedErrors, invoices] = await Promise.all([getSystemErrorsStore(), getInvoicesEnriched()]);
    const derivedErrors = invoices
      .filter((invoice) => invoice.ttnRejectionReason)
      .map((invoice) => ({
        id: `derived_${invoice.id}`,
        type: 'TTN error',
        companyId: invoice.companyId,
        severity: 'high' as const,
        message: invoice.ttnRejectionReason,
        status: 'new' as const,
        note: `Invoice ${invoice.id}`,
        createdAt: invoice.updatedAt,
        updatedAt: invoice.updatedAt,
      }));
    res.json({ success: true, data: [...storedErrors, ...derivedErrors] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch system errors' });
  }
};

export const upsertSystemErrorController = async (req: Request, res: Response) => {
  try {
    const routeId = getRouteId(req);
    const entry = await upsertSystemError({ ...req.body, id: routeId === 'new' ? undefined : routeId });
    await logAdminAction(req, 'UPSERT_SYSTEM_ERROR', `System error ${entry?.id} updated`);
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update system error' });
  }
};

export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
};

export const updateSystemSetting = async (req: Request, res: Response) => {
  try {
    const setting = await prisma.systemSetting.update({
      where: { id: getRouteId(req) as string },
      data: { value: req.body.value },
    });
    await logAdminAction(req, 'UPDATE_SYSTEM_SETTING', `Setting ${setting.key} updated`);
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating setting' });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  const id = getRouteId(req) as string;
  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Entreprise introuvable' });
    }

    await prisma.$transaction([
      prisma.settingsHistory.deleteMany({ where: { companyId: id } }),
      prisma.notification.deleteMany({ where: { companyId: id } }),
      prisma.invoiceRequest.deleteMany({ where: { companyId: id } }),
      prisma.invoice.deleteMany({ where: { companyId: id } }),
      prisma.devis.deleteMany({ where: { companyId: id } }),
      prisma.product.deleteMany({ where: { companyId: id } }),
      prisma.client.deleteMany({ where: { companyId: id } }),
      prisma.documentSequence.deleteMany({ where: { companyId: id } }),
      prisma.subscription.deleteMany({ where: { companyId: id } }),
      prisma.company.delete({ where: { id } }),
    ]);

    await logAdminAction(req, 'DELETE_COMPANY', `Company deleted: ${company.name}`);
    res.json({ success: true, message: `Entreprise "${company.name}" supprimee avec succes.` });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
};

export const updateCompanyStatus = async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.update({
      where: { id: getRouteId(req) as string },
      data: {
        subscription: {
          upsert: {
            update: { status: req.body.status === 'ACTIVE' ? 'ACTIVE' : 'CANCELLED' },
            create: { status: req.body.status === 'ACTIVE' ? 'ACTIVE' : 'CANCELLED' },
          },
        },
      },
      include: { subscription: true },
    });
    await logAdminAction(req, 'UPDATE_COMPANY_STATUS', `Company ${getRouteId(req)} status changed to ${req.body.status}`);
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating company' });
  }
};

export const updateCompanyPlan = async (req: Request, res: Response) => {
  try {
    const updated = await prisma.subscription.upsert({
      where: { companyId: getRouteId(req) as string },
      update: { plan: req.body.plan, status: 'ACTIVE' },
      create: { companyId: getRouteId(req) as string, plan: req.body.plan, status: 'ACTIVE' },
    });
    await logAdminAction(req, 'UPDATE_COMPANY_PLAN', `Company ${getRouteId(req)} plan changed to ${req.body.plan}`);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise a jour du plan' });
  }
};

export const resetCompanyQuota = async (req: Request, res: Response) => {
  try {
    await logAdminAction(req, 'RESET_COMPANY_QUOTA', `Quota reset requested for company ${getRouteId(req)}`);
    res.json({ success: true, message: 'Quota reset enregistre. La limite repartira au prochain cycle mensuel.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to reset quota' });
  }
};

export const getAdminLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        admin: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    const normalized = logs.map((log) => ({
      id: log.id,
      actor: log.admin?.name || 'Admin',
      actorEmail: log.admin?.email || null,
      company: null,
      action: log.action,
      entityType: 'admin_action',
      entityId: null,
      date: log.createdAt,
      ipAddress: log.details?.includes('ip=') ? log.details.split('ip=').pop() : null,
      details: log.details,
    }));

    res.json({ success: true, data: normalized });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
};

export const sendGlobalNotification = async (req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: companies.map((company) => ({
        companyId: company.id,
        title: req.body.title,
        message: req.body.message,
        type: req.body.type || 'INFO',
      })),
    });
    await logAdminAction(req, 'SEND_GLOBAL_NOTIFICATION', `Notification sent to ${companies.length} companies`);
    res.json({ success: true, message: `Notification envoyee a ${companies.length} entreprises.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending notification' });
  }
};
