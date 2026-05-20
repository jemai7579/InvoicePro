"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivitiesByObject = exports.getActivitiesByCompany = exports.getRequestAuditMeta = exports.logActivity = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const logActivity = async (data) => {
    return prisma_1.default.userActivityLog.create({
        data: {
            companyId: data.companyId,
            actorId: data.actorId || null,
            actorType: data.actorType,
            actionType: data.actionType,
            objectType: data.objectType,
            objectId: data.objectId,
            message: data.message,
            oldValue: data.oldValue ?? undefined,
            newValue: data.newValue ?? undefined,
            metadata: data.metadata ?? undefined,
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null,
            errorMessage: data.errorMessage || null,
        },
    });
};
exports.logActivity = logActivity;
const getRequestAuditMeta = (req) => ({
    ipAddress: req.ip || req.headers?.['x-forwarded-for'] || null,
    userAgent: req.headers?.['user-agent'] || null,
});
exports.getRequestAuditMeta = getRequestAuditMeta;
const getActivitiesByCompany = async (companyId, filters = {}) => {
    return prisma_1.default.userActivityLog.findMany({
        where: {
            companyId,
            ...(filters.objectType ? { objectType: filters.objectType } : {}),
            ...(filters.actionType ? { actionType: filters.actionType } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: filters.take || 200,
    });
};
exports.getActivitiesByCompany = getActivitiesByCompany;
const getActivitiesByObject = async (companyId, objectType, objectId) => {
    return prisma_1.default.userActivityLog.findMany({
        where: { companyId, objectType, objectId },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getActivitiesByObject = getActivitiesByObject;
