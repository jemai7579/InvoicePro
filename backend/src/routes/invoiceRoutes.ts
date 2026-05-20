import { Router } from 'express';
import { getInvoices, getInvoiceById, createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicePdf,
  getFinalInvoicePdf,
  getInvoiceXml,
  generateInvoiceTeifController,
  validateInvoiceTeifController,
  signInvoiceTeifController,
  sendInvoiceEmailController,
  submitToTTNController,
  checkTTNStatusController,
  updateInvoiceStatus,
  importInvoiceXml
} from '../controllers/invoiceController';
import { protect } from '../middleware/authMiddleware';
import { checkInvoiceQuota } from '../middleware/subscriptionMiddleware';
import { requireCompanyRole, requireEInvoicePermission } from '../middleware/permissionMiddleware';
import multer from 'multer';
import { createInvoicePayment, getInvoicePayments } from '../controllers/paymentController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.route('/')
  .get(protect, getInvoices)
  .post(protect, requireCompanyRole(['admin', 'accountant'], 'création de facture'), checkInvoiceQuota, createInvoice);

router.route('/:id')
  .get(protect, getInvoiceById)
  .put(protect, updateInvoice)
  .delete(protect, deleteInvoice);

router.route('/:id/pdf')
  .get(protect, getInvoicePdf);

router.route('/:id/final-pdf')
  .get(protect, getFinalInvoicePdf);

router.route('/:id/xml')
  .get(protect, getInvoiceXml);

router.route('/:id/validate-teif')
  .post(protect, validateInvoiceTeifController);

router.route('/:id/generate-teif')
  .post(protect, requireCompanyRole(['admin', 'accountant'], 'génération TEIF'), generateInvoiceTeifController);

router.route('/:id/sign-teif')
  .post(protect, requireEInvoicePermission('sign'), signInvoiceTeifController);

router.route('/:id/send-email')
  .post(protect, sendInvoiceEmailController);

router.route('/:id/submit-ttn')
  .post(protect, requireEInvoicePermission('submit-ttn'), submitToTTNController);

router.route('/:id/check-ttn-status')
  .post(protect, checkTTNStatusController);

router.route('/:id/status')
  .patch(protect, updateInvoiceStatus);

router.route('/:id/payments')
  .get(protect, getInvoicePayments)
  .post(protect, createInvoicePayment);

router.post('/import-xml', protect, checkInvoiceQuota, upload.single('xml'), importInvoiceXml);

export default router;
