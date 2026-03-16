import { Router } from 'express';
import { getDashboardReports } from '../controllers/reportsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getDashboardReports);

export default router;
