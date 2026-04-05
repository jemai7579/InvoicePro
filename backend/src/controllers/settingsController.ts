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

    // Fetch the actual current values to compare
    const currentSettings = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!currentSettings) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Build update data — only include fields that were actually sent
    const updateData: any = {};
    const changes: any[] = [];

    const fieldsToTrack = [
      { key: 'name', label: 'Raison sociale' },
      { key: 'matriculeFiscal', label: 'Matricule Fiscal' },
      { key: 'registreCommerce', label: 'Registre de Commerce' },
      { key: 'address', label: 'Adresse' },
      { key: 'city', label: 'Ville' },
      { key: 'zipCode', label: 'Code Postal' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'rib', label: 'RIB' }
    ];

    fieldsToTrack.forEach(field => {
      const newValue = req.body[field.key];
      const oldValue = (currentSettings as any)[field.key];

      if (newValue !== undefined && newValue !== oldValue) {
        updateData[field.key] = newValue;
        changes.push({
          field: field.label,
          oldValue: String(oldValue || ''),
          newValue: String(newValue || '')
        });
      }
    });

    // Password change logic
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Le mot de passe actuel est requis pour changer votre mot de passe.' });
      }

      // Compare
      const isMatch = await bcrypt.compare(currentPassword, currentSettings.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Le mot de passe actuel est incorrect.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      }

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
      
      changes.push({
        field: 'Mot de passe',
        oldValue: '********',
        newValue: 'Modifié'
      });
    }

    // Logo change logic (if logo specifically sent in body, though it usually goes through uploadLogo)
    if (logo !== undefined && logo !== currentSettings.logo) {
      updateData.logo = logo;
      changes.push({
        field: 'Logo',
        oldValue: currentSettings.logo ? 'Ancien logo' : 'Aucun',
        newValue: 'Nouveau logo'
      });
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

    // Log all changes if any
    if (changes.length > 0) {
      await Promise.all(changes.map(change => 
        prisma.settingsHistory.create({
          data: {
            companyId,
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue
          }
        })
      ));
    }

    res.status(200).json(updatedCompany);
  } catch (error) {
    console.error('UpdateSettings Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSettingsHistory = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).company.id;
    const history = await prisma.settingsHistory.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(history);
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
