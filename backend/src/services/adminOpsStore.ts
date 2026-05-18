import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

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
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
  createdAt: string;
  updatedAt: string;
};

export type PaymentEntry = {
  id: string;
  companyId: string;
  plan: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDate?: string | null;
  nextBillingDate?: string | null;
  method?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminOpsData = {
  notes: AdminNote[];
  tickets: SupportTicket[];
  errors: SystemErrorEntry[];
  payments: PaymentEntry[];
};

const rootDir = path.resolve('uploads/admin');
const dataPath = path.join(rootDir, 'ops-data.json');

const defaultData: AdminOpsData = {
  notes: [],
  tickets: [],
  errors: [],
  payments: [],
};

const ensureStore = async () => {
  await fs.ensureDir(rootDir);
  if (!(await fs.pathExists(dataPath))) {
    await fs.writeJson(dataPath, defaultData, { spaces: 2 });
  }
};

const readStore = async (): Promise<AdminOpsData> => {
  await ensureStore();
  return fs.readJson(dataPath);
};

const writeStore = async (data: AdminOpsData) => {
  await ensureStore();
  await fs.writeJson(dataPath, data, { spaces: 2 });
  return data;
};

const nextId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

export const getAdminNotes = async (targetType?: 'company' | 'user', targetId?: string) => {
  const data = await readStore();
  return data.notes.filter((note) => {
    if (targetType && note.targetType !== targetType) return false;
    if (targetId && note.targetId !== targetId) return false;
    return true;
  });
};

export const addAdminNote = async (note: Omit<AdminNote, 'id' | 'createdAt'>) => {
  const data = await readStore();
  const entry: AdminNote = {
    ...note,
    id: nextId('note'),
    createdAt: new Date().toISOString(),
  };
  data.notes.unshift(entry);
  await writeStore(data);
  return entry;
};

export const getSupportTickets = async () => {
  const data = await readStore();
  return data.tickets;
};

export const upsertSupportTicket = async (ticket: Partial<SupportTicket> & Pick<SupportTicket, 'companyId' | 'subject'>) => {
  const data = await readStore();
  if (ticket.id) {
    data.tickets = data.tickets.map((item) =>
      item.id === ticket.id
        ? {
            ...item,
            ...ticket,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    await writeStore(data);
    return data.tickets.find((item) => item.id === ticket.id) || null;
  }

  const entry: SupportTicket = {
    id: nextId('ticket'),
    companyId: ticket.companyId,
    userLabel: ticket.userLabel || 'Company owner',
    subject: ticket.subject,
    priority: ticket.priority || 'medium',
    status: ticket.status || 'open',
    assignedTo: ticket.assignedTo || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replies: ticket.replies || [],
  };

  data.tickets.unshift(entry);
  await writeStore(data);
  return entry;
};

export const addTicketReply = async (
  ticketId: string,
  reply: Omit<SupportReply, 'id' | 'createdAt'>
) => {
  const data = await readStore();
  data.tickets = data.tickets.map((ticket) =>
    ticket.id === ticketId
      ? {
          ...ticket,
          updatedAt: new Date().toISOString(),
          replies: [
            ...ticket.replies,
            {
              ...reply,
              id: nextId('reply'),
              createdAt: new Date().toISOString(),
            },
          ],
        }
      : ticket
  );
  await writeStore(data);
  return data.tickets.find((ticket) => ticket.id === ticketId) || null;
};

export const getSystemErrorsStore = async () => {
  const data = await readStore();
  return data.errors;
};

export const upsertSystemError = async (payload: Partial<SystemErrorEntry> & Pick<SystemErrorEntry, 'type' | 'message' | 'severity'>) => {
  const data = await readStore();
  if (payload.id) {
    data.errors = data.errors.map((entry) =>
      entry.id === payload.id
        ? {
            ...entry,
            ...payload,
            updatedAt: new Date().toISOString(),
          }
        : entry
    );
    await writeStore(data);
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.errors.unshift(entry);
  await writeStore(data);
  return entry;
};

export const getPaymentsStore = async () => {
  const data = await readStore();
  return data.payments;
};

export const upsertPaymentEntry = async (
  payload: Partial<PaymentEntry> & Pick<PaymentEntry, 'companyId' | 'plan' | 'amount' | 'status'>
) => {
  const data = await readStore();
  if (payload.id) {
    data.payments = data.payments.map((payment) =>
      payment.id === payload.id
        ? {
            ...payment,
            ...payload,
            updatedAt: new Date().toISOString(),
          }
        : payment
    );
    await writeStore(data);
    return data.payments.find((payment) => payment.id === payload.id) || null;
  }

  const entry: PaymentEntry = {
    id: nextId('payment'),
    companyId: payload.companyId,
    plan: payload.plan,
    amount: payload.amount,
    status: payload.status,
    paymentDate: payload.paymentDate || null,
    nextBillingDate: payload.nextBillingDate || null,
    method: payload.method || null,
    note: payload.note || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.payments.unshift(entry);
  await writeStore(data);
  return entry;
};
