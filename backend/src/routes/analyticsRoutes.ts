import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { postAnalyticsEvent } from '../controllers/analyticsController';

const router = express.Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  // Drop excess telemetry quietly instead of surfacing a site-blocking error.
  handler: (_req, res) => res.status(202).json({ success: true }),
});

router.post('/event', analyticsLimiter, postAnalyticsEvent);

export default router;
