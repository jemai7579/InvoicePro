import dotenv from 'dotenv';
dotenv.config();
import { validateStartupEnvironment } from './config/validateEnvironment';

try {
  const { warnings, eInvoiceConfig } = validateStartupEnvironment();
  warnings.forEach((warning) => console.warn(`WARNING: ${warning}`));
  console.log(`E-invoice mode: ${eInvoiceConfig.mode} (${eInvoiceConfig.appEnv})`);
} catch (error: any) {
  console.error(`FATAL: ${error.message}`);
  process.exit(1);
}

const isProdEnv = process.env.NODE_ENV === 'production';

// Warn about optional integrations that are not configured
if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY not set; AI Assistant will return a 503 response.');
}
if (!process.env.TTN_BASE_URL || !process.env.TTN_SUBMIT_INVOICE_ENDPOINT) {
  console.warn('WARNING: TTN API endpoints not set; TTN submission is available only in mock mode.');
}
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('WARNING: SMTP credentials not set; email sending uses development behavior only.');
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
import offerRoutes from './routes/offerRoutes';
import publicOfferRoutes from './routes/publicOfferRoutes';
import paymentRoutes from './routes/paymentRoutes';
import auditTrailRoutes from './routes/auditTrailRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import networkRoutes from './routes/networkRoutes';
import messageRoutes from './routes/messageRoutes';
import supportRoutes from './routes/supportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import tvaRateRoutes from './routes/tvaRateRoutes';
import opportunityRoutes from './routes/opportunityRoutes';

import { errorHandler } from './middleware/errorMiddleware';

const app = express();
const PORT = process.env.PORT || 5005;

// Security 1: Helmet
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Security 2: CORS (strict in production, Vite-friendly in development)
const parseAllowedOrigins = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = parseAllowedOrigins();
const isLocalDevOrigin = (origin: string) =>
  !isProdEnv && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Security 3: Rate Limiting
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// General limiter for all API routes
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProdEnv ? 100 : 10000,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter limiter for login endpoints — brute-force protection
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProdEnv ? 10 : 10000,
  message: { success: false, message: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);

app.use(express.json());
// Only logos are public assets. Compliance artifacts such as TEIF XML, signed XML,
// PDFs, certificates, and TTN proofs must be served through authenticated routes.
app.use('/uploads/logos', express.static(path.resolve('uploads/logos')));

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
app.use('/api/offers', offerRoutes);
app.use('/api/public', publicOfferRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/audit-trail', auditTrailRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tva-rates', tvaRateRoutes);
app.use('/api/opportunities', opportunityRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'InvoicePro API is running' });
});

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
  console.log(`Server running on port ${PORT}`);
});

// Process Reliability
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION: Shutting down.');
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
  console.error('UNCAUGHT EXCEPTION: Shutting down.');
  console.error(err.name, err.message);
  process.exit(1);
});
