import { Request, Response } from 'express';
import prisma from '../prisma';
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
    const { partnerCompanyId, body } = req.body;
    const text = String(body || '').trim();

    if (!partnerCompanyId || !text) {
      return res.status(400).json({ message: 'Partner and message are required.' });
    }

    if (!(await hasAcceptedConnection(companyId, partnerCompanyId))) {
      return res.status(403).json({ message: 'Only accepted partners can chat.' });
    }

    const message = await prisma.partnerMessage.create({
      data: {
        senderCompanyId: companyId,
        recipientCompanyId: partnerCompanyId,
        body: text,
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

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
