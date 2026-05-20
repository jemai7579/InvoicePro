import { Request, Response } from 'express';
import prisma from '../prisma';
import { enrichInvoiceWithCompliance } from '../services/teifWorkflowService';
import {
  addAdminNote,
  addTicketReply,
  getAdminNotes,
  getCompanyAdminHistory,
  getCompanyOpsProfile,
  getCompanyOpsProfiles,
  getPaymentsStore,
  getSupportTickets,
  getSystemErrorsStore,
  recordAdminCompanyStatusHistory,
  upsertCompanyOpsProfile,
  upsertPaymentEntry,
  upsertSupportTicket,
  upsertSystemError,
} from '../services/adminOpsStore';
import { getInvoiceVisibleNumber } from '../services/numberingService';
import { getRequestAuditMeta, logActivity } from '../services/auditTrailService';
import { INTEGRATIONS, IntegrationKey, getIntegrationStatus, saveIntegrationSettings } from '../services/integrationSettingsService';
import { getAdminAnalyticsEvents, getAdminAnalyticsOverview, getAdminAnalyticsPages, getAdminAnalyticsReferrers, getSearchConsole, getSeoPagesAudit } from './analyticsController';

const PLAN_PRICING: Record<string, number> = {
  STARTER: 0,
  PROFESSIONAL: 99,
  ENTERPRISE: 299,
};

const safeNumber = (value: any) => Number(value || 0);
const getRouteId = (req: Request) => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

const getAdminId = (req: Request) => (req as any).admin?.id;
const getAdminName = (req: Request) => (req as any).admin?.name || 'Platform admin';
const appEnv = () => process.env.APP_ENV || process.env.NODE_ENV || 'development';
const eInvoiceMode = () => process.env.E_INVOICE_MODE || process.env.TTN_MODE || 'mock';
const isConfigured = (value?: string) => Boolean(value && value.trim() && !value.toLowerCase().includes('changeme'));

const defaultDossierStatus = (company: any) => {
  if (!company.matriculeFiscal || !company.address || !company.registreCommerce) return 'missing_documents';
  if (!company.certificatePath) return 'pending_review';
  return 'ready_for_test';
};

const productionMissingRequirements = (company: any) => {
  const missing: string[] = [];
  if (!company.matriculeFiscal) missing.push('Matricule fiscal');
  if (!company.registreCommerce) missing.push('Registre de commerce');
  if (!company.address) missing.push('Adresse legale');
  if (!company.certificatePath) missing.push('Signature electronique reelle');
  if (!isConfigured(process.env.TTN_BASE_URL)) missing.push('Configuration TTN officielle');
  if (!isConfigured(process.env.TEIF_XSD_PATH)) missing.push('XSD TEIF officiel');
  if (!isConfigured(process.env.SIGNATURE_PROVIDER_NAME)) missing.push('Fournisseur de signature');
  return missing;
};

const buildConfigStatus = () => ({
  environment: appEnv(),
  eInvoiceMode: eInvoiceMode(),
  productionSafety: {
    mockSignatureBlockedInProduction: appEnv() === 'production',
    fakeTtnAcceptanceBlocked: true,
    legalStatusRequiresProviderResponse: true,
  },
  ttn: {
    mode: process.env.TTN_MODE || 'mock',
    documentationAvailable: isConfigured(process.env.TTN_DOCUMENTATION_URL),
    sandboxConfigured: isConfigured(process.env.TTN_SANDBOX_URL),
    productionConfigured: isConfigured(process.env.TTN_BASE_URL),
    authConfigured: isConfigured(process.env.TTN_API_KEY) || isConfigured(process.env.TTN_CLIENT_ID),
    submitEndpointConfigured: isConfigured(process.env.TTN_SUBMIT_ENDPOINT),
    statusEndpointConfigured: isConfigured(process.env.TTN_STATUS_ENDPOINT),
    proofEndpointConfigured: isConfigured(process.env.TTN_PROOF_ENDPOINT),
  },
  signature: {
    provider: process.env.SIGNATURE_PROVIDER_NAME || 'mock',
    mode: process.env.SIGNATURE_MODE || 'mock',
    configured: isConfigured(process.env.SIGNATURE_PROVIDER_NAME) && (isConfigured(process.env.SIGNATURE_API_URL) || isConfigured(process.env.SIGNATURE_CERT_PATH)),
    hsmConfigured: isConfigured(process.env.SIGNATURE_HSM_URL),
    certificatePathConfigured: isConfigured(process.env.SIGNATURE_CERT_PATH),
  },
  teif: {
    xsdConfigured: isConfigured(process.env.TEIF_XSD_PATH),
    version: process.env.TEIF_VERSION || 'TTN officiel requis',
  },
  services: {
    emailConfigured: isConfigured(process.env.SMTP_HOST) && isConfigured(process.env.SMTP_USER),
    aiConfigured: isConfigured(process.env.GEMINI_API_KEY),
    databaseConfigured: isConfigured(process.env.DATABASE_URL),
  },
});

const buildBillingConfigStatus = () => {
  const provider = process.env.BILLING_PROVIDER || '';
  const providerConfigured = isConfigured(provider) && isConfigured(process.env.BILLING_API_KEY);
  const webhookConfigured = isConfigured(process.env.BILLING_WEBHOOK_SECRET);
  const successUrlConfigured = isConfigured(process.env.BILLING_SUCCESS_URL);
  const cancelUrlConfigured = isConfigured(process.env.BILLING_CANCEL_URL);
  const automaticRenewalEnabled = providerConfigured && webhookConfigured;
  const subscriptionInvoiceGeneration = isConfigured(process.env.BILLING_SUBSCRIPTION_INVOICES_ENABLED)
    ? process.env.BILLING_SUBSCRIPTION_INVOICES_ENABLED === 'true'
    : false;

  return {
    provider: provider || 'manual',
    providerConfigured,
    webhookConfigured,
    automaticRenewalEnabled,
    subscriptionInvoiceGeneration,
    successUrlConfigured,
    cancelUrlConfigured,
    missingRequirements: [
      !providerConfigured ? 'Fournisseur de paiement et cle API' : null,
      !webhookConfigured ? 'Secret webhook paiement' : null,
      !successUrlConfigured ? 'URL succes paiement' : null,
      !cancelUrlConfigured ? 'URL annulation paiement' : null,
      !subscriptionInvoiceGeneration ? 'Generation automatique des factures abonnement' : null,
    ].filter(Boolean),
    warning: providerConfigured ? null : 'Suivi manuel — fournisseur de paiement non connecte.',
  };
};

