import { Request, Response } from 'express';
import prisma from '../prisma';

/** GET /notifications — returns latest 50, newest first */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const notifications = await prisma.notification.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
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
