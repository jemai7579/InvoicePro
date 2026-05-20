"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const auditTrailController_1 = require("../controllers/auditTrailController");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.protect, auditTrailController_1.getAuditTrail);
router.get('/:objectType/:objectId', authMiddleware_1.protect, auditTrailController_1.getAuditTrailForObject);
exports.default = router;
