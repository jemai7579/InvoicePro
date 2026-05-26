import express from 'express';
import { adminLogin, getAdminProfile } from '../controllers/adminAuthController';
import {
  getGlobalStats,
  getCompanies,
  updateCompanyStatus,
  updateCompanyDossierStatus,
  getAllInvoices,
  getSubscriptions,
  getSystemSettings,
  updateSystemSetting,
  getTvaRates,
  upsertTvaRate,
  getIntegrationsStatus,
  updateIntegration,
  testIntegration,
  getAdminLogs,
  exportAdminLogsCsv,
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
  getSystemHealth,
  upsertSystemErrorController,
  addCompanyAdminNote,
  addUserAdminNote,
  resetCompanyQuota,
  getAdminAnalyticsOverview,
  getAdminAnalyticsPages,
  getAdminAnalyticsReferrers,
  getAdminAnalyticsEvents,
  getSearchConsole,
  getSeoPagesAudit,
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
router.put('/companies/:id/dossier-status', updateCompanyDossierStatus);
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
router.get('/system-health', getSystemHealth);
router.post('/system-errors', upsertSystemErrorController);
router.put('/system-errors/:id', upsertSystemErrorController);

// System Settings
router.get('/settings', getSystemSettings);
router.put('/settings/:id', updateSettingValidator, validateRequest, updateSystemSetting);
router.get('/tva-rates', getTvaRates);
router.post('/tva-rates', upsertTvaRate);
router.put('/tva-rates/:id', upsertTvaRate);
router.get('/integrations/status', getIntegrationsStatus);
router.put('/integrations/:id', updateIntegration);
router.post('/integrations/:id/test', testIntegration);

// Analytics & SEO
router.get('/analytics/overview', getAdminAnalyticsOverview);
router.get('/analytics/pages', getAdminAnalyticsPages);
router.get('/analytics/referrers', getAdminAnalyticsReferrers);
router.get('/analytics/events', getAdminAnalyticsEvents);
router.get('/seo/search-console', getSearchConsole);
router.get('/seo/pages-audit', getSeoPagesAudit);

// Logs & Notifications
router.get('/logs', getAdminLogs);
router.get('/activity-logs', getAdminLogs);
router.get('/activity-logs/export.csv', exportAdminLogsCsv);
router.post('/notifications', notificationValidator, validateRequest, sendGlobalNotification);

export default router;
