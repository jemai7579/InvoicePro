"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToClientInvitation = exports.createClientInvitation = exports.getClientInvitations = exports.deleteClient = exports.updateClient = exports.importClients = exports.createClient = exports.getClientById = exports.getClients = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const numberingService_1 = require("../services/numberingService");
const auditTrailService_1 = require("../services/auditTrailService");
const networkController_1 = require("./networkController");
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
        const { name, email, matriculeFiscal, address, phone, city, rne, notes } = req.body;
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
                    phone,
                    city,
                    rne,
                    notes
                }
            });
        });
        await (0, auditTrailService_1.logActivity)({
            companyId: req.company.id,
            actorId: req.company.id,
            actorType: 'USER',
            actionType: 'CREATED',
            objectType: 'CLIENT',
            objectId: client.id,
            message: `Client cree manuellement: ${client.name}.`,
            newValue: client,
        });
        res.status(201).json(client);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createClient = createClient;
const normalizeImportedCell = (value) => {
    if (value === null || value === undefined || String(value).trim() === '')
        return 'vide';
    return String(value).trim();
};
const normalizeOptionalEmail = (value) => {
    const email = String(value || '').trim().toLowerCase();
    return email === '' || email === 'vide' ? null : email;
};
const importClients = async (req, res) => {
    try {
        const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
        const companyId = String(req.company.id);
        if (rows.length === 0) {
            return res.status(400).json({ message: 'No clients to import.' });
        }
        const warnings = [];
        const candidates = rows.map((row, index) => {
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
        const validRows = candidates.filter((row) => row.name !== 'vide' && (!row.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)));
        const created = await prisma_1.default.$transaction(async (tx) => {
            const items = [];
            for (const row of validRows) {
                const number = await (0, numberingService_1.generateBusinessNumber)(tx, companyId, 'CLIENT');
                items.push(await tx.client.create({
                    data: {
                        companyId,
                        number,
                        name: row.name,
                        email: row.email,
                        phone: row.phone === 'vide' ? null : row.phone,
                        matriculeFiscal: row.matriculeFiscal === 'vide' ? null : row.matriculeFiscal,
                        rne: row.rne === 'vide' ? null : row.rne,
                        address: row.address === 'vide' ? null : row.address,
                        city: row.city === 'vide' ? null : row.city,
                        notes: row.notes === 'vide' ? null : row.notes,
                    },
                }));
            }
            return items;
        });
        await (0, auditTrailService_1.logActivity)({
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
    }
    catch (error) {
        console.error('Error importing clients:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.importClients = importClients;
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
    return (0, networkController_1.getNetworkOverview)(req, res);
};
exports.getClientInvitations = getClientInvitations;
const createClientInvitation = async (req, res) => {
    return (0, networkController_1.createPlatformInvitation)(req, res);
};
exports.createClientInvitation = createClientInvitation;
const respondToClientInvitation = async (req, res) => {
    return (0, networkController_1.respondToPlatformInvitation)(req, res);
};
exports.respondToClientInvitation = respondToClientInvitation;
