"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Protect the AI route so only logged in users can use it
router.route('/chat').post(authMiddleware_1.protect, aiController_1.handleAiChat);
exports.default = router;
