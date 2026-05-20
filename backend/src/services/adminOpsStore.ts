import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import prisma from '../prisma';

export type AdminNote = {
  id: string;
  targetType: 'company' | 'user';
  targetId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type SupportReply = {
  id: string;
  authorId: string;
  authorName: string;
  message: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  companyId: string;
  userLabel: string;
  subject: string;
  message: string;
  category: 'general' | 'billing' | 'TTN' | 'signature' | 'technical' | 'dossier';
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string | null;
  replies: SupportReply[];
};

export type SystemErrorEntry = {
  id: string;
  type: string;
  companyId?: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'new' | 'investigating' | 'resolved';
  note?: string | null;
  route?: string | null;
  stack?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentEntry = {
  id: string;
  companyId: string;
  plan: string;
  amount: number;
  currency?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'manual';
  paymentDate?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  nextBillingDate?: string | null;
  method?: string | null;
  providerReference?: string | null;
  createdByAdminId?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyOpsProfile = {
  companyId: string;
  status: 'active' | 'pending' | 'suspended' | 'blocked';
  dossierStatus:
    | 'incomplete'
    | 'pending_review'
    | 'pending_ttn_review'
    | 'missing_documents'
    | 'approved_by_ttn'
    | 'ready_for_test'
    | 'ready_for_production'
    | 'suspended';
  requestedDocuments?: string[] | null;
  updatedAt: string;
};

type AdminOpsData = {
  notes: AdminNote[];
  tickets: SupportTicket[];
  errors: SystemErrorEntry[];
  payments: PaymentEntry[];
  companyProfiles: CompanyOpsProfile[];
};

const rootDir = path.resolve('uploads/admin');
const dataPath = path.join(rootDir, 'ops-data.json');

const defaultData: AdminOpsData = {
  notes: [],
  tickets: [],
  errors: [],
  payments: [],
  companyProfiles: [],
};

const ensureStore = async () => {
  await fs.ensureDir(rootDir);
  if (!(await fs.pathExists(dataPath))) {
    await fs.writeJson(dataPath, defaultData, { spaces: 2 });
  }
};

export const readLegacyAdminOpsStore = async (): Promise<AdminOpsData> => {
  await ensureStore();
  const data = await fs.readJson(dataPath);
  return { ...defaultData, ...data, companyProfiles: data.companyProfiles || [] };
};

const writeLegacyStore = async (data: AdminOpsData) => {
  await ensureStore();
  await fs.writeJson(dataPath, data, { spaces: 2 });
  return data;
};

const nextId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

const isMissingAdminOpsTable = (error: any) =>
  error?.code === 'P2021' ||
  error?.code === 'P2022' ||
  String(error?.message || '').includes('AdminCompanyProfile') ||
  String(error?.message || '').includes('AdminCompanyNote') ||
  String(error?.message || '').includes('AdminSupportTicket') ||
  String(error?.message || '').includes('AdminSystemError') ||
  String(error?.message || '').includes('AdminPlatformPayment');

const toIso = (value: any) => new Date(value || Date.now()).toISOString();

const normalizeNote = (note: any): AdminNote => ({
  id: note.id,
  targetType: note.targetType || 'company',
  targetId: note.targetId || note.companyId,
  authorId: note.adminId || note.authorId || '',
  authorName: note.authorName || 'Platform admin',
  content: note.content,
  createdAt: toIso(note.createdAt),
});

const normalizeTicket = (ticket: any): SupportTicket => ({
  id: ticket.id,
  companyId: ticket.companyId || '',
  userLabel: ticket.userLabel || 'Company owner',
  subject: ticket.subject,
  message: ticket.message || '',
  category: ticket.category || 'general',
  priority: ticket.priority || 'normal',
  status: ticket.status || 'open',
  assignedTo: ticket.assignedTo || null,
  createdAt: toIso(ticket.createdAt),
  updatedAt: toIso(ticket.updatedAt),
  replies: (ticket.replies || []).map((reply: any) => ({
    id: reply.id,
    authorId: reply.adminId || reply.authorId || '',
    authorName: reply.authorName || 'Platform admin',
    message: reply.message,
    createdAt: toIso(reply.createdAt),
  })),
});

const normalizeError = (entry: any): SystemErrorEntry => ({
  id: entry.id,
  type: entry.type,
  companyId: entry.companyId || null,
  severity: entry.severity,
  message: entry.message,
  status: entry.status || 'new',
  note: entry.note || null,
  route: entry.route || null,
  stack: entry.stack || null,
  resolvedAt: entry.resolvedAt ? toIso(entry.resolvedAt) : null,
  createdAt: toIso(entry.createdAt),
  updatedAt: toIso(entry.updatedAt),
});

const normalizePayment = (payment: any): PaymentEntry => ({
  id: payment.id,
  companyId: payment.companyId,
  plan: payment.plan,
  amount: Number(payment.amount || 0),
  currency: payment.currency || 'TND',
  status: payment.status,
  paymentDate: payment.paymentDate ? toIso(payment.paymentDate) : null,
  periodStart: payment.periodStart ? toIso(payment.periodStart) : null,
  periodEnd: payment.periodEnd ? toIso(payment.periodEnd) : null,
  nextBillingDate: payment.nextBillingDate ? toIso(payment.nextBillingDate) : null,
  method: payment.method || null,
  providerReference: payment.providerReference || null,
  createdByAdminId: payment.createdByAdminId || null,
  note: payment.note || null,
  createdAt: toIso(payment.createdAt),
  updatedAt: toIso(payment.updatedAt),
});

export const getAdminNotes = async (targetType?: 'company' | 'user', targetId?: string): Promise<AdminNote[]> => {
  try {
    const rows = await (prisma as any).adminCompanyNote.findMany({
      where: {
        ...(targetType ? { targetType } : {}),
        ...(targetId ? { targetId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(normalizeNote);
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    return data.notes.filter((note) => {
      if (targetType && note.targetType !== targetType) return false;
      if (targetId && note.targetId !== targetId) return false;
      return true;
    });
  }
};

export const addAdminNote = async (note: Omit<AdminNote, 'id' | 'createdAt'>): Promise<AdminNote> => {
  try {
    const row = await (prisma as any).adminCompanyNote.create({
      data: {
        targetType: note.targetType,
        targetId: note.targetId,
        companyId: note.targetType === 'company' ? note.targetId : null,
        adminId: note.authorId || null,
        authorName: note.authorName,
        content: note.content,
      },
    });
    return normalizeNote(row);
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    const entry: AdminNote = { ...note, id: nextId('note'), createdAt: new Date().toISOString() };
    data.notes.unshift(entry);
    await writeLegacyStore(data);
    return entry;
  }
};

export const getCompanyOpsProfiles = async (): Promise<CompanyOpsProfile[]> => {
  try {
    const rows = await (prisma as any).adminCompanyProfile.findMany();
    return rows.map((profile: any) => ({
      companyId: profile.companyId,
      status: profile.status,
      dossierStatus: profile.dossierStatus,
      requestedDocuments: profile.requestedDocuments || [],
      updatedAt: toIso(profile.updatedAt),
    }));
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    return data.companyProfiles;
  }
};

export const getCompanyOpsProfile = async (companyId: string): Promise<CompanyOpsProfile | null> => {
  try {
    const profile = await (prisma as any).adminCompanyProfile.findUnique({ where: { companyId } });
    return profile
      ? {
          companyId: profile.companyId,
          status: profile.status,
          dossierStatus: profile.dossierStatus,
          requestedDocuments: profile.requestedDocuments || [],
          updatedAt: toIso(profile.updatedAt),
        }
      : null;
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    return data.companyProfiles.find((profile) => profile.companyId === companyId) || null;
  }
};

export const upsertCompanyOpsProfile = async (
  companyId: string,
  updates: Partial<Omit<CompanyOpsProfile, 'companyId' | 'updatedAt'>>,
  meta: { adminId?: string | null; note?: string | null } = {}
): Promise<CompanyOpsProfile> => {
  try {
    const existing = await (prisma as any).adminCompanyProfile.findUnique({ where: { companyId } });
    const row = await (prisma as any).adminCompanyProfile.upsert({
      where: { companyId },
      update: {
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.dossierStatus ? { dossierStatus: updates.dossierStatus } : {}),
        ...(updates.requestedDocuments ? { requestedDocuments: updates.requestedDocuments } : {}),
      },
      create: {
        companyId,
        status: updates.status || 'active',
        dossierStatus: updates.dossierStatus || 'incomplete',
        requestedDocuments: updates.requestedDocuments || [],
      },
    });

    if (updates.status && existing?.status !== updates.status) {
      await (prisma as any).adminCompanyStatusHistory.create({
        data: {
          companyId,
          adminId: meta.adminId || null,
          oldValue: existing?.status || null,
          newValue: updates.status,
          actionType: 'status_change',
          note: meta.note || null,
        },
      });
    }
    if (updates.dossierStatus && existing?.dossierStatus !== updates.dossierStatus) {
      await (prisma as any).adminDossierStatusHistory.create({
        data: {
          companyId,
          adminId: meta.adminId || null,
          oldStatus: existing?.dossierStatus || null,
          newStatus: updates.dossierStatus,
          note: meta.note || null,
        },
      });
    }

    return {
      companyId: row.companyId,
      status: row.status,
      dossierStatus: row.dossierStatus,
      requestedDocuments: row.requestedDocuments || [],
      updatedAt: toIso(row.updatedAt),
    };
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    const existing = data.companyProfiles.find((profile) => profile.companyId === companyId);
    const next: CompanyOpsProfile = {
      companyId,
      status: updates.status || existing?.status || 'active',
      dossierStatus: updates.dossierStatus || existing?.dossierStatus || 'incomplete',
      requestedDocuments: updates.requestedDocuments || existing?.requestedDocuments || [],
      updatedAt: new Date().toISOString(),
    };
    data.companyProfiles = existing
      ? data.companyProfiles.map((profile) => (profile.companyId === companyId ? next : profile))
      : [next, ...data.companyProfiles];
    await writeLegacyStore(data);
    return next;
  }
};

export const recordAdminCompanyStatusHistory = async (entry: {
  companyId: string;
  adminId?: string | null;
  actionType: string;
  oldValue?: string | null;
  newValue: string;
  note?: string | null;
}) => {
  try {
    return (prisma as any).adminCompanyStatusHistory.create({
      data: {
        companyId: entry.companyId,
        adminId: entry.adminId || null,
        actionType: entry.actionType,
        oldValue: entry.oldValue || null,
        newValue: entry.newValue,
        note: entry.note || null,
      },
    });
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    return null;
  }
};

export const getCompanyAdminHistory = async (companyId: string) => {
  try {
    const [statusHistory, dossierHistory] = await Promise.all([
      (prisma as any).adminCompanyStatusHistory.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      (prisma as any).adminDossierStatusHistory.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    return {
      statusHistory: statusHistory.map((entry: any) => ({ ...entry, createdAt: toIso(entry.createdAt) })),
      dossierHistory: dossierHistory.map((entry: any) => ({ ...entry, createdAt: toIso(entry.createdAt) })),
    };
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    return { statusHistory: [], dossierHistory: [] };
  }
};

export const getSupportTickets = async (): Promise<SupportTicket[]> => {
  try {
    const rows = await (prisma as any).adminSupportTicket.findMany({
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(normalizeTicket);
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    return data.tickets;
  }
};

export const upsertSupportTicket = async (ticket: Partial<SupportTicket> & Pick<SupportTicket, 'companyId' | 'subject'>): Promise<SupportTicket | null> => {
  try {
    const row = ticket.id
      ? await (prisma as any).adminSupportTicket.update({
          where: { id: ticket.id },
          data: {
            companyId: ticket.companyId || null,
            userLabel: ticket.userLabel,
            subject: ticket.subject,
            message: ticket.message,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            assignedTo: ticket.assignedTo,
          },
          include: { replies: true },
        })
      : await (prisma as any).adminSupportTicket.create({
          data: {
            companyId: ticket.companyId || null,
            userLabel: ticket.userLabel || 'Company owner',
            subject: ticket.subject,
            message: ticket.message || '',
            category: ticket.category || 'general',
            priority: ticket.priority || 'normal',
            status: ticket.status || 'open',
            assignedTo: ticket.assignedTo || null,
          },
          include: { replies: true },
        });
    return normalizeTicket(row);
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    if (ticket.id) {
      data.tickets = data.tickets.map((item) =>
        item.id === ticket.id ? { ...item, ...ticket, updatedAt: new Date().toISOString() } : item
      );
      await writeLegacyStore(data);
      return data.tickets.find((item) => item.id === ticket.id) || null;
    }
    const entry: SupportTicket = {
      id: nextId('ticket'),
      companyId: ticket.companyId,
      userLabel: ticket.userLabel || 'Company owner',
      subject: ticket.subject,
      message: ticket.message || '',
      category: ticket.category || 'general',
      priority: ticket.priority || 'normal',
      status: ticket.status || 'open',
      assignedTo: ticket.assignedTo || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: ticket.replies || [],
    };
    data.tickets.unshift(entry);
    await writeLegacyStore(data);
    return entry;
  }
};

export const addTicketReply = async (ticketId: string, reply: Omit<SupportReply, 'id' | 'createdAt'>): Promise<SupportTicket | null> => {
  try {
    await (prisma as any).adminSupportReply.create({
      data: {
        ticketId,
        adminId: reply.authorId || null,
        authorName: reply.authorName,
        message: reply.message,
      },
    });
    const ticket = await (prisma as any).adminSupportTicket.findUnique({
      where: { id: ticketId },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    return ticket ? normalizeTicket(ticket) : null;
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    data.tickets = data.tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            updatedAt: new Date().toISOString(),
            replies: [...ticket.replies, { ...reply, id: nextId('reply'), createdAt: new Date().toISOString() }],
          }
        : ticket
    );
    await writeLegacyStore(data);
    return data.tickets.find((ticket) => ticket.id === ticketId) || null;
  }
};

export const getSystemErrorsStore = async (): Promise<SystemErrorEntry[]> => {
  try {
    const rows = await (prisma as any).adminSystemError.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(normalizeError);
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    return data.errors;
  }
};

export const upsertSystemError = async (payload: Partial<SystemErrorEntry> & Pick<SystemErrorEntry, 'type' | 'message' | 'severity'>): Promise<SystemErrorEntry | null> => {
  try {
    const row = payload.id
      ? await (prisma as any).adminSystemError.update({
          where: { id: payload.id },
          data: {
            type: payload.type,
            companyId: payload.companyId || null,
            severity: payload.severity,
            message: payload.message,
            status: payload.status,
            note: payload.note,
            route: payload.route,
            stack: process.env.NODE_ENV === 'production' ? null : payload.stack,
            resolvedAt: payload.status === 'resolved' ? new Date() : payload.resolvedAt ? new Date(payload.resolvedAt) : undefined,
          },
        })
      : await (prisma as any).adminSystemError.create({
          data: {
            type: payload.type,
            companyId: payload.companyId || null,
            severity: payload.severity,
            message: payload.message,
            status: payload.status || 'new',
            note: payload.note || null,
            route: payload.route || null,
            stack: process.env.NODE_ENV === 'production' ? null : payload.stack || null,
            resolvedAt: payload.status === 'resolved' ? new Date() : null,
          },
        });
    return normalizeError(row);
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    if (payload.id) {
      data.errors = data.errors.map((entry) =>
        entry.id === payload.id ? { ...entry, ...payload, updatedAt: new Date().toISOString() } : entry
      );
      await writeLegacyStore(data);
      return data.errors.find((entry) => entry.id === payload.id) || null;
    }
    const entry: SystemErrorEntry = {
      id: nextId('error'),
      type: payload.type,
      companyId: payload.companyId || null,
      severity: payload.severity,
      message: payload.message,
      status: payload.status || 'new',
      note: payload.note || null,
      route: payload.route || null,
      stack: process.env.NODE_ENV === 'production' ? null : payload.stack || null,
      resolvedAt: payload.status === 'resolved' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.errors.unshift(entry);
    await writeLegacyStore(data);
    return entry;
  }
};

export const getPaymentsStore = async (): Promise<PaymentEntry[]> => {
  try {
    const rows = await (prisma as any).adminPlatformPayment.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(normalizePayment);
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const data = await readLegacyAdminOpsStore();
    return data.payments;
  }
};

export const upsertPaymentEntry = async (
  payload: Partial<PaymentEntry> & Pick<PaymentEntry, 'companyId' | 'plan' | 'amount' | 'status'>
): Promise<PaymentEntry | null> => {
  try {
    const data = {
      companyId: payload.companyId,
      plan: payload.plan,
      amount: Number(payload.amount || 0),
      currency: payload.currency || 'TND',
      status: payload.status,
      paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : null,
      periodStart: payload.periodStart ? new Date(payload.periodStart) : null,
      periodEnd: payload.periodEnd ? new Date(payload.periodEnd) : null,
      nextBillingDate: payload.nextBillingDate ? new Date(payload.nextBillingDate) : null,
      method: payload.method || null,
      providerReference: payload.providerReference || null,
      createdByAdminId: payload.createdByAdminId || null,
      note: payload.note || null,
    };
    const row = payload.id
      ? await (prisma as any).adminPlatformPayment.update({ where: { id: payload.id }, data })
      : await (prisma as any).adminPlatformPayment.create({ data });
    return normalizePayment(row);
  } catch (error) {
    if (!isMissingAdminOpsTable(error)) throw error;
    const legacy = await readLegacyAdminOpsStore();
    if (payload.id) {
      legacy.payments = legacy.payments.map((payment) =>
        payment.id === payload.id ? { ...payment, ...payload, updatedAt: new Date().toISOString() } : payment
      );
      await writeLegacyStore(legacy);
      return legacy.payments.find((payment) => payment.id === payload.id) || null;
    }
    const entry: PaymentEntry = {
      id: nextId('payment'),
      companyId: payload.companyId,
      plan: payload.plan,
      amount: payload.amount,
      currency: payload.currency || 'TND',
      status: payload.status,
      paymentDate: payload.paymentDate || null,
      periodStart: payload.periodStart || null,
      periodEnd: payload.periodEnd || null,
      nextBillingDate: payload.nextBillingDate || null,
      method: payload.method || null,
      providerReference: payload.providerReference || null,
      createdByAdminId: payload.createdByAdminId || null,
      note: payload.note || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    legacy.payments.unshift(entry);
    await writeLegacyStore(legacy);
    return entry;
  }
};
