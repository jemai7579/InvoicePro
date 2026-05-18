"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToClientInvitation = exports.createClientInvitation = exports.getClientInvitations = exports.deleteClient = exports.updateClient = exports.createClient = exports.getClientById = exports.getClients = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const notificationHelper_1 = require("../utils/notificationHelper");
const mailer_1 = require("../utils/mailer");
const nodemailer_1 = __importDefault(require("nodemailer"));
const numberingService_1 = require("../services/numberingService");
const INVITATION_KIND = 'INVITATION';
const PRIVATE_PROJECT_CLIENT_NAME = '__PRIVATE_PROJECTS__';
const getJsonObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const toInvitationDto = (request, direction) => {
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
const getClients = async (req, res) => {
    try {
        const clients = await prisma_1.default.client.findMany({
            where: {
                companyId: req.company.id,
                name: {
                    not: PRIVATE_PROJECT_CLIENT_NAME,
                },
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(clients);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getClients = getClients;
const getClientById = async (req, res) => {
    try {
        const client = await prisma_1.default.client.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(200).json(client);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getClientById = getClientById;
const createClient = async (req, res) => {
    try {
        const { name, email, matriculeFiscal, address, phone } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const client = await prisma_1.default.$transaction(async (tx) => {
            const number = await (0, numberingService_1.generateBusinessNumber)(tx, req.company.id, 'CLIENT');
            return tx.client.create({
                data: {
                    companyId: req.company.id,
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createClient = createClient;
const updateClient = async (req, res) => {
    try {
        const client = await prisma_1.default.client.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        const updatedClient = await prisma_1.default.client.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.status(200).json(updatedClient);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateClient = updateClient;
const deleteClient = async (req, res) => {
    try {
        const client = await prisma_1.default.client.findFirst({
            where: {
                id: req.params.id,
                companyId: req.company.id
            }
        });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        await prisma_1.default.client.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: 'Client removed' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteClient = deleteClient;
const getClientInvitations = async (req, res) => {
    try {
        const companyId = String(req.company.id);
        const companyEmail = (req.company.email || '').toLowerCase();
        const sentRequests = await prisma_1.default.invoiceRequest.findMany({
            where: { companyId },
            include: { client: true, company: true },
            orderBy: { createdAt: 'desc' }
        });
        const incomingRequests = await prisma_1.default.invoiceRequest.findMany({
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
            if (getJsonObject(request?.data).kind !== INVITATION_KIND)
                return false;
            const data = getJsonObject(request.data);
            return data.connectedCompanyId === companyId || (data.recipientEmail || '').toLowerCase() === companyEmail;
        })
            .map((request) => toInvitationDto(request, 'received'));
        res.status(200).json({ sent, received });
    }
    catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getClientInvitations = getClientInvitations;
const createClientInvitation = async (req, res) => {
    try {
        const companyId = String(req.company.id);
        const senderCompany = req.company;
        const { clientId, email, companyName, message } = req.body;
        let client = null;
        if (clientId) {
            client = await prisma_1.default.client.findFirst({
                where: { id: clientId, companyId }
            });
        }
        if (!client && !email) {
            return res.status(400).json({ message: 'Client or email is required.' });
        }
        if (!client) {
            client = await prisma_1.default.client.create({
                data: {
                    companyId,
                    name: companyName || email,
                    email,
                }
            });
        }
        const recipientEmail = (email || client.email || '').toLowerCase();
        const recipientCompany = recipientEmail
            ? await prisma_1.default.company.findUnique({ where: { email: recipientEmail } })
            : null;
        const invitation = await prisma_1.default.invoiceRequest.create({
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
            const info = await (0, mailer_1.sendEmail)(recipientEmail, `Invitation El Fatoura - ${senderCompany.name}`, `
          <div style="font-family: Arial, sans-serif; color: #0f172a;">
            <p>Bonjour,</p>
            <p>${senderCompany.name} vous invite à collaborer sur El Fatoura.</p>
            <p>Connectez-vous à votre compte pour accepter ou refuser cette invitation.</p>
            <p>${message || ''}</p>
          </div>
        `);
            previewUrl = process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST
                ? nodemailer_1.default.getTestMessageUrl(info)
                : undefined;
        }
        if (recipientCompany) {
            await (0, notificationHelper_1.createNotif)(recipientCompany.id, 'Nouvelle invitation client', `${senderCompany.name} vous a envoyé une invitation de collaboration.`, 'INVITATION_RECEIVED');
        }
        res.status(201).json({
            invitation: toInvitationDto(invitation, 'sent'),
            previewUrl,
        });
    }
    catch (error) {
        console.error('Error creating invitation:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createClientInvitation = createClientInvitation;
const respondToClientInvitation = async (req, res) => {
    try {
        const companyId = String(req.company.id);
        const company = req.company;
        const companyEmail = (company.email || '').toLowerCase();
        const { action } = req.body;
        if (!['ACCEPT', 'REFUSE'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action.' });
        }
        const invitation = await prisma_1.default.invoiceRequest.findFirst({
            where: { id: req.params.id },
            include: { client: true, company: true },
        });
        if (!invitation || getJsonObject(invitation?.data).kind !== INVITATION_KIND) {
            return res.status(404).json({ message: 'Invitation not found.' });
        }
        const data = getJsonObject(invitation.data);
        const allowed = data.connectedCompanyId === companyId ||
            (data.recipientEmail || '').toLowerCase() === companyEmail;
        if (!allowed) {
            return res.status(403).json({ message: 'Not allowed to respond to this invitation.' });
        }
        const accepted = action === 'ACCEPT';
        const updated = await prisma_1.default.invoiceRequest.update({
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
            const existingSenderSideClient = await prisma_1.default.client.findFirst({
                where: {
                    companyId: invitation.companyId,
                    email: company.email,
                }
            });
            if (!existingSenderSideClient) {
                await prisma_1.default.client.create({
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
            const existingRecipientSideClient = await prisma_1.default.client.findFirst({
                where: {
                    companyId,
                    email: invitation.company?.email,
                }
            });
            if (!existingRecipientSideClient && invitation.company) {
                await prisma_1.default.client.create({
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
        await (0, notificationHelper_1.createNotif)(invitation.companyId, accepted ? 'Invitation acceptée' : 'Invitation refusée', `${company.name} a ${accepted ? 'accepté' : 'refusé'} votre invitation de collaboration.`, accepted ? 'INVITATION_ACCEPTED' : 'INVITATION_REFUSED');
        res.status(200).json(toInvitationDto(updated, 'received'));
    }
    catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.respondToClientInvitation = respondToClientInvitation;
