"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeBusinessNumberForFileName = exports.getClientVisibleNumber = exports.getDevisVisibleNumber = exports.getInvoiceVisibleNumber = exports.getFallbackVisibleNumber = exports.generateBusinessNumber = void 0;
const PREFIX_BY_TYPE = {
    INVOICE: 'FAC',
    DEVIS: 'DEV',
    PROJECT: 'PRJ',
    CLIENT: 'CL',
};
const padSequence = (value) => String(value).padStart(6, '0');
const getRecordYear = (date) => {
    const value = date ? new Date(date) : new Date();
    return value.getFullYear();
};
const generateBusinessNumber = async (tx, companyId, entityType, date) => {
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
exports.generateBusinessNumber = generateBusinessNumber;
const getFallbackVisibleNumber = (id) => id.slice(0, 8).toUpperCase();
exports.getFallbackVisibleNumber = getFallbackVisibleNumber;
const getInvoiceVisibleNumber = (invoice) => invoice.number || (0, exports.getFallbackVisibleNumber)(invoice.id);
exports.getInvoiceVisibleNumber = getInvoiceVisibleNumber;
const getDevisVisibleNumber = (devis) => devis.number || (0, exports.getFallbackVisibleNumber)(devis.id);
exports.getDevisVisibleNumber = getDevisVisibleNumber;
const getClientVisibleNumber = (client) => client.number || (0, exports.getFallbackVisibleNumber)(client.id);
exports.getClientVisibleNumber = getClientVisibleNumber;
const sanitizeBusinessNumberForFileName = (value) => value.replace(/[^\w-]/g, '_');
exports.sanitizeBusinessNumberForFileName = sanitizeBusinessNumberForFileName;
