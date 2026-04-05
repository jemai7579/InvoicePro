import { body } from 'express-validator';

export const loginValidator = [
  body('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

export const updateSettingValidator = [
  body('value').notEmpty().withMessage('La valeur ne peut pas être vide'),
];

export const notificationValidator = [
  body('title').notEmpty().withMessage('Le titre est obligatoire'),
  body('message').notEmpty().withMessage('Le contenu du message est obligatoire'),
];
