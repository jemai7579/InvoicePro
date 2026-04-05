"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGlobalNotification = exports.getAdminLogs = exports.updateSystemSetting = exports.getSystemSettings = exports.getSubscriptions = exports.getAllInvoices = exports.updateCompanyStatus = exports.getCompanies = exports.getGlobalStats = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// 1. Vue globale (Admin Overview)
const getGlobalStats = async (req, res) => {
    try {
        const totalCompanies = await prisma_1.default.company.count();
        const totalInvoices = await prisma_1.default.invoice.count();
        const totalClients = await prisma_1.default.client.count();
        const invoices = await prisma_1.default.invoice.findMany({
            select: {
                totalTTC: true,
                status: true,
                createdAt: true,
            },
        });
        const totalVolume = invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
        const pendingStatuses = ['DRAFT', 'SENT_TO_TTN', 'PENDING_VALIDATION'];
        const statsByStatus = {
            VALIDATED: invoices.filter(inv => inv.status === 'VALIDATED').length,
            PAID: invoices.filter(inv => inv.status === 'PAID').length,
            REJECTED: invoices.filter(inv => inv.status === 'REJECTED').length,
            PENDING: invoices.filter(inv => pendingStatuses.includes(inv.status)).length,
        };
        const recentLogs = await prisma_1.default.activityLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: {
                    select: { name: true }
                }
            }
        });
        res.json({
            success: true,
            data: {
                totalCompanies,
                totalInvoices,
                totalClients,
                totalVolume,
                statsByStatus,
                recentLogs
            }
        });
    }
    catch (error) {
        console.error('Error fetching global stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
};
exports.getGlobalStats = getGlobalStats;
// 2. Gestion des entreprises (Users)
const getCompanies = async (req, res) => {
    try {
        const companies = await prisma_1.default.company.findMany({
            include: {
                _count: {
                    select: {
                        invoices: true,
                        clients: true,
                    },
                },
                subscription: true,
            },
        });
        res.json({ success: true, data: companies });
    }
    catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ success: false, message: 'Error fetching companies' });
    }
};
exports.getCompanies = getCompanies;
const updateCompanyStatus = async (req, res) => {
    const { id } = req.params;
    const statusBody = req.body.status;
    const adminId = req.admin?.id;
    try {
        const company = await prisma_1.default.company.update({
            where: { id },
            data: {
                subscription: {
                    upsert: {
                        update: { status: statusBody === 'ACTIVE' ? 'ACTIVE' : 'CANCELLED' },
                        create: { status: statusBody === 'ACTIVE' ? 'ACTIVE' : 'CANCELLED' },
                    },
                },
            },
            include: { subscription: true }
        });
        if (adminId) {
            await prisma_1.default.activityLog.create({
                data: {
                    adminId,
                    action: 'UPDATE_COMPANY_STATUS',
                    details: `Statut de l'entreprise ${id} changé en ${statusBody}`,
                },
            });
        }
        res.json({ success: true, data: company });
    }
    catch (error) {
        console.error('Error updating company status:', error);
        res.status(500).json({ success: false, message: 'Error updating company' });
    }
};
exports.updateCompanyStatus = updateCompanyStatus;
// 3. Gestion globale des factures
const getAllInvoices = async (req, res) => {
    try {
        const invoices = await prisma_1.default.invoice.findMany({
            include: {
                company: {
                    select: { name: true, email: true },
                },
                client: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: invoices });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching invoices' });
    }
};
exports.getAllInvoices = getAllInvoices;
// 4. Gestion des abonnements
const getSubscriptions = async (req, res) => {
    try {
        const subscriptions = await prisma_1.default.subscription.findMany({
            include: {
                company: {
                    select: { name: true, email: true },
                },
            },
        });
        res.json({ success: true, data: subscriptions });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching subscriptions' });
    }
};
exports.getSubscriptions = getSubscriptions;
// 5. Paramètres système
const getSystemSettings = async (req, res) => {
    try {
        const settings = await prisma_1.default.systemSetting.findMany();
        res.json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching settings' });
    }
};
exports.getSystemSettings = getSystemSettings;
const updateSystemSetting = async (req, res) => {
    const { id } = req.params;
    const { value } = req.body;
    const adminId = req.admin?.id;
    try {
        const setting = await prisma_1.default.systemSetting.update({
            where: { id },
            data: { value },
        });
        if (adminId) {
            await prisma_1.default.activityLog.create({
                data: {
                    adminId,
                    action: 'UPDATE_SYSTEM_SETTING',
                    details: `Paramètre ${setting.key} mis à jour: ${value}`,
                },
            });
        }
        res.json({ success: true, data: setting });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error updating setting' });
    }
};
exports.updateSystemSetting = updateSystemSetting;
// 6. Logs d'activité
const getAdminLogs = async (req, res) => {
    try {
        const logs = await prisma_1.default.activityLog.findMany({
            include: {
                admin: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        res.json({ success: true, data: logs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching logs' });
    }
};
exports.getAdminLogs = getAdminLogs;
// 7. Notifications globales (In-app)
const sendGlobalNotification = async (req, res) => {
    const { title, message, type } = req.body;
    const adminId = req.admin?.id;
    try {
        const companies = await prisma_1.default.company.findMany({ select: { id: true } });
        const notifications = companies.map(c => ({
            companyId: c.id,
            title,
            message,
            type: type || 'INFO',
        }));
        await prisma_1.default.notification.createMany({
            data: notifications,
        });
        if (adminId) {
            await prisma_1.default.activityLog.create({
                data: {
                    adminId,
                    action: 'SEND_GLOBAL_NOTIFICATION',
                    details: `Notification envoyée à ${companies.length} entreprises: ${title}`,
                },
            });
        }
        res.json({ success: true, message: `Notification envoyée à ${companies.length} entreprises.` });
    }
    catch (error) {
        console.error('Error sending global notification:', error);
        res.status(500).json({ success: false, message: 'Error sending notification' });
    }
};
exports.sendGlobalNotification = sendGlobalNotification;
