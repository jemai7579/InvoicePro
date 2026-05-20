"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectedPartners = exports.upsertAcceptedConnection = exports.hasAcceptedConnection = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const orderedPair = (companyId, partnerCompanyId) => companyId < partnerCompanyId
    ? { companyAId: companyId, companyBId: partnerCompanyId }
    : { companyAId: partnerCompanyId, companyBId: companyId };
const hasAcceptedConnection = async (companyId, partnerCompanyId) => {
    const pair = orderedPair(companyId, partnerCompanyId);
    const connection = await prisma_1.default.partnerConnection.findUnique({
        where: { companyAId_companyBId: pair },
    });
    return connection?.status === 'ACCEPTED';
};
exports.hasAcceptedConnection = hasAcceptedConnection;
const upsertAcceptedConnection = async (companyId, partnerCompanyId) => {
    const pair = orderedPair(companyId, partnerCompanyId);
    return prisma_1.default.partnerConnection.upsert({
        where: { companyAId_companyBId: pair },
        create: { ...pair, status: 'ACCEPTED' },
        update: { status: 'ACCEPTED' },
        include: { companyA: true, companyB: true },
    });
};
exports.upsertAcceptedConnection = upsertAcceptedConnection;
const getConnectedPartners = async (companyId) => {
    const connections = await prisma_1.default.partnerConnection.findMany({
        where: {
            status: 'ACCEPTED',
            OR: [{ companyAId: companyId }, { companyBId: companyId }],
        },
        include: { companyA: true, companyB: true },
        orderBy: { updatedAt: 'desc' },
    });
    return connections.map((connection) => {
        const partner = connection.companyAId === companyId ? connection.companyB : connection.companyA;
        return {
            id: connection.id,
            partnerCompanyId: partner.id,
            name: partner.name,
            email: partner.email,
            matriculeFiscal: partner.matriculeFiscal,
            phone: partner.phone,
            status: connection.status,
            createdAt: connection.createdAt,
        };
    });
};
exports.getConnectedPartners = getConnectedPartners;
