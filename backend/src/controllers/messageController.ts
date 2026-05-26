import { Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import prisma from '../prisma';
import { createNotif } from '../utils/notificationHelper';
import { logActivity } from '../services/auditTrailService';
import { getConnectedPartners, hasAcceptedConnection } from '../services/networkService';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const partners = await getConnectedPartners(companyId);
    res.status(200).json(partners);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessagesWithPartner = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const partnerCompanyId = String(req.params.partnerCompanyId);

    if (!(await hasAcceptedConnection(companyId, partnerCompanyId))) {
      return res.status(403).json({ message: 'Only accepted partners can chat.' });
    }

    const messages = await prisma.partnerMessage.findMany({
      where: {
        OR: [
          { senderCompanyId: companyId, recipientCompanyId: partnerCompanyId },
          { senderCompanyId: partnerCompanyId, recipientCompanyId: companyId },
        ],
      },
      include: { senderCompany: true, recipientCompany: true },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendPartnerMessage = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const { partnerCompanyId, body, attachmentType, objectId } = req.body;
    const text = String(body || '').trim();

    if (!partnerCompanyId || (!text && !attachmentType)) {
      return res.status(400).json({ message: 'Partner and message are required.' });
    }

    if (!(await hasAcceptedConnection(companyId, partnerCompanyId))) {
      return res.status(403).json({ message: 'Only accepted partners can chat.' });
    }

    let metadata: any = undefined;
    let messageBody = text;
    if (attachmentType && !['file', 'project', 'product'].includes(String(attachmentType))) {
      return res.status(400).json({ message: 'Invalid attachment type.' });
    }
    if (attachmentType && attachmentType !== 'file' && !objectId) {
      return res.status(400).json({ message: 'Shared resource is required.' });
    }

    if (attachmentType === 'product') {
      const product = await prisma.product.findFirst({ where: { id: String(objectId), companyId } });
      if (!product) return res.status(404).json({ message: 'Product not found.' });
      metadata = {
        attachmentType: 'product',
        productId: product.id,
        product: {
          id: product.id,
          name: product.name,
          code: product.code,
          category: product.category,
          description: product.description,
          priceHT: product.priceHT,
          tvaRate: product.tvaRate,
          unit: product.unit,
          imageUrl: product.imageUrl,
        },
      };
      messageBody = text || `Produit partagé: ${product.name}`;
    }

    if (attachmentType === 'project') {
      const project: any = await prisma.invoiceRequest.findFirst({ where: { id: String(objectId), companyId } });
      const data: any = project?.data || {};
      if (!project || data.kind !== 'PROJECT') return res.status(404).json({ message: 'Project not found.' });
      metadata = {
        attachmentType: 'project',
        projectId: project.id,
        project: {
          id: project.id,
          title: data.title || '',
          category: data.category || '',
          description: data.description || '',
          estimatedNeeds: data.estimatedNeeds || '',
          optionalBudget: data.optionalBudget || null,
          deadline: data.deadline || null,
          projectReference: data.projectReference || null,
        },
      };
      messageBody = text || `Projet partagé: ${data.title || project.id}`;
    }

    const message = await prisma.partnerMessage.create({
      data: {
        senderCompanyId: companyId,
        recipientCompanyId: partnerCompanyId,
        body: messageBody,
        metadata,
      },
    });

    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'SENT',
      objectType: 'SETTINGS',
      objectId: message.id,
      message: 'Message envoye a un partenaire reseau.',
      metadata: { target: 'PARTNER_MESSAGE', partnerCompanyId },
    });

    if (metadata?.attachmentType) {
      await createNotif(
        partnerCompanyId,
        metadata.attachmentType === 'product' ? 'Produit partage' : 'Projet partage',
        `${(req as any).company.name} a partagé un ${metadata.attachmentType === 'product' ? 'produit' : 'projet'} avec vous.`,
        metadata.attachmentType === 'product' ? 'PRODUCT_SHARED' : 'PROJECT_SHARED'
      );
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadMessageFile = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const { partnerCompanyId, body } = req.body;
    const file = (req as any).file;

    if (!partnerCompanyId || !file) {
      return res.status(400).json({ message: 'Partner and file are required.' });
    }
    if (!(await hasAcceptedConnection(companyId, partnerCompanyId))) {
      await fs.remove(file.path).catch(() => {});
      return res.status(403).json({ message: 'Only accepted partners can chat.' });
    }

    const message = await prisma.partnerMessage.create({
      data: {
        senderCompanyId: companyId,
        recipientCompanyId: partnerCompanyId,
        body: String(body || `Fichier partagé: ${file.originalname}`).trim(),
        metadata: {
          attachmentType: 'file',
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageName: file.filename,
        },
      },
    });

    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'SENT',
      objectType: 'SETTINGS',
      objectId: message.id,
      message: 'Fichier partage dans une conversation reseau.',
      metadata: { target: 'PARTNER_MESSAGE_FILE', partnerCompanyId, fileName: file.originalname },
    });

    await createNotif(partnerCompanyId, 'Fichier partage', `${(req as any).company.name} a partagé ${file.originalname}.`, 'MESSAGE_FILE');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error uploading message file:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const downloadMessageFile = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const message = await prisma.partnerMessage.findFirst({
      where: {
        id: String(req.params.messageId),
        OR: [{ senderCompanyId: companyId }, { recipientCompanyId: companyId }],
      },
    });

    const metadata: any = message?.metadata || {};
    if (!message || metadata.attachmentType !== 'file' || !metadata.storageName) {
      return res.status(404).json({ message: 'File not found.' });
    }

    const baseDir = path.resolve(process.cwd(), 'uploads/message-attachments');
    const filePath = path.resolve(baseDir, metadata.storageName);
    if (!filePath.startsWith(baseDir) || !(await fs.pathExists(filePath))) {
      return res.status(404).json({ message: 'File not found.' });
    }

    res.download(filePath, metadata.fileName || 'attachment');
  } catch (error) {
    console.error('Error downloading message file:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
