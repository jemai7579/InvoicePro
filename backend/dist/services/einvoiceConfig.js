"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertProductionTTNConfigured = exports.assertProductionSignatureConfigured = exports.assertProductionTeifValidationConfigured = exports.getEInvoiceReadiness = exports.getCompanyDossierStatus = exports.getTTNConfigured = exports.getSignatureConfigured = exports.getTeifConfigured = exports.assertNoMockInProduction = exports.getEInvoiceConfig = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const allowedAppEnvs = ['development', 'test', 'production'];
const allowedModes = ['mock', 'sandbox', 'production'];
const readAppEnv = () => {
    const value = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
    if (!allowedAppEnvs.includes(value)) {
        throw new Error(`INVALID_APP_ENV: APP_ENV must be one of ${allowedAppEnvs.join(', ')}`);
    }
    return value;
};
const readEInvoiceMode = () => {
    const value = (process.env.E_INVOICE_MODE || process.env.TTN_MODE || 'mock').toLowerCase();
    if (!allowedModes.includes(value)) {
        throw new Error(`INVALID_E_INVOICE_MODE: E_INVOICE_MODE must be one of ${allowedModes.join(', ')}`);
    }
    return value;
};
const getEInvoiceConfig = () => {
    const appEnv = readAppEnv();
    const mode = readEInvoiceMode();
    if (appEnv === 'production' && mode === 'mock') {
        throw new Error('INVALID_E_INVOICE_CONFIGURATION: E_INVOICE_MODE=mock is not allowed when APP_ENV=production.');
    }
    return {
        appEnv,
        mode,
        isMockMode: mode === 'mock',
        isSandboxMode: mode === 'sandbox',
        isProductionMode: mode === 'production',
    };
};
exports.getEInvoiceConfig = getEInvoiceConfig;
const assertNoMockInProduction = (operation) => {
    const config = (0, exports.getEInvoiceConfig)();
    if (config.appEnv === 'production' && config.mode === 'mock') {
        throw new Error(`MOCK_NOT_ALLOWED_IN_PRODUCTION: ${operation} cannot run in mock mode in production.`);
    }
};
exports.assertNoMockInProduction = assertNoMockInProduction;
const getTeifConfigured = () => {
    const xsdPath = process.env.TEIF_XSD_PATH;
    return Boolean(process.env.TEIF_SCHEMA_VERSION && xsdPath && fs_extra_1.default.existsSync(xsdPath));
};
exports.getTeifConfigured = getTeifConfigured;
const getSignatureConfigured = () => {
    const provider = (process.env.SIGNATURE_PROVIDER || 'mock').toLowerCase();
    if (provider === 'mock')
        return (0, exports.getEInvoiceConfig)().isMockMode;
    if (provider === 'hsm')
        return Boolean(process.env.SIGNATURE_HSM_URL && process.env.SIGNATURE_HSM_TOKEN);
    return Boolean(process.env.SIGNATURE_CERT_PATH && process.env.SIGNATURE_CERT_PASSWORD);
};
exports.getSignatureConfigured = getSignatureConfigured;
const getTTNConfigured = () => Boolean(process.env.TTN_BASE_URL &&
    process.env.TTN_AUTH_ENDPOINT &&
    process.env.TTN_SUBMIT_INVOICE_ENDPOINT &&
    process.env.TTN_STATUS_ENDPOINT &&
    (process.env.TTN_API_KEY ||
        (process.env.TTN_CLIENT_ID && process.env.TTN_CLIENT_SECRET) ||
        (process.env.TTN_USERNAME && process.env.TTN_PASSWORD)));
exports.getTTNConfigured = getTTNConfigured;
const getCompanyDossierStatus = (company) => {
    if (!company) {
        return {
            status: 'incomplete',
            complete: false,
            missingFields: ['Company profile'],
        };
    }
    const requiredFields = [
        ['name', 'Raison sociale'],
        ['email', 'Email'],
        ['firstName', 'Representant legal - prenom'],
        ['lastName', 'Representant legal - nom'],
        ['matriculeFiscal', 'Matricule fiscal'],
        ['address', 'Adresse'],
        ['city', 'Ville'],
        ['zipCode', 'Code postal'],
        ['country', 'Pays'],
        ['phone', 'Telephone'],
    ];
    const missingFields = requiredFields
        .filter(([key]) => !String(company[key] || '').trim())
        .map(([, label]) => label);
    return {
        status: missingFields.length ? 'incomplete' : 'ready_for_test',
        complete: missingFields.length === 0,
        missingFields,
    };
};
exports.getCompanyDossierStatus = getCompanyDossierStatus;
const getEInvoiceReadiness = (company) => {
    const config = (0, exports.getEInvoiceConfig)();
    const teifConfigured = (0, exports.getTeifConfigured)();
    const signatureConfigured = (0, exports.getSignatureConfigured)();
    const ttnConfigured = (0, exports.getTTNConfigured)();
    const dossier = (0, exports.getCompanyDossierStatus)(company);
    const missingRequirements = [];
    if (!teifConfigured)
        missingRequirements.push('Official TTN TEIF XSD not configured');
    if (!signatureConfigured)
        missingRequirements.push('Signature provider not configured');
    if (!ttnConfigured)
        missingRequirements.push('TTN API credentials missing');
    if (!dossier.complete)
        missingRequirements.push(`Company dossier incomplete: ${dossier.missingFields.join(', ')}`);
    return {
        mode: config.mode,
        appEnv: config.appEnv,
        teifConfigured,
        signatureConfigured,
        ttnConfigured,
        companyDossierStatus: dossier.status,
        companyDossierComplete: dossier.complete,
        companyDossierMissingFields: dossier.missingFields,
        canIssueLegalInvoices: config.isProductionMode && teifConfigured && signatureConfigured && ttnConfigured && dossier.complete,
        missingRequirements,
    };
};
exports.getEInvoiceReadiness = getEInvoiceReadiness;
const assertProductionTeifValidationConfigured = () => {
    if ((0, exports.getEInvoiceConfig)().isProductionMode && !(0, exports.getTeifConfigured)()) {
        throw new Error('TEIF_XSD_NOT_CONFIGURED: Please configure the official TTN TEIF XSD before production use.');
    }
};
exports.assertProductionTeifValidationConfigured = assertProductionTeifValidationConfigured;
const assertProductionSignatureConfigured = () => {
    const config = (0, exports.getEInvoiceConfig)();
    if (config.isProductionMode && !(0, exports.getSignatureConfigured)()) {
        throw new Error("Impossible de signer : la signature électronique n'est pas configurée.");
    }
};
exports.assertProductionSignatureConfigured = assertProductionSignatureConfigured;
const assertProductionTTNConfigured = () => {
    const config = (0, exports.getEInvoiceConfig)();
    if ((config.isProductionMode || config.isSandboxMode) && !(0, exports.getTTNConfigured)()) {
        throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
    }
};
exports.assertProductionTTNConfigured = assertProductionTTNConfigured;
