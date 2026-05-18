import dotenv from 'dotenv';
dotenv.config();

// ── Startup environment validation ────────────────────────────────────────────
// Fail immediately with a clear message if required variables are missing.
// This prevents the app from starting in a broken/insecure state.
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error('\n❌  FATAL: Missing required environment variables:');
  missingVars.forEach((v) => console.error(`   • ${v}`));
  console.error('\n   Copy backend/.env.example to backend/.env and fill in the values.\n');
  process.exit(1);
}

// Warn about optional integrations that are not configured
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set — AI Assistant feature will return a 503 response.');
}
if (!process.env.TTN_API_URL || !process.env.TTN_API_KEY) {
  console.warn('⚠️  TTN_API_URL / TTN_API_KEY not set — TTN submission will run in simulation mode.');
}
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('⚠️  SMTP credentials not set — email sending will use Ethereal test accounts (dev only).');
}

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
import projectRoutes from './routes/projectRoutes';

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

// Security 3: Rate Limiting
const isProd = process.env.NODE_ENV === 'production';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// General limiter for all API routes
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProd ? 100 : 10000,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter limiter for login endpoints — brute-force protection
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProd ? 10 : 10000,
  message: { success: false, message: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);

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
app.use('/api/projects', projectRoutes);

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
