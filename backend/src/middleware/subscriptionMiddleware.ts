import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

/**
 * Middleware to check if the company's plan is in the list of allowed plans
 */
export const checkPlan = (allowedPlans: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).company.id;
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { subscription: true }
      });

      if (!company || !company.subscription) {
        return res.status(403).json({ 
          message: "Abonnement requis. Veuillez passer au forfait Professional pour accéder à cette fonctionnalité." 
        });
      }

      if (!allowedPlans.includes(company.subscription.plan)) {
        return res.status(403).json({ 
          message: `Cette fonctionnalité est réservée aux plans : ${allowedPlans.join(', ')}.` 
        });
      }

      next();
    } catch (error) {
      console.error('Error in checkPlan middleware:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'abonnement' });
    }
  };
};

/**
 * Middleware to check if the company has reached its monthly invoice limit
 */
export const checkInvoiceQuota = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).company.id;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: true }
    });

    if (!company) {
      return res.status(404).json({ message: 'Compte introuvable' });
    }

    // Default to STARTER if no subscription exists
    const plan = company.subscription?.plan || 'STARTER';

    if (plan === 'STARTER') {
      const startOfMonth = new Date();
      startOfMonth.setHours(0, 0, 0, 0);
      startOfMonth.setDate(1);

      const usedInvoices = await prisma.invoice.count({
        where: {
          companyId: companyId,
          createdAt: { gte: startOfMonth }
        }
      });

      if (usedInvoices >= 7) {
        return res.status(403).json({ 
          message: "Votre quota mensuel Starter (7 factures) est épuisé. Attendez le mois prochain ou passez à Professional pour une facturation illimitée." 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in checkInvoiceQuota middleware:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification du quota' });
  }
};
