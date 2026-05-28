import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { getJwtExpiresIn, getJwtSecret } from '../utils/jwtSecret';
import { getRequestAuditMeta, logActivity } from '../services/auditTrailService';
import { clearFailedLogins, getFailedLoginBlock, recordFailedLogin } from '../services/loginProtectionService';

const generateToken = (id: string) => {
  // TODO: migrate browser authentication to secure httpOnly cookies with CSRF protection.
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: getJwtExpiresIn() as jwt.SignOptions['expiresIn'] });
};

const ALLOWED_REGISTRATION_PLANS = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
const isDevelopment = process.env.NODE_ENV !== 'production';

const resolveAccessDenial = (company: any) => {
  const profileStatus = String(company.adminProfile?.status || '').toLowerCase();
  const subscriptionStatus = String(company.subscription?.status || '').toUpperCase();
  if (profileStatus === 'deleted' || subscriptionStatus === 'SOFT_DELETED' || subscriptionStatus === 'DELETED') {
    return 'Ce compte a ete supprime. Contactez le support.';
  }
  if (profileStatus === 'blocked' || profileStatus === 'suspended' || ['BLOCKED', 'SUSPENDED', 'CANCELLED'].includes(subscriptionStatus)) {
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

const normalizeRegistrationPlan = (plan?: string) => {
  const value = String(plan || '').trim().toUpperCase();
  if (!value) return 'STARTER';
  if (value === 'PRO') return 'PROFESSIONAL';
  if (value === 'MAX') return 'ENTERPRISE';
  if (ALLOWED_REGISTRATION_PLANS.includes(value)) return value;
  return null;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, firstName, lastName, matriculeFiscal, registreCommerce, address, phone, rib, plan } = req.body;

    const requiredFields = { email, password, name, firstName, lastName, matriculeFiscal, address, phone };
    const missingField = Object.entries(requiredFields).find(([, value]) => !String(value || '').trim())?.[0];
    if (missingField) {
      return res.status(400).json({ message: `Champ obligatoire manquant: ${missingField}` });
    }

    const selectedPlan = normalizeRegistrationPlan(plan);
    if (!selectedPlan) {
      return res.status(400).json({ message: 'Formule d’abonnement invalide.', error: 'Invalid subscription plan' });
    }

    // Validation Matricule Fiscal Tunisien (ex: 1234567/X/A/P/000)
    const mfRegex = /^\d{7,8}\/[A-Z]\/[A-Z]\/[A-Z]\/\d{3}$/;
    if (!mfRegex.test(matriculeFiscal)) {
      return res.status(400).json({ message: 'Format Matricule Fiscal invalide. Exemple: 1234567/X/A/M/000' });
    }

    // Validation Téléphone Tunisien (8 chiffres ou avec +216)
    const phoneRegex = /^(\+216)?\s?\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Format numéro de téléphone invalide.' });
    }

    const companyExists = await prisma.company.findUnique({
      where: { email },
    });

    if (companyExists) {
      return res.status(400).json({ message: 'Un compte avec cet email existe déjà.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const company = await prisma.company.create({
      data: {
        email,
        password: hashedPassword,
        name,
        firstName,
        lastName,
        matriculeFiscal,
        registreCommerce,
        address,
        phone,
        rib,
        subscription: {
          create: {
            plan: selectedPlan,
            status: 'PENDING_APPROVAL'
          }
        },
        adminProfile: {
          create: {
            status: 'pending',
            dossierStatus: 'pending_review',
          },
        },
      },
    });

    if (company) {
      // Fetch company with subscription for consistent response
      const companyWithSub = await prisma.company.findUnique({
        where: { id: company.id },
        include: { subscription: true }
      });

      res.status(201).json({
      id: company.id,
      name: company.name,
      email: company.email,
      subscription: companyWithSub?.subscription,
      accountStatus: 'PENDING_APPROVAL',
      message: "Votre compte est en attente de validation par l'administration.",
      token: generateToken(company.id),
    });
    } else {
      res.status(400).json({ message: 'Invalid company data' });
    }
  } catch (error: any) {
    console.error('REGISTER ERROR:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ message: 'Un compte avec cet email existe déjà.' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({
        message: 'Une valeur unique existe déjà.',
        ...(isDevelopment ? { error: error.message, target: error.meta?.target } : {})
      });
    }
    if (['P2021', 'P2022'].includes(error.code)) {
      return res.status(500).json({
        message: 'Database migration is not applied.',
        ...(isDevelopment ? { error: error.message, code: error.code } : {})
      });
    }
    res.status(500).json({
      message: 'Server error',
      ...(isDevelopment ? { error: error.message, code: error.code } : {})
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const sourceIp = req.ip || req.socket.remoteAddress || 'unknown';
    const retryAfter = await getFailedLoginBlock('company', String(email || ''), sourceIp);

    if (retryAfter) {
      return res.status(429).json({
        message: 'Too many failed login attempts. Please wait a few minutes before trying again.',
        code: 'AUTH_TOO_MANY_FAILED_ATTEMPTS',
        retryAfter,
      });
    }

    const company = await prisma.company.findUnique({
      where: { email },
      include: { subscription: true, adminProfile: true },
    });

    if (company && (await bcrypt.compare(password, company.password))) {
      const denial = resolveAccessDenial(company);
      if (denial) {
        await recordFailedLogin('company', String(email || ''), sourceIp);
        return res.status(403).json({ message: denial, code: 'ACCOUNT_ACCESS_DENIED' });
      }
      await clearFailedLogins('company', String(email || ''), sourceIp);
      logActivity({
        companyId: company.id,
        actorId: company.id,
        actorType: 'COMPANY',
        actionType: 'LOGIN',
        objectType: 'AUTH',
        objectId: company.id,
        message: 'Connexion utilisateur réussie.',
        metadata: { email: company.email },
        ...getRequestAuditMeta(req),
      }).catch((auditError) => console.error('LOGIN AUDIT ERROR:', auditError));

      res.json({
        id: company.id,
        name: company.name,
        email: company.email,
        token: generateToken(company.id),
      });
    } else {
      const failedRetryAfter = await recordFailedLogin('company', String(email || ''), sourceIp);
      if (failedRetryAfter) {
        return res.status(429).json({
          message: 'Too many failed login attempts. Please wait a few minutes before trying again.',
          code: 'AUTH_TOO_MANY_FAILED_ATTEMPTS',
          retryAfter: failedRetryAfter,
        });
      }
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: true,
        adminProfile: true,
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Compte introuvable' });
    }

    // Fallback logic for missing subscription or old names
    let subscription = company.subscription;
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          companyId: companyId,
          plan: 'STARTER',
          status: 'ACTIVE'
        }
      });
    } else if (subscription.plan === 'FREE' || subscription.plan === 'PRO') {
      // Migrate old plan names on the fly
      const newPlan = subscription.plan === 'FREE' ? 'STARTER' : 'PROFESSIONAL';
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { plan: newPlan }
      });
    }

    // Dynamic month count
    const startOfMonth = new Date();
    startOfMonth.setHours(0, 0, 0, 0);
    startOfMonth.setDate(1);

    const usedInvoicesThisMonth = await prisma.invoice.count({
      where: {
        companyId: companyId,
        createdAt: { gte: startOfMonth }
      }
    });

    const plan = subscription.plan;
    const monthlyInvoiceLimit = plan === 'STARTER' ? 7 : Infinity;
    const remainingInvoices = plan === 'STARTER' ? Math.max(0, 7 - usedInvoicesThisMonth) : 999999; // Using high number for infinity as JSON literal

    res.status(200).json({
      ...company,
      password: undefined, // ensure password is not sent
      accountStatus: company.adminProfile?.status || subscription.status,
      accessMessage: subscription.status === 'GRACE_ACCESS' && subscription.endDate
        ? `Votre acces temporaire expire le ${new Date(subscription.endDate).toLocaleDateString('fr-FR')}.`
        : null,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        monthlyInvoiceLimit,
        usedInvoicesThisMonth,
        remainingInvoices,
        aiEnabled: plan !== 'STARTER',
        reportsEnabled: plan !== 'STARTER'
      }
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
