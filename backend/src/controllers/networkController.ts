import { Request, Response } from 'express';
import prisma from '../prisma';
import { createNotif } from '../utils/notificationHelper';
import { logActivity } from '../services/auditTrailService';
import { getConnectedPartners, upsertAcceptedConnection } from '../services/networkService';

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const invitationDto = (invitation: any, direction: 'sent' | 'received') => ({
  id: invitation.id,
  status: invitation.status,
  message: invitation.message,
  recipientEmail: invitation.recipientEmail,
  createdAt: invitation.createdAt,
  updatedAt: invitation.updatedAt,
  direction,
  senderCompany: invitation.senderCompany ? {
    id: invitation.senderCompany.id,
    name: invitation.senderCompany.name,
    email: invitation.senderCompany.email,
  } : null,
  recipientCompany: invitation.recipientCompany ? {
    id: invitation.recipientCompany.id,
    name: invitation.recipientCompany.name,
    email: invitation.recipientCompany.email,
  } : null,
});

export const getNetworkOverview = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const companyEmail = normalizeEmail((req as any).company.email);

    const [partners, sent, received] = await Promise.all([
      getConnectedPartners(companyId),
      prisma.platformInvitation.findMany({
        where: { senderCompanyId: companyId },
        include: { senderCompany: true, recipientCompany: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.platformInvitation.findMany({
        where: {
          OR: [
            { recipientCompanyId: companyId },
            { recipientEmail: companyEmail },
          ],
        },
        include: { senderCompany: true, recipientCompany: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.status(200).json({
      partners,
      sent: sent.map((item) => invitationDto(item, 'sent')),
      received: received.map((item) => invitationDto(item, 'received')),
    });
  } catch (error) {
    console.error('Error fetching network:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPlatformInvitation = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const senderCompany = (req as any).company;
    const email = normalizeEmail(req.body.email);
    const message = String(req.body.message || '').trim();

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (email === normalizeEmail(senderCompany.email)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous inviter vous-même.' });
    }

    const recipientCompany = await prisma.company.findUnique({ where: { email } });

    const invitation = await prisma.platformInvitation.create({
      data: {
        senderCompanyId: companyId,
        recipientCompanyId: recipientCompany?.id || null,
        recipientEmail: email,
        message: message || null,
      },
      include: { senderCompany: true, recipientCompany: true },
    });

    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'SENT',
      objectType: 'SETTINGS',
      objectId: invitation.id,
      message: `Invitation interne envoyee a ${email}.`,
      metadata: { target: 'NETWORK_INVITATION', recipientCompanyId: recipientCompany?.id || null },
    });

    if (recipientCompany) {
      await createNotif(
        recipientCompany.id,
        'Invitation reseau professionnel',
        `${senderCompany.name} vous invite a rejoindre son reseau professionnel.`,
        'INVITATION_RECEIVED'
      );
    }

    res.status(201).json(invitationDto(invitation, 'sent'));
  } catch (error) {
    console.error('Error creating platform invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondToPlatformInvitation = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const company = (req as any).company;
    const action = req.body.action;

    if (!['ACCEPT', 'REFUSE'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    const invitation = await prisma.platformInvitation.findUnique({
      where: { id: String(req.params.id) },
      include: { senderCompany: true, recipientCompany: true },
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }

    const canRespond =
      invitation.recipientCompanyId === companyId ||
      normalizeEmail(invitation.recipientEmail) === normalizeEmail(company.email);

    if (!canRespond) {
      return res.status(403).json({ message: 'Not allowed to respond to this invitation.' });
    }

    const accepted = action === 'ACCEPT';

    const updated = await prisma.platformInvitation.update({
      where: { id: invitation.id },
      data: {
        status: accepted ? 'ACCEPTED' : 'REFUSED',
        recipientCompanyId: companyId,
        respondedAt: new Date(),
      },
      include: { senderCompany: true, recipientCompany: true },
    });

    if (accepted) {
      await upsertAcceptedConnection(invitation.senderCompanyId, companyId);
    }

    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: accepted ? 'ACCEPTED' : 'REJECTED',
      objectType: 'SETTINGS',
      objectId: invitation.id,
      message: `Invitation interne ${accepted ? 'acceptee' : 'refusee'}.`,
      metadata: { target: 'NETWORK_INVITATION', senderCompanyId: invitation.senderCompanyId },
    });

    await createNotif(
      invitation.senderCompanyId,
      accepted ? 'Invitation acceptee' : 'Invitation refusee',
      `${company.name} a ${accepted ? 'accepte' : 'refuse'} votre invitation reseau.`,
      accepted ? 'INVITATION_ACCEPTED' : 'INVITATION_REFUSED'
    );

    res.status(200).json(invitationDto(updated, 'received'));
  } catch (error) {
    console.error('Error responding to platform invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const shareWithPartner = async (req: Request, res: Response) => {
  try {
    const companyId = String((req as any).company.id);
    const { partnerCompanyId, objectType, objectId, message } = req.body;

    if (!partnerCompanyId || !objectType || !objectId) {
      return res.status(400).json({ message: 'Partner, object type and object id are required.' });
    }

    const connection = await prisma.partnerConnection.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { companyAId: companyId, companyBId: partnerCompanyId },
          { companyAId: partnerCompanyId, companyBId: companyId },
        ],
      },
    });

    if (!connection) {
      return res.status(403).json({ message: 'Only accepted partners can receive shared items.' });
    }

    const payload = await prisma.partnerMessage.create({
      data: {
        senderCompanyId: companyId,
        recipientCompanyId: partnerCompanyId,
        body: message || `${objectType} partage depuis InvoicePro.`,
        metadata: { shareType: objectType, objectId },
      },
    });

    await logActivity({
      companyId,
      actorId: companyId,
      actorType: 'USER',
      actionType: 'SENT',
      objectType,
      objectId,
      message: `${objectType} partage avec un partenaire reseau.`,
      metadata: { partnerCompanyId, messageId: payload.id },
    });

    res.status(201).json(payload);
  } catch (error) {
    console.error('Error sharing with partner:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
