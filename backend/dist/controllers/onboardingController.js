"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOnboardingRequest = exports.getSignatureProviderOptions = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getSignatureProviderOptions = async (_req, res) => {
    try {
        const stored = await prisma_1.default.signatureProviderOption.findMany({ orderBy: { name: 'asc' } });
        if (stored.length > 0)
            return res.status(200).json(stored);
        res.status(200).json([
            {
                id: 'static-e-houwiya',
                name: 'E-Houwiya / Huwaya ID',
                targetUsers: 'Entrepreneurs, freelances, TPE et petites entreprises.',
                costDescription: 'Identite numerique, usage signature et tarification a verifier officiellement.',
                difficulty: 'EASY',
                setupInstructions: 'E-Houwiya / Mobile ID peut etre une etape d identification numerique, un chemin possible de signature ou une partie du parcours d adhesion pour entrepreneurs. Verifier votre statut, la procedure officielle, la compatibilite TTN, les prix et les conditions avant toute utilisation production.',
                status: 'NEEDS_VERIFICATION',
            },
            {
                id: 'static-tuntrust',
                name: 'TunTrust / ANCE certificate',
                targetUsers: 'PME, societes et utilisateurs avec besoins formels de certificat.',
                costDescription: 'Cout certificat, renouvellement et procedure fournisseur a verifier.',
                difficulty: 'MEDIUM',
                setupInstructions: 'La plateforme permet deja l upload de certificat et la signature mock. La signature reelle TunTrust / ANCE reste TODO et necessite validation fournisseur, protocole, certificat et exigences TTN.',
                status: 'PLANNED',
            },
            {
                id: 'static-hers',
                name: 'HERS ou autre type de signature',
                targetUsers: 'Cas a confirmer avec les exigences officielles.',
                costDescription: 'Documentation, prix et conditions a verifier.',
                difficulty: 'UNKNOWN',
                setupInstructions: 'TODO: verifier officiellement la documentation, la tarification, le parcours d onboarding et la compatibilite TTN.',
                status: 'NEEDS_VERIFICATION',
            },
            {
                id: 'static-trust-provider',
                name: 'Service provider / tiers de confiance',
                targetUsers: 'Platform owner, software editor, technical provider, or companies wanting delegated support.',
                costDescription: 'Selon contrat, volume, procedure TTN et accord fournisseur.',
                difficulty: 'HARD',
                setupInstructions: 'Peut necessiter une procedure TTN separee, acces API, accord fournisseur, validation officielle et responsabilites techniques specifiques.',
                status: 'NEEDS_VERIFICATION',
            },
        ]);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getSignatureProviderOptions = getSignatureProviderOptions;
const createOnboardingRequest = async (req, res) => {
    try {
        const company = req.company;
        const { name, companyName, email, phone, needType, message } = req.body;
        if (!name || !companyName || !email || !needType) {
            return res.status(400).json({ message: 'Name, company, email and need type are required.' });
        }
        const request = await prisma_1.default.onboardingRequest.create({
            data: {
                companyId: company?.id || null,
                name,
                companyName,
                email,
                phone: phone || null,
                needType,
                message: message || null,
            },
        });
        res.status(201).json(request);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createOnboardingRequest = createOnboardingRequest;
