/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dataPath = path.resolve(__dirname, '..', 'uploads', 'admin', 'ops-data.json');

const readJson = () => {
  if (!fs.existsSync(dataPath)) return { notes: [], tickets: [], errors: [], payments: [], companyProfiles: [] };
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  return {
    notes: raw.notes || [],
    tickets: raw.tickets || [],
    errors: raw.errors || [],
    payments: raw.payments || [],
    companyProfiles: raw.companyProfiles || [],
  };
};

const nullableDate = (value) => (value ? new Date(value) : null);

async function main() {
  const data = readJson();
  const counters = { profiles: 0, notes: 0, tickets: 0, replies: 0, errors: 0, payments: 0 };

  for (const profile of data.companyProfiles) {
    await prisma.adminCompanyProfile.upsert({
      where: { companyId: profile.companyId },
      update: {
        status: profile.status || 'active',
        dossierStatus: profile.dossierStatus || 'incomplete',
        requestedDocuments: profile.requestedDocuments || [],
      },
      create: {
        companyId: profile.companyId,
        status: profile.status || 'active',
        dossierStatus: profile.dossierStatus || 'incomplete',
        requestedDocuments: profile.requestedDocuments || [],
      },
    });
    counters.profiles += 1;
  }

  for (const note of data.notes) {
    const companyId = note.targetType === 'company' ? note.targetId : null;
    const company = companyId ? await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } }) : null;
    await prisma.adminCompanyNote.upsert({
      where: { id: note.id },
      update: {},
      create: {
        id: note.id,
        targetType: note.targetType || 'company',
        targetId: note.targetId,
        companyId: company?.id || null,
        adminId: note.authorId || null,
        authorName: note.authorName || 'Platform Admin',
        content: note.content || '',
        createdAt: new Date(note.createdAt || Date.now()),
      },
    });
    counters.notes += 1;
  }

  for (const ticket of data.tickets) {
    await prisma.adminSupportTicket.upsert({
      where: { id: ticket.id },
      update: {},
      create: {
        id: ticket.id,
        companyId: ticket.companyId || null,
        userLabel: ticket.userLabel || 'Company owner',
        subject: ticket.subject || 'Ticket admin importe',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        assignedTo: ticket.assignedTo || null,
        createdAt: new Date(ticket.createdAt || Date.now()),
        updatedAt: new Date(ticket.updatedAt || ticket.createdAt || Date.now()),
      },
    });
    counters.tickets += 1;
    for (const reply of ticket.replies || []) {
      await prisma.adminSupportReply.upsert({
        where: { id: reply.id },
        update: {},
        create: {
          id: reply.id,
          ticketId: ticket.id,
          adminId: reply.authorId || null,
          authorName: reply.authorName || 'Platform Admin',
          message: reply.message || '',
          createdAt: new Date(reply.createdAt || Date.now()),
        },
      });
      counters.replies += 1;
    }
  }

  for (const entry of data.errors) {
    await prisma.adminSystemError.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        type: entry.type || 'Manual',
        companyId: entry.companyId || null,
        severity: entry.severity || 'medium',
        message: entry.message || '',
        status: entry.status || 'new',
        note: entry.note || null,
        createdAt: new Date(entry.createdAt || Date.now()),
        updatedAt: new Date(entry.updatedAt || entry.createdAt || Date.now()),
      },
    });
    counters.errors += 1;
  }

  for (const payment of data.payments) {
    await prisma.adminPlatformPayment.upsert({
      where: { id: payment.id },
      update: {},
      create: {
        id: payment.id,
        companyId: payment.companyId,
        plan: payment.plan || 'STARTER',
        amount: Number(payment.amount || 0),
        status: payment.status || 'pending',
        paymentDate: nullableDate(payment.paymentDate),
        nextBillingDate: nullableDate(payment.nextBillingDate),
        method: payment.method || null,
        note: payment.note || null,
        createdAt: new Date(payment.createdAt || Date.now()),
        updatedAt: new Date(payment.updatedAt || payment.createdAt || Date.now()),
      },
    });
    counters.payments += 1;
  }

  console.log('Admin ops JSON import complete:', counters);
}

main()
  .catch((error) => {
    console.error('Admin ops JSON import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
