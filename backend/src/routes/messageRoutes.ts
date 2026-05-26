import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import {
  downloadMessageFile,
  getConversations,
  getMessagesWithPartner,
  sendPartnerMessage,
  uploadMessageFile,
} from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = Router();
const uploadDir = path.resolve(process.cwd(), 'uploads/message-attachments');
fs.ensureDirSync(uploadDir);

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);
const allowedExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.doc', '.docx', '.xlsx', '.xls', '.ppt', '.pptx']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
      cb(new Error('Unsupported file type'));
      return;
    }
    cb(null, true);
  },
});

router.get('/conversations', protect, getConversations);
router.get('/attachments/:messageId', protect, downloadMessageFile);
router.get('/:partnerCompanyId', protect, getMessagesWithPartner);
router.post('/', protect, sendPartnerMessage);
router.post('/file', protect, upload.single('file'), uploadMessageFile);

export default router;
