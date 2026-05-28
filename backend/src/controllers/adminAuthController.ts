import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { getJwtExpiresIn, getJwtSecret } from '../utils/jwtSecret';
import { clearFailedLogins, getFailedLoginBlock, recordFailedLogin } from '../services/loginProtectionService';

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const sourceIp = req.ip || req.socket.remoteAddress || 'unknown';
    const retryAfter = await getFailedLoginBlock('admin', String(email || ''), sourceIp);
    if (retryAfter) {
      return res.status(429).json({
        message: 'Too many failed login attempts. Please wait a few minutes before trying again.',
        code: 'AUTH_TOO_MANY_FAILED_ATTEMPTS',
        retryAfter,
      });
    }

    const admin = await (prisma as any).admin.findUnique({
      where: { email },
    });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      await clearFailedLogins('admin', String(email || ''), sourceIp);
      const token = jwt.sign(
        { id: admin.id, role: 'admin' },
        getJwtSecret(),
        { expiresIn: getJwtExpiresIn() as jwt.SignOptions['expiresIn'] }
      );

      // Log activity
      await (prisma as any).activityLog.create({
        data: {
          adminId: admin.id,
          action: 'LOGIN',
          details: `Connexion réussie de ${admin.email}`,
        },
      });

      res.json({
        success: true,
        data: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          token,
        }
      });
    } else {
      // Log failed attempt if admin exists
      if (admin) {
        await (prisma as any).activityLog.create({
          data: {
            adminId: admin.id,
            action: 'LOGIN_FAILED',
            details: `Échec de connexion pour ${admin.email}`,
          },
        });
      }
      const failedRetryAfter = await recordFailedLogin('admin', String(email || ''), sourceIp);
      if (failedRetryAfter) {
        return res.status(429).json({
          message: 'Too many failed login attempts. Please wait a few minutes before trying again.',
          code: 'AUTH_TOO_MANY_FAILED_ATTEMPTS',
          retryAfter: failedRetryAfter,
        });
      }
      res.status(401).json({ success: false, message: 'Identifiants administrateur invalides' });
    }
  } catch (error) {
    console.error('Error logging in admin:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAdminProfile = async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  if (admin) {
    res.json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      }
    });
  } else {
    res.status(404).json({ success: false, message: 'Admin not found' });
  }
};
