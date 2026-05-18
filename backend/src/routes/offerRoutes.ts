import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  convertOfferToDevis,
  convertOfferToInvoice,
  createOffer,
  deleteOffer,
  getOfferById,
  getOffers,
  sendOffer,
  updateOffer,
} from '../controllers/offerController';

const router = Router();

router.route('/').get(protect, getOffers).post(protect, createOffer);
router.route('/:id').get(protect, getOfferById).put(protect, updateOffer).delete(protect, deleteOffer);
router.post('/:id/send', protect, sendOffer);
router.post('/:id/convert-to-devis', protect, convertOfferToDevis);
router.post('/:id/convert-to-invoice', protect, convertOfferToInvoice);

export default router;

