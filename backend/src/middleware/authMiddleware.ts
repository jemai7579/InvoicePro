import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { getJwtSecret } from '../utils/jwtSecret';

const getAccessDenialMessage = (company: any) => {
  const profileStatus = String(company.adminProfile?.status || '').toLowerCase();
  const subscriptionStatus = String(company.subscription?.status || '').toUpperCase();
  if (profileStatus === 'deleted' || ['DELETED', 'SOFT_DELETED'].includes(subscriptionStatus)) {
    return 'Ce compte a ete supprime. Contactez le support.';
  }
  if (['blocked', 'suspended'].includes(profileStatus) || ['BLOCKED', 'SUSPENDED', 'CANCELLED'].includes(subscriptionStatus)) {
    return 'Votre compte est bloque. Contactez l’administration.';
  }
  if (profileStatus === 'pending' || ['PENDING_APPROVAL', 'PENDING_PAYMENT', 'PENDING'].includes(subscriptionStatus)) {
    return "Votre compte est en attente de validation par l'administration.";
  }
  if (company.subscription?.endDate && new Date(company.subscription.endDate) < new Date()) {
    return 'Votre acces a expire. Contactez l’administration pour renouveler votre abonnement.';
  }
  return null;
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded: any = jwt.verify(token, getJwtSecret());

      const company = await prisma.company.findUnique({
        where: { id: decoded.id },
        include: { subscription: true, adminProfile: true },
      });

      if (!company) {
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      const accessDeniedMessage = getAccessDenialMessage(company);
      if (accessDeniedMessage) {
        return res.status(403).json({ message: accessDeniedMessage, code: 'ACCOUNT_ACCESS_DENIED' });
      }

      (req as any).company = company;

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
