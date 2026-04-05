"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const prisma_1 = __importDefault(require("../prisma"));
/** GET /notifications — returns latest 50, newest first */
const getNotifications = async (req, res) => {
    try {
        const companyId = req.company.id;
        const notifications = await prisma_1.default.notification.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json(notifications);
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getNotifications = getNotifications;
/** GET /notifications/unread-count */
const getUnreadCount = async (req, res) => {
    try {
        const companyId = req.company.id;
        const count = await prisma_1.default.notification.count({
            where: { companyId, read: false },
        });
        res.json({ count });
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUnreadCount = getUnreadCount;
/** PATCH /notifications/:id/read */
const markAsRead = async (req, res) => {
    try {
        const companyId = req.company.id;
        await prisma_1.default.notification.updateMany({
            where: { id: req.params.id, companyId },
            data: { read: true },
        });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markAsRead = markAsRead;
/** PATCH /notifications/read-all */
const markAllRead = async (req, res) => {
    try {
        const companyId = req.company.id;
        await prisma_1.default.notification.updateMany({
            where: { companyId, read: false },
            data: { read: true },
        });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markAllRead = markAllRead;
