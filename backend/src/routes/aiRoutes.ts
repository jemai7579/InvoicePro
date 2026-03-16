import { Router } from 'express';
import { handleAiChat } from '../controllers/aiController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Protect the AI route so only logged in users can use it
router.route('/chat').post(protect, handleAiChat);

export default router;