const getInvoiceQuotaForPlan = (plan?: string | null) => (plan === 'STARTER' ? 7 : 999999);

const getSubscriptionHealth = (subscription: any, invoiceCount: number, lastPayment?: any) => {
  if (!subscription) return 'trial';
  if (subscription.status === 'CANCELLED' || subscription.status === 'SUSPENDED') return 'suspended';
  if (subscription.status === 'EXPIRED' || (subscription.endDate && new Date(subscription.endDate) < new Date())) return 'expired';
  if (lastPayment && ['failed', 'pending'].includes(lastPayment.status)) return 'payment_missing';
  const quota = getInvoiceQuotaForPlan(subscription.plan);
  if (quota !== 999999 && invoiceCount >= quota) return 'over_quota';
  if (quota !== 999999 && invoiceCount >= quota - 1) return 'near_quota';
  return 'healthy';
};

const getRequiredDossierDocuments = (company: any, profile?: any) => {
  const docs = [
    {
      key: 'matricule_fiscal',
      label: 'Matricule fiscal',
      status: company.matriculeFiscal ? 'verified' : 'missing',
      reason: company.matriculeFiscal ? null : 'Matricule fiscal manquant dans le dossier entreprise.',
    },
    {
      key: 'registre_commerce',
      label: 'Registre commerce',
      status: company.registreCommerce ? 'received' : 'missing',
      reason: company.registreCommerce ? null : 'RNE / registre commerce non renseigne.',
    },
    {
      key: 'legal_representative_id',
      label: 'Identite representant legal',
      status: company.firstName || company.lastName ? 'received' : 'missing',
      reason: company.firstName || company.lastName ? null : 'Representant legal non renseigne.',
    },
    {
      key: 'mandate_authorization',
      label: 'Mandat / autorisation',
      status: 'missing',
      reason: 'Workflow documentaire interne a finaliser.',
    },
    {
      key: 'ttn_adhesion_proof',
      label: 'Preuve adhesion TTN',
      status: profile?.dossierStatus === 'approved_by_ttn' || profile?.dossierStatus === 'ready_for_production' ? 'verified' : 'missing',
      reason: 'Validation TTN reelle a confirmer par TTN.',
    },
    {
      key: 'signature_certificate_proof',
      label: 'Preuve certificat signature',
      status: company.certificatePath ? 'received' : 'missing',
      reason: company.certificatePath ? null : 'Certificat ou preuve de signature non configure.',
    },
  ];

  const requested = Array.isArray(profile?.requestedDocuments) ? profile.requestedDocuments : [];
  return docs.map((doc) => ({
    ...doc,
    status: requested.includes(doc.key) && doc.status === 'missing' ? 'requested' : doc.status,
  }));
};

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

const readableAction = (action: string, details?: string | null, adminName = 'Platform Admin') => {
  const text = details || '';
  const companyMatch = text.match(/Company ([^ ]+)/i);
  const labels: Record<string, string> = {
    LOGIN: `L'admin ${adminName} s'est connecte.`,
    UPDATE_COMPANY_STATUS: `L'admin ${adminName} a change le statut d'une entreprise.`,
    UPDATE_COMPANY_PLAN: `L'admin ${adminName} a change le plan d'une entreprise.`,
    RESET_COMPANY_QUOTA: `L'admin ${adminName} a demande une remise a zero de quota.`,
    SEND_GLOBAL_NOTIFICATION: `L'admin ${adminName} a envoye une notification globale.`,
    UPDATE_SYSTEM_SETTING: `L'admin ${adminName} a modifie un parametre plateforme.`,
    UPDATE_INTEGRATION_SECRET: `L'admin ${adminName} a mis a jour une integration securisee.`,
    UPSERT_SYSTEM_ERROR: `L'admin ${adminName} a mis a jour une erreur systeme.`,
    REPLY_SUPPORT_TICKET: `L'admin ${adminName} a repondu a un ticket support.`,
  };
  return labels[action] || `${adminName} - ${action}${companyMatch ? ` (${companyMatch[1]})` : ''}`;
};

