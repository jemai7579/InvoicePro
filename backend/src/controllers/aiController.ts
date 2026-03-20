import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with the key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handleAiChat = async (req: Request, res: Response) => {
  try {
    const { message, contextHistory } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI Assistant is currently unavailable due to missing API configuration.' });
    }

    // Get the basic generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `Vous êtes "El Fatoura AI", l'assistant expert de la plateforme El Fatoura (fatoora.tn).
    Votre mission est d'aider les entreprises tunisiennes dans leur transition vers la facturation électronique.
    
    Expertise Clé :
    1. Plateforme El Fatoura : Création de factures, devis (demandes), gestion des clients et produits.
    2. Réglementation Tunisienne : 
       - TEIF (Format XML standard pour la Tunisie).
       - TTN (Tunisie TradeNet) : Processus d'envoi et de validation.
       - Droit de Timbre : 1.000 TND obligatoire sur les factures (sauf exonération).
       - Matricule Fiscal : Format tunisien strict.
    3. Workflow : Demande → Acceptation → Conversion en Facture → Signature → Envoi TTN.

    Directives de réponse :
    - Soyez extrêmement professionnel, précis et concis.
    - Utilisez un ton encourageant pour les entrepreneurs.
    - Répondez exclusivement en Français.
    - Si l'utilisateur pose une question technique sur le XML, expliquez que El Fatoura gère cela automatiquement selon les normes UBL/TEIF.
    `;

    // Construct the prompt with some history if provided
    let prompt = systemPrompt + "\n\n";
    if (contextHistory && Array.isArray(contextHistory)) {
        prompt += "Chat History:\n";
        contextHistory.forEach(msg => {
            prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
        });
    }
    prompt += `\nUser's Request: ${message}\nAssistant:`;

    // Generate content
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.status(200).json({ reply: responseText });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ message: 'Failed to generate AI response. ' + (error.message || '') });
  }
};
