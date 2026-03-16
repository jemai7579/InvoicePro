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

    // Define the system instructions context for El Fatoora AI
    const systemPrompt = `Vous êtes un assistant virtuel professionnel et utile pour "El Fatoora", une plateforme de facturation électronique pour les entreprises en Tunisie.
    Votre travail est d'assister l'utilisateur en répondant aux questions liées à la création de factures, de devis, l'intégration TTN (Tunisie TradeNet), le XML TEIF, et l'utilisation générale de l'application.
    Gardez vos réponses concises, amicales, structurées et exclusivement en français. Vous devez guider l'utilisateur étape par étape si nécessaire.
    Répondez au dernier message de l'utilisateur en fonction de ce contexte.
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
