import { Router } from 'express';
import { getConversations, getMessagesWithPartner, sendPartnerMessage } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/conversations', protect, getConversations);
router.get('/:partnerCompanyId', protect, getMessagesWithPartner);
router.post('/', protect, sendPartnerMessage);

export default router;
