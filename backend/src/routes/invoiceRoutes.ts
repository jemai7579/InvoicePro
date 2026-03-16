import { Router } from 'express';
import { getInvoices, getInvoiceById, createInvoice,
  deleteInvoice,
  getInvoicePdf,
  getInvoiceXml,
  sendInvoiceEmailController,
  submitToTTNController
} from '../controllers/invoiceController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

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

export default router;
