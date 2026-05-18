"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsController_1 = require("../controllers/reportsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const subscriptionMiddleware_1 = require("../middleware/subscriptionMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.protect, (0, subscriptionMiddleware_1.checkPlan)(['PROFESSIONAL', 'ENTERPRISE']), reportsController_1.getDashboardReports);
exports.default = router;
