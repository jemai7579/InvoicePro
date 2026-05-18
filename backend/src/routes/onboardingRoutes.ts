import { Router } from 'express';
import { createOnboardingRequest, getSignatureProviderOptions } from '../controllers/onboardingController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/signature-providers', getSignatureProviderOptions);
router.post('/requests', createOnboardingRequest);
router.post('/protected-requests', protect, createOnboardingRequest);

export default router;

