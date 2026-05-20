import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { postAnalyticsEvent } from '../controllers/analyticsController';

const router = express.Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many analytics events' },
});

router.post('/event', analyticsLimiter, postAnalyticsEvent);

export default router;
