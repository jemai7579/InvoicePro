"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const devisRoutes_1 = __importDefault(require("./routes/devisRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use('/api/clients', clientRoutes_1.default);
app.use('/api/devis', devisRoutes_1.default);
app.use('/api/invoices', invoiceRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
