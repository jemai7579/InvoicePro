import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientInvitations,
  createClientInvitation,
  respondToClientInvitation,
  importClients
} from '../controllers/clientController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/invitations', protect, getClientInvitations);
router.post('/invitations', protect, createClientInvitation);
router.post('/invitations/:id/respond', protect, respondToClientInvitation);
router.post('/import', protect, importClients);

router.route('/')
  .get(protect, getClients)
  .post(protect, createClient);

router.route('/:id')
  .get(protect, getClientById)
  .put(protect, updateClient)
  .delete(protect, deleteClient);

export default router;
