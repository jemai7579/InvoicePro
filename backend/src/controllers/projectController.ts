import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import prisma from '../prisma';
import { createNotif } from '../utils/notificationHelper';
import { sendEmail } from '../utils/mailer';
import { generateBusinessNumber } from '../services/numberingService';

const PROJECT_KIND = 'PROJECT';
const INVITATION_KIND = 'INVITATION';
const PRIVATE_PROJECT_CLIENT_NAME = '__PRIVATE_PROJECTS__';

const getJsonObject = (value: any): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const isProjectRequest = (request: any) => getJsonObject(request?.data).kind === PROJECT_KIND;

const normalizeProjectStatus = (data: Record<string, any>) => {
  if (data.workflowStatus) return data.workflowStatus;
  if (data.connectedCompanyId || data.recipientEmail) return 'SHARED';
  return 'IDEA';
};

const getPrivateProjectClient = async (companyId: string) => {
  const existing = await prisma.client.findFirst({
    where: {
      companyId,
      name: PRIVATE_PROJECT_CLIENT_NAME,
    },
  });

  if (existing) return existing;

  return prisma.client.create({
    data: {
      companyId,
      name: PRIVATE_PROJECT_CLIENT_NAME,
      email: null,
      matriculeFiscal: null,
      address: null,
      phone: null,
    },
  });
};

const findAcceptedContact = async (companyId: string, targetCompanyId: string) => {
  const requests = await prisma.invoiceRequest.findMany({
    where: {
      OR: [
        { companyId, data: { path: ['connectedCompanyId'], equals: targetCompanyId } },
        { companyId: targetCompanyId, data: { path: ['connectedCompanyId'], equals: companyId } },
      ],
    },
  });

  return requests.find((request) => {
    const data = getJsonObject(request.data);
    return data.kind === INVITATION_KIND && data.workflowStatus === 'ACCEPTED';
  }) || null;
};

const buildSharedContactPayload = async (companyId: string, payload: any) => {
  if (!payload.sharedWithCompanyId) {
    return {
      sharedWithCompanyId: null,
      sharedWithLabel: null,
      recipientEmail: null,
      status: 'IDEA',
    };
  }

  const targetCompany = await prisma.company.findUnique({
    where: { id: String(payload.sharedWithCompanyId) },
  });

  if (!targetCompany) {
    throw new Error('CONTACT_NOT_FOUND');
  }

  const acceptedInvitation = await findAcceptedContact(companyId, targetCompany.id);
  if (!acceptedInvitation) {
    throw new Error('CONTACT_NOT_ACCEPTED');
  }

  return {
    sharedWithCompanyId: targetCompany.id,
    sharedWithLabel: targetCompany.name,
    recipientEmail: targetCompany.email || null,
    status: 'SHARED',
  };
};

