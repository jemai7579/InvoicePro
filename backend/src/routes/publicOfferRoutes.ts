import { Router } from 'express';
import { getPublicOffer, respondToPublicOffer } from '../controllers/offerController';

const router = Router();

router.get('/offers/:token', getPublicOffer);
router.post('/offers/:token/respond', respondToPublicOffer);

export default router;

