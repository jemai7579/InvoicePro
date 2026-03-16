import { Request, Response } from 'express';
import prisma from '../prisma';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: (req as any).company.id },
      select: {
        id: true,
        email: true,
        name: true,
        matriculeFiscal: true,
        registreCommerce: true,
        address: true,
        city: true,
        zipCode: true,
        country: true,
        phone: true,
        rib: true,
        logo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { name, matriculeFiscal, registreCommerce, address, city, zipCode, country, phone, rib, logo } = req.body;

    const updatedCompany = await prisma.company.update({
      where: { id: (req as any).company.id },
      data: {
        name,
        matriculeFiscal,
        registreCommerce,
        address,
        city,
        zipCode,
        country,
        phone,
        rib,
        logo
      },
      select: {
        id: true,
        email: true,
        name: true,
        matriculeFiscal: true,
        registreCommerce: true,
        address: true,
        city: true,
        zipCode: true,
        country: true,
        phone: true,
        rib: true,
        logo: true
      }
    });

    res.status(200).json(updatedCompany);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import fs from 'fs-extra';
import path from 'path';

export const uploadCertificate = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Certificate file (.p12) is required' });
    }

    if (!password) {
      // Remove uploaded file if password not provided
      await fs.remove(file.path);
      return res.status(400).json({ message: 'Certificate password is required' });
    }

    // Move file to a permanent secure location (e.g., /uploads/certificates)
    const ext = path.extname(file.originalname);
    if (ext.toLowerCase() !== '.p12' && ext.toLowerCase() !== '.pfx') {
       await fs.remove(file.path);
       return res.status(400).json({ message: 'Only .p12 or .pfx files are allowed' });
    }

    const companyId = (req as any).company.id;
    const uploadDir = path.join(__dirname, '../../uploads/certificates');
    
    await fs.ensureDir(uploadDir);
    
    const newFileName = `cert_${companyId}_${Date.now()}${ext}`;
    const newPath = path.join(uploadDir, newFileName);

    await fs.move(file.path, newPath, { overwrite: true });

    // Update Company Record
    await prisma.company.update({
      where: { id: companyId },
      data: {
        certificatePath: newPath,
        certificatePassword: password // In a real prod app, encrypt this or store safely
      }
    });

    res.status(200).json({ message: 'Certificate uploaded successfully' });
  } catch (error) {
    console.error('Upload Error:', error);
    if (req.file) {
       await fs.remove(req.file.path).catch(console.error);
    }
    res.status(500).json({ message: 'Server error during certificate upload' });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Logo image is required' });
    }

    const companyId = (req as any).company.id;
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    await fs.ensureDir(uploadDir);

    const ext = path.extname(file.originalname);
    const newFileName = `logo_${companyId}_${Date.now()}${ext}`;
    const newPath = path.join(uploadDir, newFileName);

    await fs.move(file.path, newPath, { overwrite: true });

    const logoUrl = `/uploads/logos/${newFileName}`;

    await prisma.company.update({
      where: { id: companyId },
      data: { logo: logoUrl }
    });

    res.status(200).json({ message: 'Logo uploaded successfully', logo: logoUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    if (req.file) {
       await fs.remove(req.file.path).catch(console.error);
    }
    res.status(500).json({ message: 'Server error during logo upload' });
  }
};
