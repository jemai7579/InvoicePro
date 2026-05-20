"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOfferPublicToken = exports.createOfferForCompany = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../prisma"));
const numberingService_1 = require("./numberingService");
const createOfferForCompany = async (companyId, payload) => {
    return prisma_1.default.$transaction(async (tx) => {
        const number = await (0, numberingService_1.generateBusinessNumber)(tx, companyId, 'OFFER');
        return tx.offer.create({
            data: {
                companyId,
                clientId: payload.clientId || null,
                invoiceRequestId: payload.invoiceRequestId || null,
                number,
                title: String(payload.title || '').trim(),
                description: payload.description || null,
                estimatedAmount: Number(payload.estimatedAmount || 0),
                deliveryDelay: payload.deliveryDelay || null,
                validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
                terms: payload.terms || null,
                purchaseOrderReference: payload.purchaseOrderReference || null,
                status: payload.status || 'DRAFT',
            },
            include: { client: true, comments: true },
        });
    });
};
exports.createOfferForCompany = createOfferForCompany;
const getOfferPublicToken = () => crypto_1.default.randomBytes(24).toString('hex');
exports.getOfferPublicToken = getOfferPublicToken;
