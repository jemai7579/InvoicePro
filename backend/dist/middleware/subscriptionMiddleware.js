"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInvoiceQuota = exports.checkPlan = void 0;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Middleware to check if the company's plan is in the list of allowed plans
 */
const checkPlan = (allowedPlans) => {
    return async (req, res, next) => {
        try {
            const companyId = req.company.id;
            const company = await prisma_1.default.company.findUnique({
                where: { id: companyId },
                include: { subscription: true }
            });
            if (!company || !company.subscription) {
                return res.status(403).json({
                    message: "Abonnement requis. Veuillez passer au forfait Professional pour accéder à cette fonctionnalité."
                });
            }
            if (!allowedPlans.includes(company.subscription.plan)) {
                return res.status(403).json({
                    message: `Cette fonctionnalité est réservée aux plans : ${allowedPlans.join(', ')}.`
                });
            }
            next();
        }
        catch (error) {
            console.error('Error in checkPlan middleware:', error);
            res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'abonnement' });
        }
    };
};
exports.checkPlan = checkPlan;
/**
 * Middleware to check if the company has reached its monthly invoice limit
 */
const checkInvoiceQuota = async (req, res, next) => {
    try {
        const companyId = req.company.id;
        const company = await prisma_1.default.company.findUnique({
            where: { id: companyId },
            include: { subscription: true }
        });
        if (!company) {
            return res.status(404).json({ message: 'Compte introuvable' });
        }
        // Default to STARTER if no subscription exists
        const plan = company.subscription?.plan || 'STARTER';
        if (plan === 'STARTER') {
            const startOfMonth = new Date();
            startOfMonth.setHours(0, 0, 0, 0);
            startOfMonth.setDate(1);
            const usedInvoices = await prisma_1.default.invoice.count({
                where: {
                    companyId: companyId,
                    createdAt: { gte: startOfMonth }
                }
            });
            if (usedInvoices >= 7) {
                return res.status(403).json({
                    message: "Votre quota mensuel Starter (7 factures) est épuisé. Attendez le mois prochain ou passez à Professional pour une facturation illimitée."
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Error in checkInvoiceQuota middleware:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification du quota' });
    }
};
exports.checkInvoiceQuota = checkInvoiceQuota;
