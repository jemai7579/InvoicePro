import { Request, Response } from 'express';
import prisma from '../prisma';
import { InvoiceStatus } from '@prisma/client';

// 1. Vue globale (Admin Overview)
export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    const totalCompanies = await prisma.company.count();
    const totalInvoices = await prisma.invoice.count();
    const totalClients = await prisma.client.count();

    const invoices = await prisma.invoice.findMany({
      select: {
        totalTTC: true,
        status: true,
        createdAt: true,
      },
    });

    const totalVolume = invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
    const pendingStatuses: InvoiceStatus[] = ['DRAFT', 'SENT_TO_TTN', 'PENDING_VALIDATION'];

    const statsByStatus = {
      VALIDATED: invoices.filter(inv => inv.status === 'VALIDATED').length,
      PAID: invoices.filter(inv => inv.status === 'PAID').length,
      REJECTED: invoices.filter(inv => inv.status === 'REJECTED').length,
      PENDING: invoices.filter(inv => pendingStatuses.includes(inv.status)).length,
    };

    const recentLogs = await (prisma as any).activityLog.findMany({
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
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
};

// 2. Gestion des entreprises (Users)
export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await (prisma.company as any).findMany({
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
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, message: 'Error fetching companies' });
  }
};

export const updateCompanyStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const statusBody = req.body.status; 
  const adminId = (req as any).admin?.id;

  try {
    const company = await (prisma.company as any).update({
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
      await (prisma as any).activityLog.create({
        data: {
          adminId,
          action: 'UPDATE_COMPANY_STATUS',
          details: `Statut de l'entreprise ${id} changé en ${statusBody}`,
        },
      });
    }

    res.json({ success: true, data: company });
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({ success: false, message: 'Error updating company' });
  }
};

// 3. Gestion globale des factures
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching invoices' });
  }
};

// 4. Gestion des abonnements
export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await (prisma as any).subscription.findMany({
      include: {
        company: {
          select: { name: true, email: true },
        },
      },
    });
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions' });
  }
};

// 5. Paramètres système
export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = await (prisma as any).systemSetting.findMany();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
};

export const updateSystemSetting = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { value } = req.body;
  const adminId = (req as any).admin?.id;

  try {
    const setting = await (prisma as any).systemSetting.update({
      where: { id },
      data: { value },
    });

    if (adminId) {
      await (prisma as any).activityLog.create({
        data: {
          adminId,
          action: 'UPDATE_SYSTEM_SETTING',
          details: `Paramètre ${setting.key} mis à jour: ${value}`,
        },
      });
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating setting' });
  }
};

// 6. Logs d'activité
export const getAdminLogs = async (req: Request, res: Response) => {
  try {
    const logs = await (prisma as any).activityLog.findMany({
      include: {
        admin: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
};

// 7. Notifications globales (In-app)
export const sendGlobalNotification = async (req: Request, res: Response) => {
  const { title, message, type } = req.body;
  const adminId = (req as any).admin?.id;

  try {
    const companies = await prisma.company.findMany({ select: { id: true } });
    
    const notifications = companies.map(c => ({
      companyId: c.id,
      title,
      message,
      type: type || 'INFO',
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    if (adminId) {
      await (prisma as any).activityLog.create({
        data: {
          adminId,
          action: 'SEND_GLOBAL_NOTIFICATION',
          details: `Notification envoyée à ${companies.length} entreprises: ${title}`,
        },
      });
    }

    res.json({ success: true, message: `Notification envoyée à ${companies.length} entreprises.` });
  } catch (error) {
    console.error('Error sending global notification:', error);
    res.status(500).json({ success: false, message: 'Error sending notification' });
  }
};
