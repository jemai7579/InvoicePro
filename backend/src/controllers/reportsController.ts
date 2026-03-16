import { Request, Response } from 'express';
import prisma from '../prisma';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export const getDashboardReports = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      // Ensure we query till the end of the endDate day
      const endD = new Date(endDate as string);
      endD.setHours(23, 59, 59, 999);
      
      dateFilter = {
        createdAt: {
          gte: new Date(startDate as string),
          lte: endD
        }
      };
    }

    const allInvoices = await prisma.invoice.findMany({
      where: { companyId, ...dateFilter },
      include: { client: true },
      orderBy: { createdAt: 'asc' }
    });

    const monthlyDataMap: Record<string, any> = {};

    allInvoices.forEach(inv => {
      const monthKey = format(inv.createdAt, 'MMM yyyy');
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { name: monthKey, RevenueHT: 0, RevenueTTC: 0, Count: 0, TVA: 0 };
      }
      monthlyDataMap[monthKey].RevenueHT += inv.totalHT;
      monthlyDataMap[monthKey].RevenueTTC += inv.totalTTC;
      monthlyDataMap[monthKey].TVA += (inv.totalTTC - inv.totalHT);
      monthlyDataMap[monthKey].Count += 1;
    });

    const monthlyRevenue = Object.values(monthlyDataMap);
    const invoicesPerMonth = monthlyRevenue.map((m: any) => ({ name: m.name, Count: m.Count }));
    const tvaCollected = monthlyRevenue.map((m: any) => ({ name: m.name, TVA: m.TVA }));
    
    // Top Clients
    const clientRevenueMap: Record<string, {name: string, revenue: number}> = {};
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

    // Total KPIs for the selected period
    const totalKPIs = {
       revenueHT: allInvoices.reduce((acc, inv) => acc + inv.totalHT, 0),
       revenueTTC: allInvoices.reduce((acc, inv) => acc + inv.totalTTC, 0),
       tva: allInvoices.reduce((acc, inv) => acc + (inv.totalTTC - inv.totalHT), 0),
       invoiceCount: allInvoices.length
    };

    res.status(200).json({
      monthlyRevenue,
      invoicesPerMonth,
      tvaCollected,
      topClients,
      totalKPIs
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error generating reports' });
  }
};
