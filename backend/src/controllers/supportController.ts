import { Request, Response } from 'express';
import { addTicketReply, getSupportTickets, upsertSupportTicket } from '../services/adminOpsStore';
import { getRequestAuditMeta, logActivity } from '../services/auditTrailService';

const CATEGORIES = ['general', 'billing', 'TTN', 'signature', 'technical', 'dossier'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export const listCompanySupportTickets = async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const tickets = (await getSupportTickets()).filter((ticket) => ticket.companyId === company.id);
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch support tickets' });
  }
};

export const createCompanySupportTicket = async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();
    const category = CATEGORIES.includes(req.body.category) ? req.body.category : 'general';
    const priority = PRIORITIES.includes(req.body.priority) ? req.body.priority : 'normal';

    if (!subject || subject.length < 3) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (!message || message.length < 10) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userLabel = `${company.firstName || ''} ${company.lastName || ''}`.trim() || company.email || company.name;
    const ticket = await upsertSupportTicket({
      companyId: company.id,
      userLabel,
      subject,
      message,
      category,
      priority,
      status: 'open',
    });

    if (ticket) {
      await logActivity({
        companyId: company.id,
        actorId: company.id,
        actorType: 'company',
        actionType: 'SUPPORT_TICKET_CREATED',
        objectType: 'support_ticket',
        objectId: ticket.id,
        message: `Support ticket created: ${subject}`,
        newValue: { subject, category, priority, status: 'open' },
        ...getRequestAuditMeta(req),
      });
    }

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create support ticket' });
  }
};

export const getCompanySupportTicket = async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const ticket = (await getSupportTickets()).find((item) => item.id === req.params.id && item.companyId === company.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket introuvable' });
    res.json({ success: true, data: ticket });
  } catch {
    res.status(500).json({ success: false, message: 'Unable to fetch support ticket' });
  }
};

export const replyCompanySupportTicket = async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const ticket = (await getSupportTickets()).find((item) => item.id === req.params.id && item.companyId === company.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket introuvable' });
    const message = String(req.body.message || '').trim();
    if (message.length < 2) return res.status(400).json({ success: false, message: 'Message requis' });
    const userLabel = `${company.firstName || ''} ${company.lastName || ''}`.trim() || company.email || company.name;
    const updated = await addTicketReply(ticket.id, { authorId: company.id, authorName: userLabel, message });
    await logActivity({
      companyId: company.id,
      actorId: company.id,
      actorType: 'company',
      actionType: 'SUPPORT_TICKET_REPLY_ADDED',
      objectType: 'support_ticket',
      objectId: ticket.id,
      message: `Company reply added to support ticket: ${ticket.subject}`,
      ...getRequestAuditMeta(req),
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Unable to reply to support ticket' });
  }
};
