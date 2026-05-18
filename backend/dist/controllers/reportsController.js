"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardReports = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const date_fns_1 = require("date-fns");
const getDashboardReports = async (req, res) => {
    try {
        const companyId = req.company.id;
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        if (startDate && endDate) {
            // Ensure we query till the end of the endDate day
            const endD = new Date(endDate);
            endD.setHours(23, 59, 59, 999);
            dateFilter = {
                createdAt: {
                    gte: new Date(startDate),
                    lte: endD
                }
            };
        }
        const allInvoices = await prisma_1.default.invoice.findMany({
            where: { companyId, ...dateFilter },
            include: { client: true },
            orderBy: { createdAt: 'asc' }
        });
        const monthlyDataMap = {};
        allInvoices.forEach(inv => {
            const monthKey = (0, date_fns_1.format)(inv.createdAt, 'MMM yyyy');
            if (!monthlyDataMap[monthKey]) {
                monthlyDataMap[monthKey] = { name: monthKey, RevenueHT: 0, RevenueTTC: 0, Count: 0, TVA: 0 };
            }
            monthlyDataMap[monthKey].RevenueHT += inv.totalHT;
            monthlyDataMap[monthKey].RevenueTTC += inv.totalTTC;
            monthlyDataMap[monthKey].TVA += (inv.totalTTC - inv.totalHT);
            monthlyDataMap[monthKey].Count += 1;
        });
        const monthlyRevenue = Object.values(monthlyDataMap);
        const invoicesPerMonth = monthlyRevenue.map((m) => ({ name: m.name, Count: m.Count }));
        const tvaCollected = monthlyRevenue.map((m) => ({ name: m.name, TVA: m.TVA }));
        // Top Clients
        const clientRevenueMap = {};
        allInvoices.forEach(inv => {
            const clientId = inv.clientId;
            if (!clientRevenueMap[clientId]) {
                clientRevenueMap[clientId] = { name: inv.client.name, revenue: 0 };
            }
            clientRevenueMap[clientId].revenue += inv.totalTTC;
        });
        const topClients = Object.values(clientRevenueMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map(client => ({
            name: client.name,
            Revenue: client.revenue
        }));
        const statusBreakdownMap = {};
        allInvoices.forEach((invoice) => {
            statusBreakdownMap[invoice.status] = (statusBreakdownMap[invoice.status] || 0) + 1;
        });
        const statusBreakdown = Object.entries(statusBreakdownMap).map(([status, count]) => ({
            name: status,
            value: count,
        }));
        const paidInvoices = allInvoices.filter((invoice) => ['VALIDATED', 'PAID'].includes(invoice.status));
        const pendingInvoices = allInvoices.filter((invoice) => ['DRAFT', 'PENDING_VALIDATION', 'SENT_TO_TTN'].includes(invoice.status));
        const averageInvoiceValue = allInvoices.length
            ? allInvoices.reduce((sum, invoice) => sum + invoice.netToPay, 0) / allInvoices.length
            : 0;
        const revenueByClient = Object.values(clientRevenueMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8)
            .map((client) => ({
            name: client.name,
            revenue: client.revenue,
        }));
        const recentActivity = allInvoices
            .slice(-6)
            .reverse()
            .map((invoice) => ({
            id: invoice.id,
            client: invoice.client?.name || 'Client',
            status: invoice.status,
            amount: invoice.netToPay,
            createdAt: invoice.createdAt,
        }));
        const sortedMonths = [...monthlyRevenue];
        const currentMonthRevenue = sortedMonths[sortedMonths.length - 1]?.RevenueTTC || 0;
        const previousMonthRevenue = sortedMonths[sortedMonths.length - 2]?.RevenueTTC || 0;
        const monthlyComparison = previousMonthRevenue
            ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
            : 0;
        // Total KPIs for the selected period
        const totalKPIs = {
            revenueHT: allInvoices.reduce((acc, inv) => acc + inv.totalHT, 0),
            revenueTTC: allInvoices.reduce((acc, inv) => acc + inv.totalTTC, 0),
            tva: allInvoices.reduce((acc, inv) => acc + (inv.totalTTC - inv.totalHT), 0),
            invoiceCount: allInvoices.length,
            paidCount: paidInvoices.length,
            pendingCount: pendingInvoices.length,
            averageInvoiceValue,
            monthlyComparison
        };
        res.status(200).json({
            monthlyRevenue,
            invoicesPerMonth,
            tvaCollected,
            topClients,
            totalKPIs,
            statusBreakdown,
            revenueByClient,
            recentActivity
        });
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error generating reports' });
    }
};
exports.getDashboardReports = getDashboardReports;
