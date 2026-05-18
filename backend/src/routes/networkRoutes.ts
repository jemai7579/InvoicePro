import { Router } from 'express';
import {
  createPlatformInvitation,
  getNetworkOverview,
  respondToPlatformInvitation,
  shareWithPartner,
} from '../controllers/networkController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getNetworkOverview);
router.post('/invitations', protect, createPlatformInvitation);
router.post('/invitations/:id/respond', protect, respondToPlatformInvitation);
router.post('/share', protect, shareWithPartner);

export default router;
