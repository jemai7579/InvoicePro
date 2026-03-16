import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../prisma';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret', {
    expiresIn: '30d',
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, matriculeFiscal, registreCommerce, address, phone, rib } = req.body;

    if (!email || !password || !name || !matriculeFiscal || !address) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
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
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential manquant.' });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Token Google invalide.' });
    }

    const { email, name, sub: googleId } = payload;

    // Check if company already exists
    let company = await prisma.company.findUnique({ where: { email } });

    if (!company) {
      // Auto-create account with Google info (password is empty — Google-only login)
      company = await prisma.company.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: '',         // no password for Google accounts
          matriculeFiscal: '',  // to be filled in Settings
          address: '',          // to be filled in Settings
        },
      });
    }

    res.status(200).json({
      id: company.id,
      name: company.name,
      email: company.email,
      token: generateToken(company.id),
      isNewAccount: !company.matriculeFiscal, // hint for frontend to redirect to settings
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion Google.' });
  }
};
