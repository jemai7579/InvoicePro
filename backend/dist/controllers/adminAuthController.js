"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminProfile = exports.adminLogin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const jwtSecret_1 = require("../utils/jwtSecret");
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await prisma_1.default.admin.findUnique({
            where: { email },
        });
        if (admin && (await bcryptjs_1.default.compare(password, admin.password))) {
            const token = jsonwebtoken_1.default.sign({ id: admin.id, role: 'admin' }, (0, jwtSecret_1.getJwtSecret)(), { expiresIn: '30d' });
            // Log activity
            await prisma_1.default.activityLog.create({
                data: {
                    adminId: admin.id,
                    action: 'LOGIN',
                    details: `Connexion réussie de ${admin.email}`,
                },
            });
            res.json({
                success: true,
                data: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    token,
                }
            });
        }
        else {
            // Log failed attempt if admin exists
            if (admin) {
                await prisma_1.default.activityLog.create({
                    data: {
                        adminId: admin.id,
                        action: 'LOGIN_FAILED',
                        details: `Échec de connexion pour ${admin.email}`,
                    },
                });
            }
            res.status(401).json({ success: false, message: 'Identifiants administrateur invalides' });
        }
    }
    catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.adminLogin = adminLogin;
const getAdminProfile = async (req, res) => {
    const admin = req.admin;
    if (admin) {
        res.json({
            success: true,
            data: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
            }
        });
    }
    else {
        res.status(404).json({ success: false, message: 'Admin not found' });
    }
};
exports.getAdminProfile = getAdminProfile;
