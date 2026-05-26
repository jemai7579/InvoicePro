import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { getTTNMode } from '../services/ttnProvider';
import { logActivity, getRequestAuditMeta } from '../services/auditTrailService';
import { getEInvoiceReadiness } from '../services/einvoiceConfig';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const raw = await prisma.company.findUnique({
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
        eHouwiyaStatus: true,
        eHouwiyaIdentifier: true,
        eHouwiyaVerifiedAt: true,
        certificatePath: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const lastSignedInvoice = await prisma.invoice.findFirst({
      where: {
        companyId: (req as any).company.id,
        ttnStatus: {
          in: ['SIGNED', 'TTN_ACCEPTED', 'FINALIZED'],
        },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        updatedAt: true,
        ttnStatus: true,
      },
    });

    const lastSubmission = await prisma.invoice.findFirst({
      where: {
        companyId: (req as any).company.id,
        ttnStatus: {
          in: ['SUBMITTED_TO_TTN', 'TTN_PROCESSING', 'TTN_ACCEPTED', 'FINALIZED', 'TTN_REJECTED'],
        },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        updatedAt: true,
        ttnStatus: true,
      },
    });

    const readiness = getEInvoiceReadiness(raw);
    const ttnMode = readiness.mode;

    const company = raw
      ? {
          ...raw,
          hasCertificate: !!raw.certificatePath,
          certificatePath: undefined,
          compliance: {
            signatureStatus: raw.certificatePath ? 'configured' : 'not_configured',
            certificateProvider: process.env.SIGNATURE_PROVIDER_NAME || 'TunTrust / ANCE',
            certificateType: process.env.SIGNATURE_CERT_TYPE || 'USB token',
            companyFiscalIdentifier: raw.matriculeFiscal,
            lastSignatureTestDate: lastSignedInvoice?.updatedAt || null,
            ttnMode,
            ...readiness,
            ttnConnectionStatus: readiness.ttnConfigured ? 'configured' : ttnMode === 'mock' ? 'test' : 'not_configured',
            teifAvailable: true,
            lastSubmission,
          },
        }
      : null;

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEInvoiceStatus = async (req: Request, res: Response) => {
  try {
    res.status(200).json(getEInvoiceReadiness((req as any).company));
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to read e-invoice configuration.' });
  }
};

const E_HOUWIYA_STATUSES = ['NOT_STARTED', 'HAS_IDENTIFIER', 'NEED_HELP', 'NOT_SURE'];

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { name, matriculeFiscal, registreCommerce, address, city, zipCode, country, phone, rib, logo, newPassword, currentPassword, eHouwiyaStatus, eHouwiyaIdentifier } = req.body;
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

    if (eHouwiyaStatus !== undefined) {
      if (!E_HOUWIYA_STATUSES.includes(eHouwiyaStatus)) {
        return res.status(400).json({ message: 'Invalid E-Houwiya status.' });
      }
      if (eHouwiyaStatus !== (currentSettings as any).eHouwiyaStatus) {
        updateData.eHouwiyaStatus = eHouwiyaStatus;
        updateData.eHouwiyaVerifiedAt = eHouwiyaStatus === 'HAS_IDENTIFIER' ? new Date() : null;
        changes.push({
          field: 'E-Houwiya / Mobile ID',
          oldValue: String((currentSettings as any).eHouwiyaStatus || 'NOT_STARTED'),
          newValue: eHouwiyaStatus
        });
      }
    }

    if (eHouwiyaIdentifier !== undefined && eHouwiyaIdentifier !== (currentSettings as any).eHouwiyaIdentifier) {
      updateData.eHouwiyaIdentifier = eHouwiyaIdentifier || null;
      changes.push({
        field: 'Identifiant E-Houwiya / Mobile ID',
        oldValue: (currentSettings as any).eHouwiyaIdentifier ? 'Renseigné' : 'Non renseigné',
        newValue: eHouwiyaIdentifier ? 'Renseigné' : 'Non renseigné'
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
        logo: true,
        eHouwiyaStatus: true,
        eHouwiyaIdentifier: true,
        eHouwiyaVerifiedAt: true
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
      await logActivity({
        companyId,
        actorId: companyId,
        actorType: 'USER',
        actionType: 'PROFILE_UPDATED',
        objectType: 'SETTINGS',
        objectId: companyId,
        message: 'Parametres entreprise mis a jour.',
        metadata: { fields: changes.map((change) => change.field) },
        ...getRequestAuditMeta(req),
      });
    }

    if (changes.some((change) => change.field.includes('E-Houwiya'))) {
      await logActivity({
        companyId,
        actorId: companyId,
        actorType: 'USER',
        actionType: 'PROFILE_UPDATED',
        objectType: 'SETTINGS',
        objectId: companyId,
        message: 'Statut E-Houwiya mis à jour',
        metadata: {
          eHouwiyaStatus: updateData.eHouwiyaStatus ?? (currentSettings as any).eHouwiyaStatus,
          hasIdentifier: Boolean(updateData.eHouwiyaIdentifier ?? (currentSettings as any).eHouwiyaIdentifier),
        },
        ...getRequestAuditMeta(req),
      });
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
    const ext = path.extname(file.originalname).toLowerCase();
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
        certificatePassword: null
      }
    });
    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'UPDATED',
      objectType: 'SETTINGS',
      objectId: companyId,
      message: 'Certificat de signature televerse.',
      metadata: { fileType: ext, certificateSecretStored: false },
      ...getRequestAuditMeta(req),
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

    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      await fs.remove(file.path);
      return res.status(400).json({ message: 'Only PNG, JPG, or WEBP logo images are allowed.' });
    }
    const newFileName = `logo_${companyId}_${Date.now()}${ext}`;
    const newPath = path.join(uploadDir, newFileName);

    await fs.move(file.path, newPath, { overwrite: true });

    const logoUrl = `/uploads/logos/${newFileName}`;

    await prisma.company.update({
      where: { id: companyId },
      data: { logo: logoUrl }
    });
    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'UPDATED',
      objectType: 'SETTINGS',
      objectId: companyId,
      message: 'Logo entreprise mis a jour.',
      metadata: { logo: logoUrl },
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
