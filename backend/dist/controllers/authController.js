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
        const { email, password, name, firstName, lastName, matriculeFiscal, registreCommerce, address, phone, rib, plan: requestedPlan } = req.body;
        const validPlans = ['starter', 'professional', 'enterprise'];
        const plan = validPlans.includes(requestedPlan) ? requestedPlan : 'starter';
        // Validation Matricule Fiscal Tunisien (ex: 1234567/X/A/P/000)
        // Validation Matricule Fiscal Tunisien (ex: 1234567/X/A/P/000)
        const mfRegex = /^\d{7,8}\/[A-Z]\/[A-Z]\/[A-Z]\/\d{3}$/;
        if (!mfRegex.test(matriculeFiscal)) {
            return res.status(400).json({ message: 'Format Matricule Fiscal invalide. Exemple: 1234567/X/A/M/000' });
        }
        // Validation Téléphone Tunisien (8 chiffres ou avec +216)
        const phoneRegex = /^(\+216)?\s?\d{8}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Format numéro de téléphone invalide.' });
        }
        const companyExists = await prisma_1.default.company.findUnique({
            where: { email },
        });
        if (companyExists) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const company = await prisma_1.default.company.create({
            data: {
                email,
                password: hashedPassword,
                name,
                firstName,
                lastName,
                matriculeFiscal,
                registreCommerce,
                address,
                phone,
                rib,
                subscription: {
                    create: {
                        plan: plan,
                        status: 'ACTIVE'
                    }
                }
            },
            include: {
                subscription: true
            }
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
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
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
                subscription: true,
            }
        });
        res.status(200).json(company);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMe = getMe;
