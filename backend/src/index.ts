import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import devisRoutes from './routes/devisRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import productRoutes from './routes/productRoutes';
import settingsRoutes from './routes/settingsRoutes';
import reportRoutes from './routes/reportRoutes';
import aiRoutes from './routes/aiRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';

import { errorHandler } from './middleware/errorMiddleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Security 1: Helmet
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Security 2: CORS (Strict)
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Security 3: Rate Limiting (General)
const isProd = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 10000, // Much higher limit in dev (10k requests / 15min)
  message: { 
    success: false, 
    message: isProd 
      ? 'Too many requests from this IP, please try again after 15 minutes.' 
      : 'DEV MODE: Rate limit reached (Threshold: 10000). Restart server to reset.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd && process.env.DISABLE_RATE_LIMIT === 'true', // Option to disable via env
});
app.use('/api', limiter);

app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'OK' });
});

// Security 4: Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Final: Global Error Handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server hardened and running on port ${PORT}`);
});

// Process Reliability
process.on('unhandledRejection', (err: any) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  if (server) {
    server.close(() => {
        process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err: Error) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
