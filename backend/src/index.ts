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
import dashboardRoutes from './routes/dashboardRoutes';

import { errorHandler } from './middleware/errorMiddleware';

const app = express();
const PORT = process.env.PORT || 5005;

// cPanel/Passenger terminates the public connection before forwarding it here.
// Trust its single proxy hop so rate limiting uses the visitor IP from X-Forwarded-For.
app.set('trust proxy', 1);

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
const positiveIntegerFromEnv = (name: string, fallback: number) => {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// Do not throttle normal API traffic by shared proxy IP. Login failure protection is
// persisted by the auth controllers, and AI use is limited by monthly company quota.
// Only account creation keeps a soft IP-based anti-spam guard.
const registerLimiter = rateLimit({
  windowMs: positiveIntegerFromEnv('REGISTER_RATE_LIMIT_WINDOW_MINUTES', 60) * 60 * 1000,
  max: positiveIntegerFromEnv('REGISTER_RATE_LIMIT_MAX', 20),
  handler: (req, res, _next, options) => {
    const resetTime = (req as any).rateLimit?.resetTime?.getTime();
    const retryAfter = resetTime
      ? Math.max(1, Math.ceil((resetTime - Date.now()) / 1000))
      : Math.max(1, Math.ceil(options.windowMs / 1000));
    res.status(options.statusCode).json({
      message: 'Too many registration attempts. Please wait a few minutes and try again.',
      code: 'REGISTER_RATE_LIMITED',
      retryAfter,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.post('/api/auth/register', registerLimiter);

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
app.use('/api/dashboard', dashboardRoutes);

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
