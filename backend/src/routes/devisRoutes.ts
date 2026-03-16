import { Router } from 'express';
import { getDevis, getDevisById, createDevis, deleteDevis, convertDevisToInvoice, updateDevisStatus, getDevisPdf, sendDevisEmailController } from '../controllers/devisController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/')
  .get(protect, getDevis)
  .post(protect, createDevis);

router.route('/:id')
  .get(protect, getDevisById)
  .put(protect, updateDevisStatus)
  .delete(protect, deleteDevis);

router.post('/:id/convert', protect, convertDevisToInvoice);

router.route('/:id/pdf')
  .get(protect, getDevisPdf);

router.route('/:id/send-email')
  .post(protect, sendDevisEmailController);

export default router;
