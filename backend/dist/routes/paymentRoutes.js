"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
router.route('/').get(authMiddleware_1.protect, paymentController_1.getPayments).post(authMiddleware_1.protect, paymentController_1.createPayment);
router.route('/:id').get(authMiddleware_1.protect, paymentController_1.getPaymentById).put(authMiddleware_1.protect, paymentController_1.updatePayment).delete(authMiddleware_1.protect, paymentController_1.deletePayment);
exports.default = router;
