import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { createCompanySupportTicket, getCompanySupportTicket, listCompanySupportTickets, replyCompanySupportTicket } from '../controllers/supportController';

const router = express.Router();

router.use(protect);

router.get('/tickets', listCompanySupportTickets);
router.post('/tickets', createCompanySupportTicket);
router.get('/tickets/:id', getCompanySupportTicket);
router.post('/tickets/:id/reply', replyCompanySupportTicket);

export default router;
