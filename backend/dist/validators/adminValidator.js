"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationValidator = exports.updateSettingValidator = exports.loginValidator = void 0;
const express_validator_1 = require("express-validator");
exports.loginValidator = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Veuillez fournir un email valide').normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];
exports.updateSettingValidator = [
    (0, express_validator_1.body)('value').notEmpty().withMessage('La valeur ne peut pas être vide'),
];
exports.notificationValidator = [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Le titre est obligatoire'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('Le contenu du message est obligatoire'),
];
