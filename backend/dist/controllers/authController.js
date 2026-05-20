"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../prisma"));
const jwtSecret_1 = require("../utils/jwtSecret");
const auditTrailService_1 = require("../services/auditTrailService");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, (0, jwtSecret_1.getJwtSecret)(), { expiresIn: '30d' });
};
const ALLOWED_REGISTRATION_PLANS = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
const isDevelopment = process.env.NODE_ENV !== 'production';
const normalizeRegistrationPlan = (plan) => {
    const value = String(plan || '').trim().toUpperCase();
    if (!value)
        return 'STARTER';
    if (value === 'PRO')
        return 'PROFESSIONAL';
    if (value === 'MAX')
        return 'ENTERPRISE';
    if (ALLOWED_REGISTRATION_PLANS.includes(value))
        return value;
    return null;
};
const register = async (req, res) => {
    try {
        const { email, password, name, firstName, lastName, matriculeFiscal, registreCommerce, address, phone, rib, plan } = req.body;
        if (isDevelopment) {
            const { password: _password, ...safeBody } = req.body;
            console.log('REGISTER BODY:', safeBody);
        }
        const requiredFields = { email, password, name, firstName, lastName, matriculeFiscal, address, phone };
        const missingField = Object.entries(requiredFields).find(([, value]) => !String(value || '').trim())?.[0];
        if (missingField) {
            return res.status(400).json({ message: `Champ obligatoire manquant: ${missingField}` });
        }
        const selectedPlan = normalizeRegistrationPlan(plan);
        if (!selectedPlan) {
            return res.status(400).json({ message: 'Formule d’abonnement invalide.', error: 'Invalid subscription plan' });
        }
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
            return res.status(400).json({ message: 'Un compte avec cet email existe déjà.' });
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
                        plan: selectedPlan,
                        status: 'ACTIVE'
                    }
                }
            },
        });
        if (company) {
            // Fetch company with subscription for consistent response
            const companyWithSub = await prisma_1.default.company.findUnique({
                where: { id: company.id },
                include: { subscription: true }
            });
            res.status(201).json({
                id: company.id,
                name: company.name,
                email: company.email,
                subscription: companyWithSub?.subscription,
                token: generateToken(company.id),
            });
        }
        else {
            res.status(400).json({ message: 'Invalid company data' });
        }
    }
    catch (error) {
        console.error('REGISTER ERROR:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(400).json({ message: 'Un compte avec cet email existe déjà.' });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({
                message: 'Une valeur unique existe déjà.',
                ...(isDevelopment ? { error: error.message, target: error.meta?.target } : {})
            });
        }
        if (['P2021', 'P2022'].includes(error.code)) {
            return res.status(500).json({
                message: 'Database migration is not applied.',
                ...(isDevelopment ? { error: error.message, code: error.code } : {})
            });
        }
        res.status(500).json({
            message: 'Server error',
            ...(isDevelopment ? { error: error.message, code: error.code } : {})
        });
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
            (0, auditTrailService_1.logActivity)({
                companyId: company.id,
                actorId: company.id,
                actorType: 'COMPANY',
                actionType: 'LOGIN',
                objectType: 'AUTH',
                objectId: company.id,
                message: 'Connexion utilisateur réussie.',
                metadata: { email: company.email },
                ...(0, auditTrailService_1.getRequestAuditMeta)(req),
            }).catch((auditError) => console.error('LOGIN AUDIT ERROR:', auditError));
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
        const companyId = req.company.id;
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            include: {
                subscription: true,
            }
        });
        if (!company) {
            return res.status(404).json({ message: 'Compte introuvable' });
        }
        // Fallback logic for missing subscription or old names
        let subscription = company.subscription;
        if (!subscription) {
            subscription = await prisma_1.default.subscription.create({
                data: {
                    companyId: companyId,
                    plan: 'STARTER',
                    status: 'ACTIVE'
                }
            });
        }
        else if (subscription.plan === 'FREE' || subscription.plan === 'PRO') {
            // Migrate old plan names on the fly
            const newPlan = subscription.plan === 'FREE' ? 'STARTER' : 'PROFESSIONAL';
            subscription = await prisma_1.default.subscription.update({
                where: { id: subscription.id },
                data: { plan: newPlan }
            });
        }
        // Dynamic month count
        const startOfMonth = new Date();
        startOfMonth.setHours(0, 0, 0, 0);
        startOfMonth.setDate(1);
        const usedInvoicesThisMonth = await prisma_1.default.invoice.count({
            where: {
                companyId: companyId,
                createdAt: { gte: startOfMonth }
            }
        });
        const plan = subscription.plan;
        const monthlyInvoiceLimit = plan === 'STARTER' ? 7 : Infinity;
        const remainingInvoices = plan === 'STARTER' ? Math.max(0, 7 - usedInvoicesThisMonth) : 999999; // Using high number for infinity as JSON literal
        res.status(200).json({
            ...company,
            password: undefined, // ensure password is not sent
            subscription: {
                plan: subscription.plan,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                monthlyInvoiceLimit,
                usedInvoicesThisMonth,
                remainingInvoices,
                aiEnabled: plan !== 'STARTER',
                reportsEnabled: plan !== 'STARTER'
            }
        });
    }
    catch (error) {
        console.error('Error in getMe:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
exports.getMe = getMe;
