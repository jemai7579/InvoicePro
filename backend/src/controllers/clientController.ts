import { Request, Response } from 'express';
import prisma from '../prisma';
import { createNotif } from '../utils/notificationHelper';
import { sendEmail } from '../utils/mailer';
import nodemailer from 'nodemailer';
import { generateBusinessNumber } from '../services/numberingService';

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
    const { name, email, matriculeFiscal, address, phone } = req.body;

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
          matriculeFiscal,
          address,
          phone
        }
      });
    });

    res.status(201).json(client);
  } catch (error) {
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

    const updatedClient = await prisma.client.update({
      where: { id: req.params.id as string },
      data: req.body
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
  try {
    const companyId = String((req as any).company.id);
    const companyEmail = ((req as any).company.email || '').toLowerCase();

    const sentRequests: any[] = await prisma.invoiceRequest.findMany({
      where: { companyId },
      include: { client: true, company: true },
      orderBy: { createdAt: 'desc' }
    });

    const incomingRequests: any[] = await prisma.invoiceRequest.findMany({
      where: {
        NOT: { companyId }
      },
      include: { client: true, company: true },
      orderBy: { createdAt: 'desc' }
    });

    const sent = sentRequests
      .filter((request) => getJsonObject(request?.data).kind === INVITATION_KIND)
      .map((request) => toInvitationDto(request, 'sent'));

    const received = incomingRequests
      .filter((request) => {
        if (getJsonObject(request?.data).kind !== INVITATION_KIND) return false;
        const data = getJsonObject(request.data);
        return data.connectedCompanyId === companyId || (data.recipientEmail || '').toLowerCase() === companyEmail;
      })
      .map((request) => toInvitationDto(request, 'received'));

    res.status(200).json({ sent, received });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createClientInvitation = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const senderCompany = (req as any).company;
    const { clientId, email, companyName, message } = req.body;

    let client = null;
    if (clientId) {
      client = await prisma.client.findFirst({
        where: { id: clientId, companyId }
      });
    }

    if (!client && !email) {
      return res.status(400).json({ message: 'Client or email is required.' });
    }

    if (!client) {
      client = await prisma.client.create({
        data: {
          companyId,
          name: companyName || email,
          email,
        }
      });
    }

    const recipientEmail = (email || client.email || '').toLowerCase();
    const recipientCompany: any = recipientEmail
      ? await prisma.company.findUnique({ where: { email: recipientEmail } })
      : null;

    const invitation = await prisma.invoiceRequest.create({
      data: {
        companyId,
        clientId: client.id,
        status: 'PENDING',
        note: message || null,
        data: {
          kind: INVITATION_KIND,
          workflowStatus: 'PENDING',
          recipientEmail: recipientEmail || null,
          connectedCompanyId: recipientCompany?.id || null,
        }
      },
      include: {
        client: true,
        company: true,
      }
    });

    let previewUrl;
    if (recipientEmail) {
      const info = await sendEmail(
        recipientEmail,
        `Invitation El Fatoura - ${senderCompany.name}`,
        `
          <div style="font-family: Arial, sans-serif; color: #0f172a;">
            <p>Bonjour,</p>
            <p>${senderCompany.name} vous invite à collaborer sur El Fatoura.</p>
            <p>Connectez-vous à votre compte pour accepter ou refuser cette invitation.</p>
            <p>${message || ''}</p>
          </div>
        `
      );

      previewUrl = process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST
        ? nodemailer.getTestMessageUrl(info)
        : undefined;
    }

    if (recipientCompany) {
      await createNotif(
        recipientCompany.id,
        'Nouvelle invitation client',
        `${senderCompany.name} vous a envoyé une invitation de collaboration.`,
        'INVITATION_RECEIVED'
      );
    }

    res.status(201).json({
      invitation: toInvitationDto(invitation, 'sent'),
      previewUrl,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondToClientInvitation = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const company = (req as any).company;
    const companyEmail = (company.email || '').toLowerCase();
    const { action } = req.body;

    if (!['ACCEPT', 'REFUSE'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    const invitation: any = await prisma.invoiceRequest.findFirst({
      where: { id: req.params.id as string },
      include: { client: true, company: true },
    });

    if (!invitation || getJsonObject(invitation?.data).kind !== INVITATION_KIND) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }

    const data = getJsonObject(invitation.data);
    const allowed =
      data.connectedCompanyId === companyId ||
      (data.recipientEmail || '').toLowerCase() === companyEmail;

    if (!allowed) {
      return res.status(403).json({ message: 'Not allowed to respond to this invitation.' });
    }

    const accepted = action === 'ACCEPT';

    const updated = await prisma.invoiceRequest.update({
      where: { id: invitation.id },
      data: {
        status: accepted ? 'ACCEPTED' : 'REJECTED',
        data: {
          ...data,
          workflowStatus: accepted ? 'ACCEPTED' : 'REFUSED',
          connectedCompanyId: accepted ? companyId : data.connectedCompanyId || null,
        },
      },
      include: { client: true, company: true },
    });

    if (accepted) {
      const existingSenderSideClient = await prisma.client.findFirst({
        where: {
          companyId: invitation.companyId,
          email: company.email,
        }
      });

      if (!existingSenderSideClient) {
        await prisma.client.create({
          data: {
            companyId: invitation.companyId,
            name: company.name,
            email: company.email,
            matriculeFiscal: company.matriculeFiscal,
            address: company.address,
            phone: company.phone,
          }
        });
      }

      const existingRecipientSideClient = await prisma.client.findFirst({
        where: {
          companyId,
          email: invitation.company?.email,
        }
      });

      if (!existingRecipientSideClient && invitation.company) {
        await prisma.client.create({
          data: {
            companyId,
            name: invitation.company.name,
            email: invitation.company.email,
            matriculeFiscal: invitation.company.matriculeFiscal,
            address: invitation.company.address,
            phone: invitation.company.phone,
          }
        });
      }
    }

    await createNotif(
      invitation.companyId,
      accepted ? 'Invitation acceptée' : 'Invitation refusée',
      `${company.name} a ${accepted ? 'accepté' : 'refusé'} votre invitation de collaboration.`,
      accepted ? 'INVITATION_ACCEPTED' : 'INVITATION_REFUSED'
    );

    res.status(200).json(toInvitationDto(updated, 'received'));
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
