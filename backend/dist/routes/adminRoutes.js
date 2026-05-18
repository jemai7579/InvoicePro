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
router.get('/overview', adminController_1.getGlobalStats);
// Companies
router.get('/companies', adminController_1.getCompanies);
router.get('/companies/:id', adminController_1.getCompanyById);
router.put('/companies/:id/status', adminController_1.updateCompanyStatus);
router.put('/companies/:id/plan', adminController_1.updateCompanyPlan);
router.post('/companies/:id/reset-quota', adminController_1.resetCompanyQuota);
router.post('/companies/:id/notes', adminController_1.addCompanyAdminNote);
router.delete('/companies/:id', adminController_1.deleteCompany);
// Users
router.get('/users', adminController_1.getPlatformUsers);
router.post('/users/:id/notes', adminController_1.addUserAdminNote);
// Invoices
router.get('/all-invoices', adminController_1.getAllInvoices);
router.get('/invoices', adminController_1.getAllInvoices);
// TTN and compliance
router.get('/ttn', adminController_1.getTtnMonitoring);
router.get('/compliance', adminController_1.getComplianceOverview);
// Subscriptions
router.get('/subscriptions', adminController_1.getSubscriptions);
// Payments
router.get('/payments', adminController_1.getPaymentsOverview);
router.post('/payments', adminController_1.upsertPayment);
router.put('/payments/:id', adminController_1.upsertPayment);
// Support
router.get('/support', adminController_1.getSupportOverview);
router.post('/support', adminController_1.createSupportTicket);
router.put('/support/:id', adminController_1.updateSupportTicket);
router.post('/support/:id/reply', adminController_1.replySupportTicket);
// System errors
router.get('/system-errors', adminController_1.getSystemErrors);
router.post('/system-errors', adminController_1.upsertSystemErrorController);
router.put('/system-errors/:id', adminController_1.upsertSystemErrorController);
// System Settings
router.get('/settings', adminController_1.getSystemSettings);
router.put('/settings/:id', adminValidator_1.updateSettingValidator, validationMiddleware_1.validateRequest, adminController_1.updateSystemSetting);
// Logs & Notifications
router.get('/logs', adminController_1.getAdminLogs);
router.get('/activity-logs', adminController_1.getAdminLogs);
router.post('/notifications', adminValidator_1.notificationValidator, validationMiddleware_1.validateRequest, adminController_1.sendGlobalNotification);
exports.default = router;
