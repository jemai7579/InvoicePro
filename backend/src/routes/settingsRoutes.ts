import { Router } from 'express';
import { getSettings, updateSettings, uploadCertificate, uploadLogo, getSettingsHistory, getEInvoiceStatus } from '../controllers/settingsController';
import { protect } from '../middleware/authMiddleware';
import { requireCompanyRole } from '../middleware/permissionMiddleware';
import multer from 'multer';

const router = Router();
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.originalname.match(/\.(p12|pfx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté') as any, false);
    }
  }
});

router.route('/')
  .get(protect, getSettings)
  .put(protect, requireCompanyRole(['admin'], 'configuration des paramètres'), updateSettings);

router.post('/certificate', protect, requireCompanyRole(['admin'], 'configuration de la signature électronique'), upload.single('certificate'), uploadCertificate);
router.post('/logo', protect, upload.single('logo'), uploadLogo);
router.get('/history', protect, getSettingsHistory);
router.get('/einvoice/status', protect, getEInvoiceStatus);

export default router;
