"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProtect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const jwtSecret_1 = require("../utils/jwtSecret");
const adminProtect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, (0, jwtSecret_1.getJwtSecret)());
            // Recherche dans la table Admin au lieu de Company
            const admin = await prisma_1.default.admin.findUnique({
                where: { id: decoded.id },
            });
            if (!admin) {
                return res.status(401).json({ message: 'Not authorized as admin' });
            }
            req.admin = admin;
            next();
        }
        catch (error) {
            console.error('Admin Auth Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
exports.adminProtect = adminProtect;
