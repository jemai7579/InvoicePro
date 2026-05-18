import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { getJwtSecret } from '../utils/jwtSecret';

const generateToken = (id: string) => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '30d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, firstName, lastName, matriculeFiscal, registreCommerce, address, phone, rib, plan } = req.body;

    if (!email || !password || !name || !firstName || !lastName || !matriculeFiscal || !address || !phone) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires (incluant Nom/Prénom et Téléphone).' });
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
      return res.status(400).json({ message: 'An account with this email already exists.' });
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
            plan: (['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(plan?.toUpperCase()) ? plan.toUpperCase() : 'STARTER'),
            status: 'ACTIVE'
          }
        }
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
        token: generateToken(company.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid company data' });
    }
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const company = await prisma.company.findUnique({
      where: { email },
    });

    if (company && (await bcrypt.compare(password, company.password))) {
      res.json({
        id: company.id,
        name: company.name,
        email: company.email,
        token: generateToken(company.id),
      });
    } else {
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
