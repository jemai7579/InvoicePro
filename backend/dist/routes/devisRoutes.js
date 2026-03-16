"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const devisController_1 = require("../controllers/devisController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.route('/')
    .get(authMiddleware_1.protect, devisController_1.getDevis)
    .post(authMiddleware_1.protect, devisController_1.createDevis);
router.route('/:id')
    .get(authMiddleware_1.protect, devisController_1.getDevisById)
    .put(authMiddleware_1.protect, devisController_1.updateDevisStatus)
    .delete(authMiddleware_1.protect, devisController_1.deleteDevis);
router.post('/:id/convert', authMiddleware_1.protect, devisController_1.convertDevisToInvoice);
exports.default = router;