const toProjectDto = (request: any) => {
  const data = getJsonObject(request.data);
  const isPrivate = request.client?.name === PRIVATE_PROJECT_CLIENT_NAME || (!data.connectedCompanyId && !data.recipientEmail);

  return {
    id: request.id,
    clientId: isPrivate ? null : request.clientId,
    client: isPrivate ? null : request.client,
    companyId: request.companyId,
    status: normalizeProjectStatus(data),
    responseStatus: request.status,
    title: data.title || '',
    category: data.category || '',
    description: data.description || '',
    estimatedNeeds: data.estimatedNeeds || '',
    optionalBudget: data.optionalBudget ?? null,
    deadline: data.deadline || null,
    projectReference: data.projectReference || `PRJ-${request.id.slice(0, 8).toUpperCase()}`,
    sentVia: data.sentVia || null,
    note: request.note || '',
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    direction: data.direction || 'outgoing',
    isPrivate,
    sharedWithCompanyId: data.connectedCompanyId || null,
    sharedWithLabel: data.sharedWithLabel || null,
    sourceCompany: request.company
      ? {
          id: request.company.id,
          name: request.company.name,
          email: request.company.email,
        }
      : null,
  };
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const requests = await prisma.invoiceRequest.findMany({
      where: { companyId },
      include: { client: true, company: true },
      orderBy: { createdAt: 'desc' },
    });

    const projects = requests
      .filter(isProjectRequest)
      .map((request) => toProjectDto({ ...request, data: { ...getJsonObject(request.data), direction: 'outgoing' } }));

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReceivedProjects = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const companyEmail = ((req as any).company.email || '').toLowerCase();

    const requests = await prisma.invoiceRequest.findMany({
      where: {
        NOT: { companyId },
      },
      include: {
        client: true,
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const projects = requests
      .filter((request) => {
        if (!isProjectRequest(request)) return false;
        const data = getJsonObject(request.data);
        return data.connectedCompanyId === companyId || (data.recipientEmail || '').toLowerCase() === companyEmail;
      })
      .map((request) => toProjectDto({ ...request, data: { ...getJsonObject(request.data), direction: 'incoming' } }));

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching received projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const { title, category, description, estimatedNeeds, optionalBudget, deadline, note } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Project title is required.' });
    }

    const privateClient = await getPrivateProjectClient(companyId);
    const sharing = await buildSharedContactPayload(companyId, req.body).catch((error) => {
      if (error.message === 'CONTACT_NOT_FOUND') {
        return 'CONTACT_NOT_FOUND';
      }
      if (error.message === 'CONTACT_NOT_ACCEPTED') {
        return 'CONTACT_NOT_ACCEPTED';
      }
      throw error;
    });

    if (sharing === 'CONTACT_NOT_FOUND') {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    if (sharing === 'CONTACT_NOT_ACCEPTED') {
      return res.status(400).json({ message: 'Invite and accept the contact before sharing a project.' });
    }

    const project = await prisma.$transaction(async (tx) => {
      const projectReference = await generateBusinessNumber(tx, companyId, 'PROJECT');
      return tx.invoiceRequest.create({
        data: {
          companyId,
          clientId: privateClient.id,
        status: 'PENDING',
        note: note || null,
        data: {
          kind: PROJECT_KIND,
          title: title.trim(),
          category: category || '',
          description: description || '',
          estimatedNeeds: estimatedNeeds || '',
          optionalBudget: optionalBudget ? Number(optionalBudget) : null,
          deadline: deadline || null,
          workflowStatus: sharing.status,
          projectReference,
          recipientEmail: sharing.recipientEmail,
          connectedCompanyId: sharing.sharedWithCompanyId,
          sharedWithLabel: sharing.sharedWithLabel,
          sentVia: null,
        },
      },
      include: {
        client: true,
        company: true,
      },
    });
    });

    res.status(201).json(toProjectDto(project));
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const existing: any = await prisma.invoiceRequest.findFirst({
      where: { id: req.params.id as string, companyId },
      include: { client: true, company: true },
    });

    if (!existing || !isProjectRequest(existing)) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const currentData = getJsonObject(existing.data);
    const currentStatus = normalizeProjectStatus(currentData);
    if (!['IDEA', 'DRAFT', 'SHARED', 'SENT'].includes(currentStatus)) {
      return res.status(400).json({ message: 'Only idea, draft, shared or sent projects can be edited.' });
    }

    const sharing = await buildSharedContactPayload(companyId, {
      ...req.body,
      sharedWithCompanyId:
        req.body.sharedWithCompanyId === undefined
          ? currentData.connectedCompanyId || ''
          : req.body.sharedWithCompanyId,
    }).catch((error) => {
      if (error.message === 'CONTACT_NOT_FOUND') {
        return 'CONTACT_NOT_FOUND';
      }
      if (error.message === 'CONTACT_NOT_ACCEPTED') {
        return 'CONTACT_NOT_ACCEPTED';
      }
      throw error;
    });

    if (sharing === 'CONTACT_NOT_FOUND') {
      return res.status(404).json({ message: 'Contact not found.' });
    }
    if (sharing === 'CONTACT_NOT_ACCEPTED') {
      return res.status(400).json({ message: 'Invite and accept the contact before sharing a project.' });
    }

    const updated = await prisma.invoiceRequest.update({
      where: { id: existing.id },
      data: {
        note: req.body.note ?? existing.note,
        data: {
          ...currentData,
          title: req.body.title ?? currentData.title ?? '',
          category: req.body.category ?? currentData.category ?? '',
          description: req.body.description ?? currentData.description ?? '',
          estimatedNeeds: req.body.estimatedNeeds ?? currentData.estimatedNeeds ?? '',
          optionalBudget: req.body.optionalBudget === '' ? null : req.body.optionalBudget ?? currentData.optionalBudget ?? null,
          deadline: req.body.deadline ?? currentData.deadline ?? null,
          connectedCompanyId: sharing.sharedWithCompanyId,
          recipientEmail: sharing.recipientEmail,
          sharedWithLabel: sharing.sharedWithLabel,
          workflowStatus: currentStatus === 'SENT' ? 'SENT' : sharing.status,
        },
      },
      include: {
        client: true,
        company: true,
      },
    });

    res.status(200).json(toProjectDto(updated));
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendProject = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const company = (req as any).company;
    const { mode = 'platform' } = req.body;

    const project: any = await prisma.invoiceRequest.findFirst({
      where: { id: req.params.id as string, companyId },
      include: { client: true, company: true },
    });

    if (!project || !isProjectRequest(project)) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const data = getJsonObject(project.data);
    if (!data.connectedCompanyId || !data.recipientEmail) {
      return res.status(400).json({ message: 'Choose an accepted contact before sending this order.' });
    }

    const acceptedInvitation = await findAcceptedContact(companyId, String(data.connectedCompanyId));
    if (!acceptedInvitation) {
      return res.status(400).json({ message: 'This contact is not connected yet. Invite them first.' });
    }

    const updated = await prisma.invoiceRequest.update({
      where: { id: project.id },
      data: {
        status: 'PENDING',
        data: {
          ...data,
          workflowStatus: 'SENT',
          sentVia: mode,
        },
      },
      include: {
        client: true,
        company: true,
      },
    });

    const subject = `Nouveau bon de commande - ${data.title || project.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <p>Bonjour,</p>
        <p>${company.name} vous a envoye un projet / bon de commande depuis El Fatoura.</p>
        <p><strong>${data.title || 'Projet'}</strong></p>
        <p>${data.description || ''}</p>
        <p>Connectez-vous a la plateforme pour accepter ou refuser la demande.</p>
      </div>
    `;

    const info = await sendEmail(data.recipientEmail, subject, html);

    await createNotif(
      data.connectedCompanyId,
      'Nouveau projet recu',
      `${company.name} vous a envoye le projet "${data.title || 'Sans titre'}".`,
      'PROJECT_RECEIVED'
    );

    res.status(200).json({
      message: 'Project sent successfully.',
      previewUrl:
        process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST
          ? nodemailer.getTestMessageUrl(info)
          : undefined,
      project: toProjectDto(updated),
    });
  } catch (error) {
    console.error('Error sending project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondToProject = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const companyEmail = ((req as any).company.email || '').toLowerCase();
    const { action } = req.body;

    if (!['ACCEPT', 'REFUSE'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    const project: any = await prisma.invoiceRequest.findFirst({
      where: { id: req.params.id as string },
      include: { client: true, company: true },
    });

    if (!project || !isProjectRequest(project)) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const data = getJsonObject(project.data);
    const allowed =
      data.connectedCompanyId === companyId ||
      (data.recipientEmail || '').toLowerCase() === companyEmail;

    if (!allowed) {
      return res.status(403).json({ message: 'Not allowed to respond to this project.' });
    }

    const accepted = action === 'ACCEPT';
    const updated = await prisma.invoiceRequest.update({
      where: { id: project.id },
      data: {
        status: accepted ? 'ACCEPTED' : 'REJECTED',
        data: {
          ...data,
          workflowStatus: accepted ? 'ACCEPTED' : 'REFUSED',
        },
      },
      include: { client: true, company: true },
    });

    await createNotif(
      project.companyId,
      accepted ? 'Projet accepte' : 'Projet refuse',
      `${(req as any).company.name} a ${accepted ? 'accepte' : 'refuse'} le projet "${data.title || 'Sans titre'}".`,
      accepted ? 'PROJECT_ACCEPTED' : 'PROJECT_REFUSED'
    );

    res.status(200).json(toProjectDto(updated));
  } catch (error) {
    console.error('Error responding to project:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
