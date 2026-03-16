"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = require("../controllers/invoiceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
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
exports.default = router;
