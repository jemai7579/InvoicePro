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

// Companies
router.get('/companies', getCompanies);
router.put('/companies/:id/status', updateCompanyStatus);

// Invoices
router.get('/all-invoices', getAllInvoices);

// Subscriptions
router.get('/subscriptions', getSubscriptions);

// System Settings
router.get('/settings', getSystemSettings);
router.put('/settings/:id', updateSettingValidator, validateRequest, updateSystemSetting);

// Logs & Notifications
router.get('/logs', getAdminLogs);
router.post('/notifications', notificationValidator, validateRequest, sendGlobalNotification);

export default router;
