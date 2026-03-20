import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret', {
    expiresIn: '30d',
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, firstName, lastName, matriculeFiscal, registreCommerce, address, phone, rib } = req.body;

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
        rib
      },
    });

    if (company) {
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
    const company = await prisma.company.findUnique({
      where: { id: (req as any).company.id },
      select: {
        id: true,
        name: true,
        email: true,
        matriculeFiscal: true,
        registreCommerce: true,
        address: true,
        phone: true,
        rib: true,
        createdAt: true,
      }
    });

    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
