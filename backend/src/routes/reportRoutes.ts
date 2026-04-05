import { Router } from 'express';
import { getDashboardReports } from '../controllers/reportsController';
import { protect } from '../middleware/authMiddleware';
import { checkPlan } from '../middleware/subscriptionMiddleware';

const router = Router();

router.get('/', protect, checkPlan(['PROFESSIONAL', 'ENTERPRISE']), getDashboardReports);

export default router;

