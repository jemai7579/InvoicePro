"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = require("../controllers/invoiceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.route('/')
    .get(authMiddleware_1.protect, invoiceController_1.getInvoices)
    .post(authMiddleware_1.protect, invoiceController_1.createInvoice);
router.route('/:id')
    .get(authMiddleware_1.protect, invoiceController_1.getInvoiceById)
    .delete(authMiddleware_1.protect, invoiceController_1.deleteInvoice);
router.route('/:id/pdf')
    .get(authMiddleware_1.protect, invoiceController_1.getInvoicePdf);
router.route('/:id/xml')
    .get(authMiddleware_1.protect, invoiceController_1.getInvoiceXml);
router.route('/:id/send-email')
    .post(authMiddleware_1.protect, invoiceController_1.sendInvoiceEmailController);
router.route('/:id/submit-ttn')
    .post(authMiddleware_1.protect, invoiceController_1.submitToTTNController);
router.route('/:id/status')
    .patch(authMiddleware_1.protect, invoiceController_1.updateInvoiceStatus);
router.post('/import-xml', authMiddleware_1.protect, upload.single('xml'), invoiceController_1.importInvoiceXml);
exports.default = router;
