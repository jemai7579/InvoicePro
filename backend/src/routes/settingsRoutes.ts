import { Router } from 'express';
import { getSettings, updateSettings, uploadCertificate, uploadLogo, getSettingsHistory, getEInvoiceStatus } from '../controllers/settingsController';
import { protect } from '../middleware/authMiddleware';
import { requireCompanyRole } from '../middleware/permissionMiddleware';
import multer from 'multer';
import path from 'path';

const router = Router();
const baseUploadOptions = {
  dest: 'uploads/temp/',
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
};
const logoMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const logoExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const certificateMimeTypes = new Set(['application/x-pkcs12', 'application/pkcs12', 'application/octet-stream']);
const certificateExtensions = new Set(['.p12', '.pfx']);
const logoUpload = multer({
  ...baseUploadOptions,
  fileFilter: (req, file, cb) => {
    if (logoMimeTypes.has(file.mimetype) && logoExtensions.has(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, or WEBP logo images are allowed.') as any, false);
    }
  }
});
const certificateUpload = multer({
  ...baseUploadOptions,
  fileFilter: (req, file, cb) => {
    if (certificateMimeTypes.has(file.mimetype) && certificateExtensions.has(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PKCS#12 certificate files (.p12 or .pfx) are allowed.') as any, false);
    }
  }
});

router.route('/')
  .get(protect, getSettings)
  .put(protect, requireCompanyRole(['admin'], 'configuration des paramètres'), updateSettings);

router.post('/certificate', protect, requireCompanyRole(['admin'], 'configuration de la signature électronique'), certificateUpload.single('certificate'), uploadCertificate);
router.post('/logo', protect, logoUpload.single('logo'), uploadLogo);
router.get('/history', protect, getSettingsHistory);
router.get('/einvoice/status', protect, getEInvoiceStatus);

export default router;
