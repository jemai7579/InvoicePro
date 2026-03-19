import { Router } from 'express';
import { getInvoices, getInvoiceById, createInvoice,
  deleteInvoice,
  getInvoicePdf,
  getInvoiceXml,
  sendInvoiceEmailController,
  submitToTTNController,
  updateInvoiceStatus,
  importInvoiceXml
} from '../controllers/invoiceController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.route('/')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route('/:id')
  .get(protect, getInvoiceById)
  .delete(protect, deleteInvoice);

router.route('/:id/pdf')
  .get(protect, getInvoicePdf);

router.route('/:id/xml')
  .get(protect, getInvoiceXml);

router.route('/:id/send-email')
  .post(protect, sendInvoiceEmailController);

router.route('/:id/submit-ttn')
  .post(protect, submitToTTNController);

router.route('/:id/status')
  .patch(protect, updateInvoiceStatus);

router.post('/import-xml', protect, upload.single('xml'), importInvoiceXml);

export default router;
