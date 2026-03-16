"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getSettings = async (req, res) => {
    try {
        const company = await prisma_1.default.company.findUnique({
            where: { id: req.company.id },
            select: {
                id: true,
                email: true,
                name: true,
                matriculeFiscal: true,
                registreCommerce: true,
                address: true,
                city: true,
                zipCode: true,
                country: true,
                phone: true,
                rib: true,
                logo: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json(company);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const { name, matriculeFiscal, registreCommerce, address, city, zipCode, country, phone, rib, logo } = req.body;
        const updatedCompany = await prisma_1.default.company.update({
            where: { id: req.company.id },
            data: {
                name,
                matriculeFiscal,
                registreCommerce,
                address,
                city,
                zipCode,
                country,
                phone,
                rib,
                logo
            },
            select: {
                id: true,
                email: true,
                name: true,
                matriculeFiscal: true,
                registreCommerce: true,
                address: true,
                city: true,
                zipCode: true,
                country: true,
                phone: true,
                rib: true,
                logo: true
            }
        });
        res.status(200).json(updatedCompany);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateSettings = updateSettings;
