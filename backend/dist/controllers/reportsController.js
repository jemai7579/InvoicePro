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
        // 1. Get ALL Invoices for the company
        const allInvoices = await prisma_1.default.invoice.findMany({
            where: { companyId },
            include: {
                client: true
            }
        });
        // --- Graph 1: Monthly Revenue (Last 6 Months) ---
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const targetMonth = (0, date_fns_1.subMonths)(new Date(), i);
            const start = (0, date_fns_1.startOfMonth)(targetMonth);
            const end = (0, date_fns_1.endOfMonth)(targetMonth);
            const monthInvoices = allInvoices.filter(inv => inv.createdAt >= start && inv.createdAt <= end);
            const revenueHT = monthInvoices.reduce((acc, inv) => acc + inv.totalHT, 0);
            const revenueTTC = monthInvoices.reduce((acc, inv) => acc + inv.totalTTC, 0);
            monthlyRevenue.push({
                name: (0, date_fns_1.format)(targetMonth, 'MMM yyyy'),
                RevenueHT: revenueHT,
                RevenueTTC: revenueTTC
            });
        }
        // --- Graph 2: Invoices per Month (Count) ---
        const invoicesPerMonth = [];
        for (let i = 5; i >= 0; i--) {
            const targetMonth = (0, date_fns_1.subMonths)(new Date(), i);
            const start = (0, date_fns_1.startOfMonth)(targetMonth);
            const end = (0, date_fns_1.endOfMonth)(targetMonth);
            const count = allInvoices.filter(inv => inv.createdAt >= start && inv.createdAt <= end).length;
            invoicesPerMonth.push({
                name: (0, date_fns_1.format)(targetMonth, 'MMM yyyy'),
                Count: count
            });
        }
        // --- Graph 3: TVA Collected (Last 6 Months) ---
        const tvaCollected = monthlyRevenue.map(m => ({
            name: m.name,
            TVA: m.RevenueTTC - m.RevenueHT
        }));
        // --- Graph 4: Top Clients (By Total Revenue) ---
        const clientRevenueMap = {};
        allInvoices.forEach(inv => {
            const clientId = inv.clientId;
            if (!clientRevenueMap[clientId]) {
                clientRevenueMap[clientId] = {
                    name: inv.client.name,
                    revenue: 0
                };
            }
            clientRevenueMap[clientId].revenue += inv.totalTTC;
        });
        const topClients = Object.values(clientRevenueMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5) // Top 5
            .map(client => ({
            name: client.name,
            Revenue: client.revenue
        }));
        res.status(200).json({
            monthlyRevenue,
            invoicesPerMonth,
            tvaCollected,
            topClients
        });
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Server error generating reports' });
    }
};
exports.getDashboardReports = getDashboardReports;
