"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const offerController_1 = require("../controllers/offerController");
const router = (0, express_1.Router)();
router.get('/offers/:token', offerController_1.getPublicOffer);
router.post('/offers/:token/respond', offerController_1.respondToPublicOffer);
exports.default = router;
