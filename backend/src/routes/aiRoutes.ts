import { Router } from 'express';
import { handleAiChat } from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';
import { checkPlan } from '../middleware/subscriptionMiddleware';

const router = Router();

// Protect the AI route so only logged in users with valid plan can use it
router.route('/chat').post(protect, checkPlan(['PROFESSIONAL', 'ENTERPRISE']), handleAiChat);

export default router;

