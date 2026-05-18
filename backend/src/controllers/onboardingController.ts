import { Request, Response } from 'express';
import prisma from '../prisma';

export const getSignatureProviderOptions = async (_req: Request, res: Response) => {
  try {
    const stored = await prisma.signatureProviderOption.findMany({ orderBy: { name: 'asc' } });
    if (stored.length > 0) return res.status(200).json(stored);

    res.status(200).json([
      {
        id: 'static-e-houwiya',
        name: 'E-Houwiya / Huwaya ID',
        targetUsers: 'Entrepreneurs, freelances, TPE et petites entreprises.',
        costDescription: 'Modele de cout et tarification a verifier officiellement.',
        difficulty: 'EASY',
        setupInstructions: 'Parcours probablement plus simple pour certains profils. Verifier la compatibilite TTN, les prix et les conditions officielles avant toute utilisation production. Digigo / E-Houwiya peut etre etudie comme chemin d accompagnement, sans integration active declaree.',
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createOnboardingRequest = async (req: Request, res: Response) => {
  try {
    const company = (req as any).company;
    const { name, companyName, email, phone, needType, message } = req.body;
    if (!name || !companyName || !email || !needType) {
      return res.status(400).json({ message: 'Name, company, email and need type are required.' });
    }

    const request = await prisma.onboardingRequest.create({
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
