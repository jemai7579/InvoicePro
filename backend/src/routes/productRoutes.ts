import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, importProducts, getProductImage } from '../controllers/productController';
import { protect } from '../middleware/authMiddleware';

const router = Router();
const uploadDir = path.resolve(process.cwd(), 'uploads/product-images');
fs.ensureDirSync(uploadDir);

const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const allowedImageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype) || !allowedImageExtensions.has(path.extname(file.originalname).toLowerCase())) {
      cb(new Error('Unsupported image type'));
      return;
    }
    cb(null, true);
  },
});

router.route('/')
  .get(protect, getProducts)
  .post(protect, upload.single('image'), createProduct);

router.post('/import', protect, importProducts);
router.get('/:id/image', protect, getProductImage);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, upload.single('image'), updateProduct)
  .delete(protect, deleteProduct);

export default router;
