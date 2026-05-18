"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = require("express-rate-limit");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const devisRoutes_1 = __importDefault(require("./routes/devisRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security 1: Helmet
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
// Security 2: CORS (Strict)
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// Security 3: Rate Limiting
const isProd = process.env.NODE_ENV === 'production';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
// General limiter for all API routes
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: isProd ? 100 : 10000,
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Stricter limiter for login endpoints — brute-force protection
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: isProd ? 10 : 10000,
    message: { success: false, message: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.resolve('uploads')));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/clients', clientRoutes_1.default);
app.use('/api/devis', devisRoutes_1.default);
app.use('/api/invoices', invoiceRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, status: 'OK' });
});
// Security 4: Handle 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
// Final: Global Error Handler
app.use(errorMiddleware_1.errorHandler);
const server = app.listen(PORT, () => {
    console.log(`🚀 Server hardened and running on port ${PORT}`);
});
// Process Reliability
process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION! Shutting down...');
    console.error(err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});
