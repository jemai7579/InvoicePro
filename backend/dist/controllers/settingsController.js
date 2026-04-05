"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLogo = exports.uploadCertificate = exports.updateSettings = exports.getSettings = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getSettings = async (req, res) => {
    try {
        const company = await prisma_1.default.company.findUnique({
            where: { id: req.company.id },
            select: {
                id: true,
                email: true,
                name: true,
                matriculeFiscal: true,
                registreCommerce: true,
                address: true,
                city: true,
                zipCode: true,
                country: true,
                phone: true,
                rib: true,
                logo: true,
                createdAt: true,
                updatedAt: true,
                subscription: true,
            }
        });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json(company);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const { name, matriculeFiscal, registreCommerce, address, city, zipCode, country, phone, rib, logo, newPassword, currentPassword } = req.body;
        const companyId = req.company.id;
        // Build update data — only include fields that were actually sent
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (matriculeFiscal !== undefined)
            updateData.matriculeFiscal = matriculeFiscal;
        // ... other fields ...
        if (registreCommerce !== undefined)
            updateData.registreCommerce = registreCommerce;
        if (address !== undefined)
            updateData.address = address;
        if (city !== undefined)
            updateData.city = city;
        if (zipCode !== undefined)
            updateData.zipCode = zipCode;
        if (country !== undefined)
            updateData.country = country;
        if (phone !== undefined)
            updateData.phone = phone;
        if (rib !== undefined)
            updateData.rib = rib;
        if (logo !== undefined)
            updateData.logo = logo;
        // Password change logic
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Le mot de passe actuel est requis pour changer votre mot de passe.' });
            }
            // Fetch the actual current password hash
            const company = await prisma_1.default.company.findUnique({
                where: { id: companyId },
                select: { password: true }
            });
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }
            // Compare
            const isMatch = await bcryptjs_1.default.compare(currentPassword, company.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Le mot de passe actuel est incorrect.' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            updateData.password = await bcryptjs_1.default.hash(newPassword, salt);
        }
        const updatedCompany = await prisma_1.default.company.update({
            where: { id: companyId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                matriculeFiscal: true,
                registreCommerce: true,
                address: true,
                city: true,
                zipCode: true,
                country: true,
                phone: true,
                rib: true,
                logo: true
            }
        });
        res.status(200).json(updatedCompany);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateSettings = updateSettings;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const uploadCertificate = async (req, res) => {
    try {
        const { password } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'Certificate file (.p12) is required' });
        }
        if (!password) {
            // Remove uploaded file if password not provided
            await fs_extra_1.default.remove(file.path);
            return res.status(400).json({ message: 'Certificate password is required' });
        }
        // Move file to a permanent secure location (e.g., /uploads/certificates)
        const ext = path_1.default.extname(file.originalname);
        if (ext.toLowerCase() !== '.p12' && ext.toLowerCase() !== '.pfx') {
            await fs_extra_1.default.remove(file.path);
            return res.status(400).json({ message: 'Only .p12 or .pfx files are allowed' });
        }
        const companyId = req.company.id;
        const uploadDir = path_1.default.resolve('uploads/certificates');
        await fs_extra_1.default.ensureDir(uploadDir);
        const newFileName = `cert_${companyId}_${Date.now()}${ext}`;
        const newPath = path_1.default.join(uploadDir, newFileName);
        await fs_extra_1.default.move(file.path, newPath, { overwrite: true });
        // Update Company Record
        await prisma_1.default.company.update({
            where: { id: companyId },
            data: {
                certificatePath: newPath,
                certificatePassword: password // In a real prod app, encrypt this or store safely
            }
        });
        res.status(200).json({ message: 'Certificate uploaded successfully' });
    }
    catch (error) {
        console.error('Upload Error:', error);
        if (req.file) {
            await fs_extra_1.default.remove(req.file.path).catch(console.error);
        }
        res.status(500).json({ message: 'Server error during certificate upload' });
    }
};
exports.uploadCertificate = uploadCertificate;
const uploadLogo = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'Logo image is required' });
        }
        const companyId = req.company.id;
        const uploadDir = path_1.default.resolve('uploads/logos');
        await fs_extra_1.default.ensureDir(uploadDir);
        const ext = path_1.default.extname(file.originalname);
        const newFileName = `logo_${companyId}_${Date.now()}${ext}`;
        const newPath = path_1.default.join(uploadDir, newFileName);
        await fs_extra_1.default.move(file.path, newPath, { overwrite: true });
        const logoUrl = `/uploads/logos/${newFileName}`;
        await prisma_1.default.company.update({
            where: { id: companyId },
            data: { logo: logoUrl }
        });
        res.status(200).json({ message: 'Logo uploaded successfully', logo: logoUrl });
    }
    catch (error) {
        console.error('Upload Error:', error);
        if (req.file) {
            await fs_extra_1.default.remove(req.file.path).catch(console.error);
        }
        res.status(500).json({ message: 'Server error during logo upload' });
    }
};
exports.uploadLogo = uploadLogo;
