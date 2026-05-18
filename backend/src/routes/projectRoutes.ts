import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  createProject,
  getProjects,
  getReceivedProjects,
  respondToProject,
  sendProject,
  updateProject,
} from '../controllers/projectController';

const router = Router();

router.get('/', protect, getProjects);
router.get('/received', protect, getReceivedProjects);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.post('/:id/send', protect, sendProject);
router.post('/:id/respond', protect, respondToProject);

export default router;
