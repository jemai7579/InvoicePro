"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const subscriptionMiddleware_1 = require("../middleware/subscriptionMiddleware");
const router = (0, express_1.Router)();
// Protect the AI route so only logged in users with valid plan can use it
router.route('/chat').post(authMiddleware_1.protect, (0, subscriptionMiddleware_1.checkPlan)(['PROFESSIONAL', 'ENTERPRISE']), aiController_1.handleAiChat);
exports.default = router;
