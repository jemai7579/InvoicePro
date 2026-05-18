import { Prisma, DocumentSequenceType } from '@prisma/client';

const PREFIX_BY_TYPE: Record<DocumentSequenceType, string> = {
  INVOICE: 'FAC',
  DEVIS: 'DEV',
  PROJECT: 'PRJ',
  CLIENT: 'CL',
};

const padSequence = (value: number) => String(value).padStart(6, '0');

const getRecordYear = (date?: Date | string | null) => {
  const value = date ? new Date(date) : new Date();
  return value.getFullYear();
};

export const generateBusinessNumber = async (
  tx: Prisma.TransactionClient,
  companyId: string,
  entityType: DocumentSequenceType,
  date?: Date | string | null
) => {
  const year = getRecordYear(date);
  const sequence = await tx.documentSequence.upsert({
    where: {
      companyId_entityType_year: {
        companyId,
        entityType,
        year,
      },
    },
    create: {
      companyId,
      entityType,
      year,
      currentValue: 1,
    },
    update: {
      currentValue: {
        increment: 1,
      },
    },
  });

  return `${PREFIX_BY_TYPE[entityType]}-${year}-${padSequence(sequence.currentValue)}`;
};

export const getFallbackVisibleNumber = (id: string) => id.slice(0, 8).toUpperCase();

export const getInvoiceVisibleNumber = (invoice: { id: string; number?: string | null }) =>
  invoice.number || getFallbackVisibleNumber(invoice.id);

export const getDevisVisibleNumber = (devis: { id: string; number?: string | null }) =>
  devis.number || getFallbackVisibleNumber(devis.id);

export const getClientVisibleNumber = (client: { id: string; number?: string | null }) =>
  client.number || getFallbackVisibleNumber(client.id);

export const sanitizeBusinessNumberForFileName = (value: string) => value.replace(/[^\w-]/g, '_');
