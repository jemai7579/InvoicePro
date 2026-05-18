import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { getAuditTrail, getAuditTrailForObject } from '../controllers/auditTrailController';

const router = Router();

router.get('/', protect, getAuditTrail);
router.get('/:objectType/:objectId', protect, getAuditTrailForObject);

export default router;

