"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = require("../controllers/invoiceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const subscriptionMiddleware_1 = require("../middleware/subscriptionMiddleware");
const permissionMiddleware_1 = require("../middleware/permissionMiddleware");
const multer_1 = __importDefault(require("multer"));
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.route('/')
    .get(authMiddleware_1.protect, invoiceController_1.getInvoices)
    .post(authMiddleware_1.protect, (0, permissionMiddleware_1.requireCompanyRole)(['admin', 'accountant'], 'création de facture'), subscriptionMiddleware_1.checkInvoiceQuota, invoiceController_1.createInvoice);
router.route('/:id')
    .get(authMiddleware_1.protect, invoiceController_1.getInvoiceById)
    .put(authMiddleware_1.protect, invoiceController_1.updateInvoice)
    .delete(authMiddleware_1.protect, invoiceController_1.deleteInvoice);
router.route('/:id/pdf')
    .get(authMiddleware_1.protect, invoiceController_1.getInvoicePdf);
router.route('/:id/final-pdf')
    .get(authMiddleware_1.protect, invoiceController_1.getFinalInvoicePdf);
router.route('/:id/xml')
    .get(authMiddleware_1.protect, invoiceController_1.getInvoiceXml);
router.route('/:id/validate-teif')
    .post(authMiddleware_1.protect, invoiceController_1.validateInvoiceTeifController);
router.route('/:id/generate-teif')
    .post(authMiddleware_1.protect, (0, permissionMiddleware_1.requireCompanyRole)(['admin', 'accountant'], 'génération TEIF'), invoiceController_1.generateInvoiceTeifController);
router.route('/:id/sign-teif')
    .post(authMiddleware_1.protect, (0, permissionMiddleware_1.requireEInvoicePermission)('sign'), invoiceController_1.signInvoiceTeifController);
router.route('/:id/send-email')
    .post(authMiddleware_1.protect, invoiceController_1.sendInvoiceEmailController);
router.route('/:id/submit-ttn')
    .post(authMiddleware_1.protect, (0, permissionMiddleware_1.requireEInvoicePermission)('submit-ttn'), invoiceController_1.submitToTTNController);
router.route('/:id/check-ttn-status')
    .post(authMiddleware_1.protect, invoiceController_1.checkTTNStatusController);
router.route('/:id/status')
    .patch(authMiddleware_1.protect, invoiceController_1.updateInvoiceStatus);
router.route('/:id/payments')
    .get(authMiddleware_1.protect, paymentController_1.getInvoicePayments)
    .post(authMiddleware_1.protect, paymentController_1.createInvoicePayment);
router.post('/import-xml', authMiddleware_1.protect, subscriptionMiddleware_1.checkInvoiceQuota, upload.single('xml'), invoiceController_1.importInvoiceXml);
exports.default = router;
