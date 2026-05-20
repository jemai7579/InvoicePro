"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPartnerMessage = exports.getMessagesWithPartner = exports.getConversations = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const auditTrailService_1 = require("../services/auditTrailService");
const networkService_1 = require("../services/networkService");
const getConversations = async (req, res) => {
    try {
        const companyId = String(req.company.id);
        const partners = await (0, networkService_1.getConnectedPartners)(companyId);
        res.status(200).json(partners);
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getConversations = getConversations;
const getMessagesWithPartner = async (req, res) => {
    try {
        const companyId = String(req.company.id);
        const partnerCompanyId = String(req.params.partnerCompanyId);
        if (!(await (0, networkService_1.hasAcceptedConnection)(companyId, partnerCompanyId))) {
            return res.status(403).json({ message: 'Only accepted partners can chat.' });
        }
        const messages = await prisma_1.default.partnerMessage.findMany({
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
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMessagesWithPartner = getMessagesWithPartner;
const sendPartnerMessage = async (req, res) => {
    try {
        const companyId = String(req.company.id);
        const { partnerCompanyId, body } = req.body;
        const text = String(body || '').trim();
        if (!partnerCompanyId || !text) {
            return res.status(400).json({ message: 'Partner and message are required.' });
        }
        if (!(await (0, networkService_1.hasAcceptedConnection)(companyId, partnerCompanyId))) {
            return res.status(403).json({ message: 'Only accepted partners can chat.' });
        }
        const message = await prisma_1.default.partnerMessage.create({
            data: {
                senderCompanyId: companyId,
                recipientCompanyId: partnerCompanyId,
                body: text,
            },
        });
        await (0, auditTrailService_1.logActivity)({
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
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.sendPartnerMessage = sendPartnerMessage;
