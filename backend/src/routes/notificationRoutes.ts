import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
} from '../controllers/notificationController';

const router = Router();

router.get('/',              protect, getNotifications);
router.get('/unread-count',  protect, getUnreadCount);
router.patch('/read-all',    protect, markAllRead);
router.post('/read-all',     protect, markAllRead);
router.patch('/:id/read',   protect, markAsRead);
router.post('/:id/read',    protect, markAsRead);

export default router;
