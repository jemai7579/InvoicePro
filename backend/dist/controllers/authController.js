"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../prisma"));
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'supersecret', {
        expiresIn: '30d',
    });
};
const register = async (req, res) => {
    try {
        const { email, password, name, matriculeFiscal, registreCommerce, address, phone, rib } = req.body;
        if (!email || !password || !name || !matriculeFiscal || !address) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }
        const companyExists = await prisma_1.default.company.findUnique({
            where: { email },
        });
        if (companyExists) {
            return res.status(400).json({ message: 'Company already exists' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const company = await prisma_1.default.company.create({
            data: {
                email,
                password: hashedPassword,
                name,
                matriculeFiscal,
                registreCommerce,
                address,
                phone,
                rib
            },
        });
        if (company) {
            res.status(201).json({
                id: company.id,
                name: company.name,
                email: company.email,
                token: generateToken(company.id),
            });
        }
        else {
            res.status(400).json({ message: 'Invalid company data' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const company = await prisma_1.default.company.findUnique({
            where: { email },
        });
        if (company && (await bcryptjs_1.default.compare(password, company.password))) {
            res.json({
                id: company.id,
                name: company.name,
                email: company.email,
                token: generateToken(company.id),
            });
        }
        else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const company = await prisma_1.default.company.findUnique({
            where: { id: req.company.id },
            select: {
                id: true,
                name: true,
                email: true,
                matriculeFiscal: true,
                registreCommerce: true,
                address: true,
                phone: true,
                rib: true,
                createdAt: true,
            }
        });
        res.status(200).json(company);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;
