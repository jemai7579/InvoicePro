import { Router } from 'express';
import { getActiveTvaRates } from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getActiveTvaRates);

export default router;
