"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertPaymentEntry = exports.getPaymentsStore = exports.upsertSystemError = exports.getSystemErrorsStore = exports.addTicketReply = exports.upsertSupportTicket = exports.getSupportTickets = exports.addAdminNote = exports.getAdminNotes = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const rootDir = path_1.default.resolve('uploads/admin');
const dataPath = path_1.default.join(rootDir, 'ops-data.json');
const defaultData = {
    notes: [],
    tickets: [],
    errors: [],
    payments: [],
};
const ensureStore = async () => {
    await fs_extra_1.default.ensureDir(rootDir);
    if (!(await fs_extra_1.default.pathExists(dataPath))) {
        await fs_extra_1.default.writeJson(dataPath, defaultData, { spaces: 2 });
    }
};
const readStore = async () => {
    await ensureStore();
    return fs_extra_1.default.readJson(dataPath);
};
const writeStore = async (data) => {
    await ensureStore();
    await fs_extra_1.default.writeJson(dataPath, data, { spaces: 2 });
    return data;
};
const nextId = (prefix) => `${prefix}_${crypto_1.default.randomUUID()}`;
const getAdminNotes = async (targetType, targetId) => {
    const data = await readStore();
    return data.notes.filter((note) => {
        if (targetType && note.targetType !== targetType)
            return false;
        if (targetId && note.targetId !== targetId)
            return false;
        return true;
    });
};
exports.getAdminNotes = getAdminNotes;
const addAdminNote = async (note) => {
    const data = await readStore();
    const entry = {
        ...note,
        id: nextId('note'),
        createdAt: new Date().toISOString(),
    };
    data.notes.unshift(entry);
    await writeStore(data);
    return entry;
};
exports.addAdminNote = addAdminNote;
const getSupportTickets = async () => {
    const data = await readStore();
    return data.tickets;
};
exports.getSupportTickets = getSupportTickets;
const upsertSupportTicket = async (ticket) => {
    const data = await readStore();
    if (ticket.id) {
        data.tickets = data.tickets.map((item) => item.id === ticket.id
            ? {
                ...item,
                ...ticket,
                updatedAt: new Date().toISOString(),
            }
            : item);
        await writeStore(data);
        return data.tickets.find((item) => item.id === ticket.id) || null;
    }
    const entry = {
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
exports.upsertSupportTicket = upsertSupportTicket;
const addTicketReply = async (ticketId, reply) => {
    const data = await readStore();
    data.tickets = data.tickets.map((ticket) => ticket.id === ticketId
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
        : ticket);
    await writeStore(data);
    return data.tickets.find((ticket) => ticket.id === ticketId) || null;
};
exports.addTicketReply = addTicketReply;
const getSystemErrorsStore = async () => {
    const data = await readStore();
    return data.errors;
};
exports.getSystemErrorsStore = getSystemErrorsStore;
const upsertSystemError = async (payload) => {
    const data = await readStore();
    if (payload.id) {
        data.errors = data.errors.map((entry) => entry.id === payload.id
            ? {
                ...entry,
                ...payload,
                updatedAt: new Date().toISOString(),
            }
            : entry);
        await writeStore(data);
        return data.errors.find((entry) => entry.id === payload.id) || null;
    }
    const entry = {
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
exports.upsertSystemError = upsertSystemError;
const getPaymentsStore = async () => {
    const data = await readStore();
    return data.payments;
};
exports.getPaymentsStore = getPaymentsStore;
const upsertPaymentEntry = async (payload) => {
    const data = await readStore();
    if (payload.id) {
        data.payments = data.payments.map((payment) => payment.id === payload.id
            ? {
                ...payment,
                ...payload,
                updatedAt: new Date().toISOString(),
            }
            : payment);
        await writeStore(data);
        return data.payments.find((payment) => payment.id === payload.id) || null;
    }
    const entry = {
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
exports.upsertPaymentEntry = upsertPaymentEntry;
