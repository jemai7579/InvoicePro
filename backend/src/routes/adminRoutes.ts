import express from 'express';
import { adminLogin, getAdminProfile } from '../controllers/adminAuthController';
import {
  getGlobalStats,
  getCompanies,
  updateCompanyStatus,
  getAllInvoices,
  getSubscriptions,
  getSystemSettings,
  updateSystemSetting,
  getAdminLogs,
  sendGlobalNotification,
  deleteCompany,
  updateCompanyPlan,
  getCompanyById,
  getPlatformUsers,
  getTtnMonitoring,
  getComplianceOverview,
  getPaymentsOverview,
  upsertPayment,
  getSupportOverview,
  createSupportTicket,
  updateSupportTicket,
  replySupportTicket,
  getSystemErrors,
  upsertSystemErrorController,
  addCompanyAdminNote,
  addUserAdminNote,
  resetCompanyQuota,
} from '../controllers/adminController';
import { adminProtect } from '../middleware/adminMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { 
  loginValidator, 
  updateSettingValidator, 
  notificationValidator 
} from '../validators/adminValidator';

const router = express.Router();

// Public routes for admin
router.post('/login', loginValidator, validateRequest, adminLogin);

// Protected routes for admin
router.use(adminProtect);

router.get('/profile', getAdminProfile);
router.get('/stats', getGlobalStats);
router.get('/overview', getGlobalStats);

// Companies
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id/status', updateCompanyStatus);
router.put('/companies/:id/plan', updateCompanyPlan);
router.post('/companies/:id/reset-quota', resetCompanyQuota);
router.post('/companies/:id/notes', addCompanyAdminNote);
router.delete('/companies/:id', deleteCompany);

// Users
router.get('/users', getPlatformUsers);
router.post('/users/:id/notes', addUserAdminNote);

// Invoices
router.get('/all-invoices', getAllInvoices);
router.get('/invoices', getAllInvoices);

// TTN and compliance
router.get('/ttn', getTtnMonitoring);
router.get('/compliance', getComplianceOverview);

// Subscriptions
router.get('/subscriptions', getSubscriptions);

// Payments
router.get('/payments', getPaymentsOverview);
router.post('/payments', upsertPayment);
router.put('/payments/:id', upsertPayment);

// Support
router.get('/support', getSupportOverview);
router.post('/support', createSupportTicket);
router.put('/support/:id', updateSupportTicket);
router.post('/support/:id/reply', replySupportTicket);

// System errors
router.get('/system-errors', getSystemErrors);
router.post('/system-errors', upsertSystemErrorController);
router.put('/system-errors/:id', upsertSystemErrorController);

// System Settings
router.get('/settings', getSystemSettings);
router.put('/settings/:id', updateSettingValidator, validateRequest, updateSystemSetting);

// Logs & Notifications
router.get('/logs', getAdminLogs);
router.get('/activity-logs', getAdminLogs);
router.post('/notifications', notificationValidator, validateRequest, sendGlobalNotification);

export default router;
