"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClient = exports.updateClient = exports.createClient = exports.getClientById = exports.getClients = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getClients = async (req, res) => {
    try {
        const clients = await prisma_1.default.client.findMany({
            where: { companyId: req.company.id },
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
        const client = await prisma_1.default.client.create({
            data: {
                companyId: req.company.id,
                name,
                email,
                matriculeFiscal,
                address,
                phone
            }
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
