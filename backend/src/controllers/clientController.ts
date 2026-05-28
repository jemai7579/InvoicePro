import { Request, Response } from 'express';
import prisma from '../prisma';
import { createNotif } from '../utils/notificationHelper';
import { generateBusinessNumber } from '../services/numberingService';
import { logActivity } from '../services/auditTrailService';
import { normalizeTunisianMatriculeFiscal } from '../utils/teifGenerator';
import {
  createPlatformInvitation,
  getNetworkOverview,
  respondToPlatformInvitation,
} from './networkController';

const INVITATION_KIND = 'INVITATION';
const PRIVATE_PROJECT_CLIENT_NAME = '__PRIVATE_PROJECTS__';
const getJsonObject = (value: any): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toInvitationDto = (request: any, direction: 'sent' | 'received') => {
  const data = getJsonObject(request.data);
  return {
    id: request.id,
    clientId: request.clientId,
    client: request.client,
    status: data.workflowStatus || request.status || 'PENDING',
    responseStatus: request.status,
    message: request.note || '',
    recipientEmail: data.recipientEmail || request.client?.email || '',
    connectedCompanyId: data.connectedCompanyId || null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    direction,
    company: request.company ? {
      id: request.company.id,
      name: request.company.name,
      email: request.company.email,
    } : null,
  };
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      where: {
        companyId: (req as any).company.id,
        name: {
          not: PRIVATE_PROJECT_CLIENT_NAME,
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, email, matriculeFiscal, address, phone, city, rne, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const client = await prisma.$transaction(async (tx) => {
      const number = await generateBusinessNumber(tx, (req as any).company.id, 'CLIENT');
      return tx.client.create({
        data: {
          companyId: (req as any).company.id,
          number,
          name,
          email,
          matriculeFiscal: String(matriculeFiscal || '').trim() ? normalizeTunisianMatriculeFiscal(matriculeFiscal) : null,
          address,
          phone,
          city,
          rne,
          notes
        }
      });
    });

    await logActivity({
      companyId: (req as any).company.id,
      actorId: (req as any).company.id,
      actorType: 'USER',
      actionType: 'CREATED',
      objectType: 'CLIENT',
      objectId: client.id,
      message: `Client cree manuellement: ${client.name}.`,
      newValue: client,
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const normalizeImportedCell = (value: any) => {
  if (value === null || value === undefined || String(value).trim() === '') return 'vide';
  return String(value).trim();
};

const normalizeOptionalEmail = (value: any) => {
  const email = String(value || '').trim().toLowerCase();
  return email === '' || email === 'vide' ? null : email;
};

export const importClients = async (req: Request, res: Response) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    const companyId = String((req as any).company.id);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No clients to import.' });
    }
    if (rows.length > 500) {
      return res.status(400).json({ message: 'Maximum 500 clients per import.' });
    }

    const warnings: Array<{ row: number; message: string }> = [];
    const candidates = rows.map((row: any, index: number) => {
      const name = normalizeImportedCell(row.name ?? row.Nom);
      const email = normalizeOptionalEmail(row.email ?? row.Email);

      if (name === 'vide') {
        warnings.push({ row: index + 1, message: 'Nom manquant.' });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        warnings.push({ row: index + 1, message: 'Email invalide.' });
      }

      return {
        name,
        email,
        phone: normalizeImportedCell(row.phone ?? row['Téléphone'] ?? row.Telephone),
        companyName: normalizeImportedCell(row.companyName ?? row['Société'] ?? row.Societe),
        matriculeFiscal: normalizeImportedCell(row.matriculeFiscal ?? row['Matricule Fiscal']),
        rne: normalizeImportedCell(row.rne ?? row.RNE),
        address: normalizeImportedCell(row.address ?? row.Adresse),
        city: normalizeImportedCell(row.city ?? row.Ville),
        notes: normalizeImportedCell(row.notes ?? row.Notes),
      };
    });

    const validRows = candidates.filter((row: any) => row.name !== 'vide' && (!row.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)));

    const created = await prisma.$transaction(async (tx) => {
      const items = [];
      for (const row of validRows) {
        const number = await generateBusinessNumber(tx, companyId, 'CLIENT');
        items.push(await tx.client.create({
          data: {
            companyId,
            number,
            name: row.name,
            email: row.email,
            phone: row.phone === 'vide' ? null : row.phone,
            matriculeFiscal: row.matriculeFiscal === 'vide' ? null : normalizeTunisianMatriculeFiscal(row.matriculeFiscal),
            rne: row.rne === 'vide' ? null : row.rne,
            address: row.address === 'vide' ? null : row.address,
            city: row.city === 'vide' ? null : row.city,
            notes: row.notes === 'vide' ? null : row.notes,
          },
        }));
      }
      return items;
    });

    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'CREATED',
      objectType: 'CLIENT',
      objectId: `import-${Date.now()}`,
      message: `${created.length} clients importes depuis Excel/CSV.`,
      metadata: { importedCount: created.length, warnings },
    });

    res.status(201).json({ imported: created.length, warnings, clients: created });
  } catch (error) {
    console.error('Error importing clients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const allowedFields = ['name', 'email', 'matriculeFiscal', 'address', 'phone', 'city', 'rne', 'notes'];
    const data = Object.fromEntries(
      allowedFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [
          field,
          field === 'matriculeFiscal'
            ? (String(req.body[field] || '').trim() ? normalizeTunisianMatriculeFiscal(req.body[field]) : null)
            : req.body[field],
        ])
    );

    const updatedClient = await prisma.client.update({
      where: { id: req.params.id as string },
      data
    });

    res.status(200).json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findFirst({
      where: { 
        id: req.params.id as string,
        companyId: (req as any).company.id
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await prisma.client.delete({
      where: { id: req.params.id as string }
    });

    res.status(200).json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getClientInvitations = async (req: Request, res: Response) => {
  return getNetworkOverview(req, res);
};

export const createClientInvitation = async (req: Request, res: Response) => {
  return createPlatformInvitation(req, res);
};

export const respondToClientInvitation = async (req: Request, res: Response) => {
  return respondToPlatformInvitation(req, res);
};
