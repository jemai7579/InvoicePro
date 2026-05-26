import { Router } from 'express';
import { getOpportunitySummary } from '../controllers/opportunityController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/summary', protect, getOpportunitySummary);

export default router;
