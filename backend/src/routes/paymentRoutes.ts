import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { createPayment, deletePayment, getPaymentById, getPayments, updatePayment } from '../controllers/paymentController';

const router = Router();

router.route('/').get(protect, getPayments).post(protect, createPayment);
router.route('/:id').get(protect, getPaymentById).put(protect, updatePayment).delete(protect, deletePayment);

export default router;

