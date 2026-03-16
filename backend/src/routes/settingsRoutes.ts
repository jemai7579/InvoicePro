import { Router } from 'express';
import { getSettings, updateSettings, uploadCertificate, uploadLogo } from '../controllers/settingsController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/temp/' });

router.route('/')
  .get(protect, getSettings)
  .put(protect, updateSettings);

router.post('/certificate', protect, upload.single('certificate'), uploadCertificate);
router.post('/logo', protect, upload.single('logo'), uploadLogo);

export default router;
