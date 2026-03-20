import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

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
    const { name, matriculeFiscal, registreCommerce, address, city, zipCode, country, phone, rib, logo, newPassword, currentPassword } = req.body;

    const companyId = (req as any).company.id;

    // Build update data — only include fields that were actually sent
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (matriculeFiscal !== undefined) updateData.matriculeFiscal = matriculeFiscal;
    // ... other fields ...
    if (registreCommerce !== undefined) updateData.registreCommerce = registreCommerce;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (country !== undefined) updateData.country = country;
    if (phone !== undefined) updateData.phone = phone;
    if (rib !== undefined) updateData.rib = rib;
    if (logo !== undefined) updateData.logo = logo;

    // Password change logic
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Le mot de passe actuel est requis pour changer votre mot de passe.' });
      }

      // Fetch the actual current password hash
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { password: true }
      });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Compare
      const isMatch = await bcrypt.compare(currentPassword, company.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Le mot de passe actuel est incorrect.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      }

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
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
    const uploadDir = path.resolve('uploads/certificates');
    
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
    const uploadDir = path.resolve('uploads/logos');
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
