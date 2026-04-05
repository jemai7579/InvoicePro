"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    dest: 'uploads/temp/',
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.originalname.match(/\.(p12|pfx)$/i)) {
            cb(null, true);
        }
        else {
            cb(new Error('Format non supporté'), false);
        }
    }
});
router.route('/')
    .get(authMiddleware_1.protect, settingsController_1.getSettings)
    .put(authMiddleware_1.protect, settingsController_1.updateSettings);
router.post('/certificate', authMiddleware_1.protect, upload.single('certificate'), settingsController_1.uploadCertificate);
router.post('/logo', authMiddleware_1.protect, upload.single('logo'), settingsController_1.uploadLogo);
exports.default = router;
