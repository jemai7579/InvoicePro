"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuthController_1 = require("../controllers/adminAuthController");
const adminController_1 = require("../controllers/adminController");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const adminValidator_1 = require("../validators/adminValidator");
const router = express_1.default.Router();
// Public routes for admin
router.post('/login', adminValidator_1.loginValidator, validationMiddleware_1.validateRequest, adminAuthController_1.adminLogin);
// Protected routes for admin
router.use(adminMiddleware_1.adminProtect);
router.get('/profile', adminAuthController_1.getAdminProfile);
router.get('/stats', adminController_1.getGlobalStats);
// Companies
router.get('/companies', adminController_1.getCompanies);
router.put('/companies/:id/status', adminController_1.updateCompanyStatus);
// Invoices
router.get('/all-invoices', adminController_1.getAllInvoices);
// Subscriptions
router.get('/subscriptions', adminController_1.getSubscriptions);
// System Settings
router.get('/settings', adminController_1.getSystemSettings);
router.put('/settings/:id', adminValidator_1.updateSettingValidator, validationMiddleware_1.validateRequest, adminController_1.updateSystemSetting);
// Logs & Notifications
router.get('/logs', adminController_1.getAdminLogs);
router.post('/notifications', adminValidator_1.notificationValidator, validationMiddleware_1.validateRequest, adminController_1.sendGlobalNotification);
exports.default = router;
