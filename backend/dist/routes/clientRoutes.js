"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientController_1 = require("../controllers/clientController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.route('/')
    .get(authMiddleware_1.protect, clientController_1.getClients)
    .post(authMiddleware_1.protect, clientController_1.createClient);
router.route('/:id')
    .get(authMiddleware_1.protect, clientController_1.getClientById)
    .put(authMiddleware_1.protect, clientController_1.updateClient)
    .delete(authMiddleware_1.protect, clientController_1.deleteClient);
exports.default = router;
