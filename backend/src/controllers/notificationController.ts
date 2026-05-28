import { Request, Response } from 'express';
import prisma from '../prisma';

const actionUrlForNotification = (notification: any) => {
  if (notification.actionUrl) return notification.actionUrl;
  const type = String(notification.type || '').toUpperCase();
  const message = `${notification.title || ''} ${notification.message || ''}`;
  const idMatch = message.match(/[0-9a-f]{8}-[0-9a-f-]{27,}/i);
  const entityId = notification.entityId || idMatch?.[0] || null;
  if (type.includes('PAYMENT')) return entityId ? `/invoices/${entityId}` : '/payments';
  if (type.includes('INVOICE') || type.includes('TTN') || type.includes('XML')) return entityId ? `/invoices/${entityId}` : '/invoices';
  if (type.includes('DEVIS') || type.includes('QUOTE')) return entityId ? `/devis/${entityId}` : '/devis';
  if (type.includes('PRODUCT')) return '/products';
  if (type.includes('CLIENT')) return '/clients';
  if (type.includes('SUPPORT')) return '/support';
  if (type.includes('COMPANY') || type.includes('SETTING') || type.includes('SUBSCRIPTION')) return '/settings';
  return null;
};

const serializeNotification = (notification: any) => ({
  ...notification,
  isRead: notification.read,
  actionUrl: actionUrlForNotification(notification),
  entityType: notification.entityType || null,
  entityId: notification.entityId || null,
});

/** GET /notifications — returns latest 50, newest first */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const notifications = await prisma.notification.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications.map(serializeNotification));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

/** GET /notifications/unread-count */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const count = await prisma.notification.count({
      where: { companyId, read: false },
    });
    res.json({ count });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

/** PATCH /notifications/:id/read */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, companyId },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

/** PATCH /notifications/read-all */
export const markAllRead = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    await prisma.notification.updateMany({
      where: { companyId, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