const actionCategory = (action: string) => {
  if (action.includes('LOGIN')) return 'login';
  if (action.includes('COMPANY_STATUS')) return 'company_status';
  if (action.includes('DOSSIER')) return 'dossier_status';
  if (action.includes('PLAN')) return 'plan_change';
  if (action.includes('QUOTA')) return 'quota_reset';
  if (action.includes('PAYMENT')) return 'payment';
  if (action.includes('SUPPORT')) return 'support';
  if (action.includes('NOTIFICATION')) return 'notification';
  if (action.includes('SETTING') || action.includes('INTEGRATION')) return 'settings';
  if (action.includes('TTN')) return 'ttn';
  if (action.includes('SIGNATURE')) return 'signature';
  if (action.includes('ERROR')) return 'system_error';
  return 'other';
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
    company: 'InvoicePro',
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
    const [companies, invoices, subscriptions, activityLogs, tickets, systemErrors, manualPayments, companyProfiles] = await Promise.all([
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
      getCompanyOpsProfiles(),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const totalCompanies = companies.length;
    const profileFor = (companyId: string) => companyProfiles.find((profile) => profile.companyId === companyId);
    const activeCompanies = companies.filter((company) => (profileFor(company.id)?.status || 'active') === 'active').length;
    const pendingCompanies = companies.filter((company) => profileFor(company.id)?.status === 'pending').length;
    const suspendedCompanies = companies.filter((company) => ['suspended', 'blocked'].includes(profileFor(company.id)?.status || '') || company.subscription?.status === 'CANCELLED').length;
    const cancelledCompanies = suspendedCompanies;
    const trialCompanies = companies.filter((company) => !company.subscription || company.subscription.plan === 'STARTER').length;
    const paidCompanies = companies.filter((company) => ['PROFESSIONAL', 'ENTERPRISE'].includes(company.subscription?.plan || '')).length;
    const totalUsers = totalCompanies + (await prisma.admin.count());
    const totalInvoices = invoices.length;
    const invoicesToday = invoices.filter((invoice) => new Date(invoice.createdAt) >= todayStart).length;
    const invoicesThisMonth = invoices.filter((invoice) => new Date(invoice.createdAt) >= monthStart).length;
    const ttnSubmitted = invoices.filter((invoice) => ['SUBMITTED_TO_TTN', 'TTN_PROCESSING', 'TTN_ACCEPTED', 'TTN_REJECTED', 'FINALIZED'].includes(invoice.complianceStatus)).length;
    const ttnAccepted = invoices.filter((invoice) => ['TTN_ACCEPTED', 'FINALIZED'].includes(invoice.complianceStatus)).length;
    const ttnRejected = invoices.filter((invoice) => invoice.complianceStatus === 'TTN_REJECTED').length;
    const monthlyRevenue = subscriptions
      .filter((sub) => sub.status === 'ACTIVE')
      .reduce((sum, sub) => sum + (PLAN_PRICING[sub.plan] || 0), 0);
    const manualCollectedPayments = manualPayments.filter((payment) => payment.status === 'paid' || payment.status === 'manual').reduce((sum, payment) => sum + safeNumber(payment.amount), 0);
    const pendingPayments = manualPayments.filter((payment) => payment.status === 'pending').length +
      companies.filter((company) => company.subscription?.status === 'ACTIVE' && PLAN_PRICING[company.subscription?.plan || 'STARTER'] > 0).length;
    const failedPaymentsCount = manualPayments.filter((payment) => payment.status === 'failed').length;
    const expiredSubscriptions = subscriptions.filter((sub) => sub.status === 'EXPIRED' || (sub.endDate && new Date(sub.endDate) < now)).length;
    const companiesNearQuota = companies.filter((company) => {
      const quota = getInvoiceQuotaForPlan(company.subscription?.plan);
      return quota !== 999999 && company._count.invoices >= quota - 1 && company._count.invoices < quota;
    }).length;
    const companiesOverQuota = companies.filter((company) => {
      const quota = getInvoiceQuotaForPlan(company.subscription?.plan);
      return quota !== 999999 && company._count.invoices >= quota;
    }).length;
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
          pendingCompanies,
          suspendedCompanies,
          trialCompanies,
          paidCompanies,
          cancelledCompanies,
          totalUsers,
          totalInvoices,
          invoicesToday,
          invoicesThisMonth,
          invoicesSentToTtn: ttnSubmitted,
          ttnAcceptedInvoices: ttnAccepted,
          ttnRejectedInvoices: ttnRejected,
          ttnPendingInvoices: invoices.filter((invoice) => ['SUBMITTED_TO_TTN', 'TTN_PROCESSING'].includes(invoice.complianceStatus)).length,
          monthlyRevenue,
          manualCollectedPayments,
          pendingPayments,
          failedPayments: failedPaymentsCount,
          expiredSubscriptions,
          companiesNearQuota,
          companiesOverQuota,
          openSupportTickets,
          systemErrorsToday,
          teifGeneratedInvoices: invoices.filter((invoice) => invoice.hasTeifXml).length,
          signedInvoices: invoices.filter((invoice) => invoice.hasSignedXml).length,
          companiesReadyForProduction: companies.filter((company) => productionMissingRequirements(company).length === 0).length,
          companiesBlockedByReadiness: companies.filter((company) => productionMissingRequirements(company).length > 0).length,
        },
        systemStatus: {
          backend: 'ok',
          database: buildConfigStatus().services.databaseConfigured ? 'configured' : 'missing',
          ttn: buildConfigStatus().ttn.productionConfigured ? 'configured' : 'missing',
          signature: buildConfigStatus().signature.configured ? 'configured' : 'missing',
          billing: buildBillingConfigStatus().providerConfigured ? 'configured' : 'missing',
          ai: buildConfigStatus().services.aiConfigured ? 'configured' : 'missing',
          email: buildConfigStatus().services.emailConfigured ? 'configured' : 'missing',
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
        recentCompanies: companies.slice(0, 8).map((company) => ({
          id: company.id,
          name: company.name,
          email: company.email,
          status: profileFor(company.id)?.status || 'active',
          dossierStatus: profileFor(company.id)?.dossierStatus || defaultDossierStatus(company),
          createdAt: company.createdAt,
        })),
        recentInvoices: invoices.slice(0, 8).map((invoice) => ({
          id: invoice.id,
          invoiceNumber: getInvoiceVisibleNumber(invoice),
          companyName: invoice.company?.name,
          clientName: invoice.client?.name,
          complianceStatus: invoice.complianceStatus,
          totalTTC: invoice.totalTTC,
          createdAt: invoice.createdAt,
        })),
        ttnReadiness: {
          readyCompanies: companies.filter((company) => productionMissingRequirements(company).length === 0).length,
          blockedCompanies: companies.filter((company) => productionMissingRequirements(company).length > 0).length,
          mode: eInvoiceMode(),
          documentationRequired: !isConfigured(process.env.TTN_DOCUMENTATION_URL),
          teifXsdConfigured: isConfigured(process.env.TEIF_XSD_PATH),
          signatureConfigured: buildConfigStatus().signature.configured,
        },
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
    const [companies, invoices, profiles] = await Promise.all([getCompaniesBase(), getInvoicesEnriched(), getCompanyOpsProfiles()]);
    const invoiceMap = invoices.reduce<Record<string, any[]>>((acc, invoice) => {
      acc[invoice.companyId] = [...(acc[invoice.companyId] || []), invoice];
      return acc;
    }, {});

    const payload = await Promise.all(
      companies.map(async (company) => {
        const companyInvoices = invoiceMap[company.id] || [];
        const notes = await getAdminNotes('company', company.id);
        const profile = profiles.find((item) => item.companyId === company.id);
        const missingRequirements = productionMissingRequirements(company);
        return {
          ...company,
          phone: company.phone || null,
          rne: company.registreCommerce || null,
          operationalStatus: profile?.status || (company.subscription?.status === 'CANCELLED' ? 'suspended' : 'active'),
          dossierStatus: profile?.dossierStatus || defaultDossierStatus(company),
          productionReady: missingRequirements.length === 0,
          missingRequirements,
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
    const [company, invoices, notes, tickets, profile, adminHistory, platformPayments, invoicePayments] = await Promise.all([
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
      getCompanyOpsProfile(id),
      getCompanyAdminHistory(id),
      getPaymentsStore(),
      prisma.payment.findMany({
        where: { companyId: id },
        include: { invoice: { select: { number: true, totalTTC: true, paymentStatus: true } } },
        orderBy: { paymentDate: 'desc' },
        take: 8,
      }),
    ]);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Entreprise introuvable' });
    }

    const companyInvoices = invoices.filter((invoice) => invoice.companyId === id);
    const { password: _pw, certificatePassword: _cp, ...safeCompany } = company as any;
    const companyPlatformPayments = platformPayments.filter((payment) => payment.companyId === id);
    const lastPlatformPayment = companyPlatformPayments[0];
    const quota = getInvoiceQuotaForPlan(company.subscription?.plan);
    const documentChecklist = getRequiredDossierDocuments(company, profile);
    const warnings = [
      !lastPlatformPayment && PLAN_PRICING[company.subscription?.plan || 'STARTER'] > 0 ? 'payment_missing' : null,
      company.subscription?.endDate && new Date(company.subscription.endDate) < new Date() ? 'subscription_expired' : null,
      documentChecklist.some((doc) => ['missing', 'requested', 'rejected'].includes(doc.status)) ? 'dossier_incomplete' : null,
      !company.certificatePath ? 'signature_missing' : null,
      !isConfigured(process.env.TTN_BASE_URL) ? 'ttn_config_missing' : null,
      !isConfigured(process.env.TEIF_XSD_PATH) ? 'teif_xsd_missing' : null,
      productionMissingRequirements(company).length > 0 ? 'production_blocked' : null,
    ].filter(Boolean);

    res.json({
      success: true,
      data: {
        ...safeCompany,
        operationalStatus: profile?.status || (company.subscription?.status === 'CANCELLED' ? 'suspended' : 'active'),
        dossierStatus: profile?.dossierStatus || defaultDossierStatus(company),
        missingRequirements: productionMissingRequirements(company),
        productionReady: productionMissingRequirements(company).length === 0,
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
          quota,
        },
        subscriptionCard: {
          plan: company.subscription?.plan || 'STARTER',
          status: company.subscription?.status || 'TRIAL',
          startDate: company.subscription?.startDate || null,
          endDate: company.subscription?.endDate || null,
          renewalDate: company.subscription?.endDate || null,
          invoiceQuota: quota === 999999 ? 'Unlimited' : quota,
          quotaUsage: company._count.invoices,
          health: getSubscriptionHealth(company.subscription, company._count.invoices, lastPlatformPayment),
        },
        billingSummary: {
          mode: buildBillingConfigStatus().providerConfigured ? 'provider' : 'manual',
          warning: buildBillingConfigStatus().warning,
          lastPaymentStatus: lastPlatformPayment?.status || 'missing',
          lastPaymentDate: lastPlatformPayment?.paymentDate || null,
          platformPayments: companyPlatformPayments.slice(0, 8),
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
        recentPayments: invoicePayments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          paymentDate: payment.paymentDate,
          invoiceNumber: payment.invoice?.number,
          invoiceTotal: payment.invoice?.totalTTC,
          invoicePaymentStatus: payment.invoice?.paymentStatus,
        })),
        documentChecklist,
        dossierWorkflowLabel: 'Validation documentaire interne — la validation TTN réelle doit être confirmée par TTN.',
        warnings,
        recentActivityLogs: company.settingsHistory,
        supportTickets: tickets.filter((ticket) => ticket.companyId === id),
        adminNotes: notes,
        statusHistory: adminHistory.statusHistory,
        dossierHistory: adminHistory.dossierHistory,
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
    const [invoices, companies] = await Promise.all([getInvoicesEnriched(), getCompaniesBase()]);
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
        configuration: buildConfigStatus(),
        checklist: [
          { key: 'documentation', label: 'Documentation officielle TTN', ready: isConfigured(process.env.TTN_DOCUMENTATION_URL) },
          { key: 'sandbox', label: 'Acces sandbox TTN', ready: isConfigured(process.env.TTN_SANDBOX_URL) },
          { key: 'authentication', label: 'Methode authentification', ready: isConfigured(process.env.TTN_API_KEY) || isConfigured(process.env.TTN_CLIENT_ID) },
          { key: 'teif_xsd', label: 'XSD TEIF officiel', ready: isConfigured(process.env.TEIF_XSD_PATH) },
          { key: 'signature_rules', label: 'Regles signature XML', ready: isConfigured(process.env.SIGNATURE_PROVIDER_NAME) },
          { key: 'submit_endpoint', label: 'Endpoint soumission', ready: isConfigured(process.env.TTN_SUBMIT_ENDPOINT) },
          { key: 'status_endpoint', label: 'Endpoint statut', ready: isConfigured(process.env.TTN_STATUS_ENDPOINT) },
          { key: 'proof_endpoint', label: 'Endpoint preuve / QR', ready: isConfigured(process.env.TTN_PROOF_ENDPOINT) },
          { key: 'rejection_codes', label: 'Codes de rejet TTN', ready: isConfigured(process.env.TTN_REJECTION_CODES_DOC) },
          { key: 'multi_client_rules', label: 'Regles SaaS multi-client', ready: isConfigured(process.env.TTN_MULTI_CLIENT_RULES_DOC) },
        ],
        readiness: {
          companiesReady: companies.filter((company) => productionMissingRequirements(company).length === 0).length,
          companiesBlocked: companies.filter((company) => productionMissingRequirements(company).length > 0).length,
          missingDocumentationMessage: 'Documentation officielle TTN requise avant integration reelle.',
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
      const missingRequirements = productionMissingRequirements(company);
      return {
        companyId: company.id,
        companyName: company.name,
        missingMatriculeFiscal: !company.matriculeFiscal,
        missingLegalRepresentative: !company.firstName && !company.lastName,
        missingSignatureConfiguration: !company.certificatePath,
        missingTtnConfiguration: !isConfigured(process.env.TTN_BASE_URL),
        missingRequirements,
        productionReady: missingRequirements.length === 0,
        teifGenerationStatus: companyInvoices.some((invoice) => invoice.hasTeifXml) ? 'available' : 'missing',
        invoicesMissingTeif: companyInvoices.filter((invoice) => !invoice.hasTeifXml).length,
        invoicesMissingSignature: companyInvoices.filter((invoice) => invoice.hasTeifXml && !invoice.hasSignedXml).length,
        rejectedInvoices: companyInvoices.filter((invoice) => invoice.complianceStatus === 'TTN_REJECTED').length,
        blockedByProductionRules: appEnv() === 'production' && missingRequirements.length > 0,
        artifacts: {
          pdf: companyInvoices.filter((invoice) => invoice.status !== 'DRAFT').length,
          teifXml: companyInvoices.filter((invoice) => invoice.hasTeifXml).length,
          signedXml: companyInvoices.filter((invoice) => invoice.hasSignedXml).length,
          ttnProof: companyInvoices.filter((invoice) => invoice.ttnProofPath).length,
        },
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
    const [subscriptions, histories, platformPayments] = await Promise.all([
      prisma.subscription.findMany({
      include: {
        company: {
          select: { id: true, name: true, email: true, createdAt: true, _count: { select: { invoices: true } } },
        },
      },
      orderBy: { startDate: 'desc' },
      }),
      ((prisma as any).adminCompanyStatusHistory?.findMany?.({
          where: { actionType: { in: ['plan_change', 'status_change', 'quota_reset'] } },
          orderBy: { createdAt: 'desc' },
          take: 500,
        }) || Promise.resolve([])).catch(() => []),
      getPaymentsStore(),
    ]);

    res.json({
      success: true,
      data: subscriptions.map((sub) => ({
        ...sub,
        price: PLAN_PRICING[sub.plan] || 0,
        renewalDate: sub.endDate || null,
        quotaUsage: sub.company?._count?.invoices || 0,
        invoiceQuota: sub.plan === 'STARTER' ? 7 : 'Unlimited',
        invoiceQuotaNumber: getInvoiceQuotaForPlan(sub.plan),
        aiQuota: ['PROFESSIONAL', 'ENTERPRISE'].includes(sub.plan) ? 'Disponible' : 'Non inclus',
        aiAccess: ['PROFESSIONAL', 'ENTERPRISE'].includes(sub.plan),
        ttnAccess: true,
        reportsAccess: ['PROFESSIONAL', 'ENTERPRISE'].includes(sub.plan),
        lastPaymentStatus: platformPayments.find((payment) => payment.companyId === sub.companyId)?.status || 'missing',
        paymentHistory: platformPayments.filter((payment) => payment.companyId === sub.companyId).slice(0, 10),
        subscriptionHealth: getSubscriptionHealth(sub, sub.company?._count?.invoices || 0, platformPayments.find((payment) => payment.companyId === sub.companyId)),
        nearQuota: getInvoiceQuotaForPlan(sub.plan) !== 999999 && (sub.company?._count?.invoices || 0) >= getInvoiceQuotaForPlan(sub.plan) - 1,
        paymentMissing: !platformPayments.some((payment) => payment.companyId === sub.companyId && ['paid', 'manual'].includes(payment.status)) && PLAN_PRICING[sub.plan] > 0,
        history: (histories || []).filter((entry: any) => entry.companyId === sub.companyId).slice(0, 10),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions' });
  }
};

export const getPaymentsOverview = async (req: Request, res: Response) => {
  try {
    const [companies, storedPayments, businessInvoicePayments] = await Promise.all([
      getCompaniesBase(),
      getPaymentsStore(),
      prisma.payment.findMany({
        include: {
          company: { select: { id: true, name: true, email: true } },
          invoice: { select: { id: true, number: true, totalTTC: true, paymentStatus: true, client: { select: { name: true } } } },
        },
        orderBy: { paymentDate: 'desc' },
        take: 500,
      }),
    ]);
    const billingConfig = buildBillingConfigStatus();
    const subscriptionPayments = companies
      .filter((company) => PLAN_PRICING[company.subscription?.plan || 'STARTER'] > 0)
      .map((company) => ({
        id: `derived_${company.id}`,
        source: 'subscription_due',
        companyId: company.id,
        companyName: company.name,
        plan: company.subscription?.plan || 'STARTER',
        amount: PLAN_PRICING[company.subscription?.plan || 'STARTER'] || 0,
        currency: 'TND',
        status: company.subscription?.status === 'ACTIVE' ? 'pending' : 'cancelled',
        paymentDate: null,
        periodStart: company.subscription?.startDate || null,
        periodEnd: company.subscription?.endDate || null,
        nextBillingDate: company.subscription?.endDate || null,
        method: billingConfig.providerConfigured ? 'Provider not synchronized' : 'Manual / not linked',
        providerReference: null,
        note: null,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

    const manualPlatformPayments = [
      ...storedPayments.map((entry) => ({
        ...entry,
        source: 'manual_platform_payment',
        companyName: companies.find((company) => company.id === entry.companyId)?.name || entry.companyId,
      })),
    ];
    const mergedPlatformPayments = [
      ...manualPlatformPayments,
      ...subscriptionPayments.filter((entry) => !storedPayments.some((stored) => stored.companyId === entry.companyId)),
    ];

    const invoicePaymentRows = businessInvoicePayments.map((payment) => ({
      id: payment.id,
      source: 'company_invoice_payment',
      companyId: payment.companyId,
      companyName: payment.company?.name,
      companyEmail: payment.company?.email,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice?.number,
      clientName: payment.invoice?.client?.name,
      amount: payment.amount,
      currency: 'TND',
      status: String(payment.status || '').toLowerCase(),
      method: payment.method,
      reference: payment.reference,
      paymentDate: payment.paymentDate,
      invoiceTotal: payment.invoice?.totalTTC,
      invoicePaymentStatus: payment.invoice?.paymentStatus,
      note: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    const mrr = companies
      .filter((company) => company.subscription?.status === 'ACTIVE')
      .reduce((sum, company) => sum + (PLAN_PRICING[company.subscription?.plan || 'STARTER'] || 0), 0);
    const paidPlatformPayments = mergedPlatformPayments.filter((payment) => ['paid', 'manual'].includes(payment.status));
    const failedPending = mergedPlatformPayments.filter((payment) => ['failed', 'pending', 'cancelled'].includes(payment.status));

    res.json({
      success: true,
      data: {
        summary: {
          mrr,
          revenueThisMonth: paidPlatformPayments.reduce((sum, payment) => sum + safeNumber(payment.amount), 0),
          failedPayments: mergedPlatformPayments.filter((payment) => payment.status === 'failed').length,
          pendingPayments: mergedPlatformPayments.filter((payment) => payment.status === 'pending').length,
          paidInvoices: paidPlatformPayments.length,
          refunds: mergedPlatformPayments.filter((payment) => payment.status === 'refunded').length,
          subscriptionPayments: subscriptionPayments.length,
          manualPlatformPayments: manualPlatformPayments.length,
          businessInvoicePayments: invoicePaymentRows.length,
          billingProviderConfigured: billingConfig.providerConfigured,
        },
        subscriptionPayments,
        manualPlatformPayments,
        invoicePayments: invoicePaymentRows,
        failedPendingPayments: failedPending,
        billingConfig,
        rows: mergedPlatformPayments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch payments' });
  }
};

export const upsertPayment = async (req: Request, res: Response) => {
  try {
    const payment = await upsertPaymentEntry({ ...req.body, createdByAdminId: getAdminId(req), currency: req.body.currency || 'TND' });
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
    if (ticket?.companyId) {
      await logActivity({
        companyId: ticket.companyId,
        actorId: getAdminId(req),
        actorType: 'admin',
        actionType: 'SUPPORT_TICKET_CREATED_BY_ADMIN',
        objectType: 'support_ticket',
        objectId: ticket.id,
        message: `Admin created support ticket: ${ticket.subject}`,
        newValue: { subject: ticket.subject, category: ticket.category, priority: ticket.priority, status: ticket.status },
        ...getRequestAuditMeta(req),
      });
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create ticket' });
  }
};

export const updateSupportTicket = async (req: Request, res: Response) => {
  try {
    const id = getRouteId(req) as string;
    const previous = (await getSupportTickets()).find((item) => item.id === id);
    const status = ['open', 'in_progress', 'resolved', 'closed'].includes(req.body.status) ? req.body.status : req.body.status;
    const ticket = await upsertSupportTicket({ ...req.body, status, id });
    await logAdminAction(req, 'UPDATE_SUPPORT_TICKET', `Support ticket ${getRouteId(req)} updated`);
    if (ticket?.companyId) {
      await logActivity({
        companyId: ticket.companyId,
        actorId: getAdminId(req),
        actorType: 'admin',
        actionType: 'SUPPORT_TICKET_STATUS_CHANGED',
        objectType: 'support_ticket',
        objectId: ticket.id,
        message: `Support ticket status changed to ${ticket.status}`,
        oldValue: { status: previous?.status || null },
        newValue: { status: ticket.status },
        ...getRequestAuditMeta(req),
      });
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update ticket' });
  }
};

export const replySupportTicket = async (req: Request, res: Response) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ success: false, message: 'Reply message is required' });
    const ticket = await addTicketReply(getRouteId(req) as string, {
      authorId: getAdminId(req),
      authorName: getAdminName(req),
      message,
    });
    await logAdminAction(req, 'REPLY_SUPPORT_TICKET', `Reply added to ticket ${getRouteId(req)}`);
    if (ticket?.companyId) {
      await logActivity({
        companyId: ticket.companyId,
        actorId: getAdminId(req),
        actorType: 'admin',
        actionType: 'SUPPORT_TICKET_REPLY_ADDED',
        objectType: 'support_ticket',
        objectId: ticket.id,
        message: `Admin reply added to support ticket: ${ticket.subject}`,
        newValue: { reply: message },
        ...getRequestAuditMeta(req),
      });
    }
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

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const [companyCount, invoiceCount, lastErrors] = await Promise.all([
      prisma.company.count(),
      prisma.invoice.count(),
      getSystemErrorsStore(),
    ]);
    const config = buildConfigStatus();
    const billing = buildBillingConfigStatus();
    const missingEnv = [
      'DATABASE_URL',
      'JWT_SECRET',
      'TTN_BASE_URL',
      'TEIF_XSD_PATH',
      'SIGNATURE_PROVIDER_NAME',
      'SMTP_HOST',
      'GEMINI_API_KEY',
    ].filter((key) => !isConfigured(process.env[key]));

    res.json({
      success: true,
      data: {
        backend: 'ok',
        database: config.services.databaseConfigured ? 'configured' : 'missing',
        environment: config.environment,
        eInvoiceMode: config.eInvoiceMode,
        counts: { companies: companyCount, invoices: invoiceCount },
        config,
        billing,
        missingEnv,
        lastErrors: lastErrors.slice(0, 10),
        version: process.env.APP_VERSION || process.env.npm_package_version || 'non renseignee',
        build: process.env.BUILD_SHA || 'non renseigne',
        safetyWarnings: [
          config.eInvoiceMode === 'mock' ? 'Mode simulation - non legal' : null,
          !config.ttn.productionConfigured ? 'Configuration TTN manquante' : null,
          !config.signature.configured ? 'Signature reelle non configuree' : null,
          !config.teif.xsdConfigured ? 'XSD TEIF officiel manquant' : null,
          !config.ttn.documentationAvailable ? 'Documentation officielle TTN requise' : null,
          billing.warning,
        ].filter(Boolean),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch system health' });
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
    const current = await prisma.systemSetting.findUnique({ where: { id: getRouteId(req) as string } });
    const setting = await prisma.systemSetting.update({
      where: { id: getRouteId(req) as string },
      data: { value: req.body.value },
    });
    await logAdminAction(req, 'UPDATE_SYSTEM_SETTING', `Setting ${setting.key} updated from ${current?.value ?? '-'} to ${setting.value}`);
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating setting' });
  }
};

export const getIntegrationsStatus = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getIntegrationStatus() });
  } catch {
    res.status(500).json({ success: false, message: 'Unable to fetch integration status' });
  }
};

export const updateIntegration = async (req: Request, res: Response) => {
  try {
    const key = getRouteId(req) as IntegrationKey;
    if (!INTEGRATIONS[key]) return res.status(404).json({ success: false, message: 'Integration inconnue' });
    const status = await saveIntegrationSettings(key, req.body || {}, getAdminId(req));
    await logAdminAction(req, 'UPDATE_INTEGRATION_SECRET', `Integration ${key} updated`);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Impossible d'enregistrer l'integration" });
  }
};

export const testIntegration = async (req: Request, res: Response) => {
  const key = getRouteId(req) as IntegrationKey;
  const status = await getIntegrationStatus();
  const configured = key === 'ga4'
    ? status.analytics.ga4Configured
    : key === 'gtm'
      ? status.analytics.gtmConfigured
      : key === 'searchConsole'
        ? status.analytics.searchConsoleConfigured
        : key === 'metaPixel'
          ? status.analytics.metaPixelConfigured
          : Boolean((status as any)[key]?.configured);
  if (!configured) {
    return res.status(400).json({ success: false, message: 'Integration non configuree.' });
  }
  return res.json({
    success: true,
    data: {
      ok: false,
      message: key === 'ttn' || key === 'billing'
        ? 'Aucun test automatique officiel disponible pour cette integration. Configuration enregistree, test manuel requis.'
        : 'Configuration presente. Aucun secret expose.',
    },
  });
};

export const deleteCompany = async (req: Request, res: Response) => {
  const id = getRouteId(req) as string;
  try {
    if (req.body?.confirmPermanentDelete !== true) {
      const profile = await upsertCompanyOpsProfile(id, { status: 'suspended', dossierStatus: 'suspended' }, { adminId: getAdminId(req), note: 'Suspension automatique au lieu de suppression permanente' });
      await logAdminAction(req, 'SUSPEND_COMPANY_INSTEAD_OF_DELETE', `Company ${id} suspended instead of permanent delete`);
      return res.json({
        success: true,
        data: profile,
        message: 'Suppression permanente non executee. Entreprise suspendue pour conserver les donnees et la tracabilite.',
      });
    }

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
    const requestedStatus = String(req.body.status || '').toLowerCase();
    const allowedStatuses = ['active', 'pending', 'suspended', 'blocked'];
    if (allowedStatuses.includes(requestedStatus)) {
      const profile = await upsertCompanyOpsProfile(
        getRouteId(req) as string,
        { status: requestedStatus as any },
        { adminId: getAdminId(req), note: req.body.note || null }
      );
      await prisma.subscription.upsert({
        where: { companyId: getRouteId(req) as string },
        update: { status: requestedStatus === 'active' ? 'ACTIVE' : requestedStatus.toUpperCase() },
        create: { companyId: getRouteId(req) as string, status: requestedStatus === 'active' ? 'ACTIVE' : requestedStatus.toUpperCase() },
      });
      await logAdminAction(req, 'UPDATE_COMPANY_STATUS', `Company ${getRouteId(req)} status changed to ${requestedStatus}`);
      return res.json({ success: true, data: profile });
    }

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

export const updateCompanyDossierStatus = async (req: Request, res: Response) => {
  try {
    const dossierStatus = String(req.body.dossierStatus || '').toLowerCase();
    const allowed = [
      'incomplete',
      'pending_review',
      'pending_ttn_review',
      'missing_documents',
      'approved_by_ttn',
      'ready_for_test',
      'ready_for_production',
      'suspended',
    ];
    if (!allowed.includes(dossierStatus)) {
      return res.status(400).json({ success: false, message: 'Statut dossier invalide' });
    }
    const profile = await upsertCompanyOpsProfile(
      getRouteId(req) as string,
      {
        dossierStatus: dossierStatus as any,
        requestedDocuments: Array.isArray(req.body.requestedDocuments) ? req.body.requestedDocuments : undefined,
      },
      { adminId: getAdminId(req), note: req.body.note || null }
    );
    await logAdminAction(req, 'UPDATE_COMPANY_DOSSIER_STATUS', `Company ${getRouteId(req)} dossier status changed to ${dossierStatus}`);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise a jour du dossier' });
  }
};

export const updateCompanyPlan = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.subscription.findUnique({ where: { companyId: getRouteId(req) as string } });
    const updated = await prisma.subscription.upsert({
      where: { companyId: getRouteId(req) as string },
      update: { plan: req.body.plan, status: 'ACTIVE' },
      create: { companyId: getRouteId(req) as string, plan: req.body.plan, status: 'ACTIVE' },
    });
    await recordAdminCompanyStatusHistory({
      companyId: getRouteId(req) as string,
      adminId: getAdminId(req),
      actionType: 'plan_change',
      oldValue: existing?.plan || null,
      newValue: req.body.plan,
      note: req.body.note || null,
    });
    await logAdminAction(req, 'UPDATE_COMPANY_PLAN', `Company ${getRouteId(req)} plan changed to ${req.body.plan}`);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la mise a jour du plan' });
  }
};

export const resetCompanyQuota = async (req: Request, res: Response) => {
  try {
    await recordAdminCompanyStatusHistory({
      companyId: getRouteId(req) as string,
      adminId: getAdminId(req),
      actionType: 'quota_reset',
      oldValue: null,
      newValue: 'quota_reset_requested',
      note: req.body.note || 'Reset manuel demande par admin',
    });
    await logAdminAction(req, 'RESET_COMPANY_QUOTA', `Quota reset requested for company ${getRouteId(req)}`);
    res.json({ success: true, message: 'Quota reset enregistre. La limite repartira au prochain cycle mensuel.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to reset quota' });
  }
};

export const getAdminLogs = async (req: Request, res: Response) => {
  try {
    const { from, to, actionType, actor, search } = req.query;
    const where: any = {};
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(String(from)) } : {}),
        ...(to ? { lte: new Date(String(to)) } : {}),
      };
    }
    if (actor && actor !== 'all') where.adminId = String(actor);
    const logs = await prisma.activityLog.findMany({
      where,
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
      actionCategory: actionCategory(log.action),
      actionLabel: readableAction(log.action, log.details, log.admin?.name || 'Platform Admin'),
      entityType: 'admin_action',
      entityId: null,
      date: log.createdAt,
      ipAddress: log.details?.includes('ip=') ? log.details.split('ip=').pop() : null,
      details: log.details,
      severity: log.action.includes('ERROR') ? 'error' : log.action.includes('UPDATE') ? 'warning' : 'info',
      oldValue: log.details?.match(/ from ([^|]+) to /)?.[1]?.trim() || null,
      newValue: log.details?.match(/ to ([^|]+)/)?.[1]?.trim() || null,
      metadata: { rawDetails: log.details },
    }));

    const filtered = normalized.filter((row) => {
      if (actionType && actionType !== 'all' && row.actionCategory !== actionType && row.action !== actionType) return false;
      if (search && !`${row.actor} ${row.actorEmail} ${row.action} ${row.actionLabel} ${row.details} ${row.ipAddress}`.toLowerCase().includes(String(search).toLowerCase())) return false;
      return true;
    });

    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
};

export const exportAdminLogsCsv = async (req: Request, res: Response) => {
  const fakeRes: any = { json: (payload: any) => payload };
  const payload: any = await new Promise((resolve) => {
    const localRes: any = { json: resolve, status: () => localRes };
    getAdminLogs(req, localRes);
  });
  const rows = payload.data || [];
  const headers = ['Date', 'Actor', 'Company', 'Action', 'Old value', 'New value', 'IP', 'Details'];
  const escape = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((row: any) => [row.date, row.actorEmail || row.actor, row.company || 'Plateforme', row.actionLabel, row.oldValue, row.newValue, row.ipAddress, row.details].map(escape).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="admin-activity-logs.csv"');
  res.send(csv);
};

export const sendGlobalNotification = async (req: Request, res: Response) => {
  try {
    const target = req.body.target || 'all';
    const profiles = await getCompanyOpsProfiles();
    const companies = await prisma.company.findMany({ include: { subscription: true } });
    const recipients = companies.filter((company) => {
      const profile = profiles.find((item) => item.companyId === company.id);
      if (target === 'active') return (profile?.status || 'active') === 'active';
      if (target === 'trial') return !company.subscription || company.subscription.plan === 'STARTER';
      if (target === 'suspended') return ['suspended', 'blocked'].includes(profile?.status || '') || company.subscription?.status === 'CANCELLED';
      return true;
    });
    await prisma.notification.createMany({
      data: recipients.map((company) => ({
        companyId: company.id,
        title: req.body.title,
        message: req.body.message,
        type: req.body.type || 'INFO',
      })),
    });
    await logAdminAction(req, 'SEND_GLOBAL_NOTIFICATION', `Notification "${req.body.title}" sent to target=${target}, recipients=${recipients.length}`);
    res.json({ success: true, data: { recipientsCount: recipients.length }, message: `Notification envoyee a ${recipients.length} entreprises.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending notification' });
  }
};

export {
  getAdminAnalyticsOverview,
  getAdminAnalyticsPages,
  getAdminAnalyticsReferrers,
  getAdminAnalyticsEvents,
  getSearchConsole,
  getSeoPagesAudit,
};
