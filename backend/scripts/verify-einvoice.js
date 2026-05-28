const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const env = process.env;
const mode = (env.E_INVOICE_MODE || env.TTN_MODE || 'mock').toLowerCase();
const appEnv = (env.APP_ENV || env.NODE_ENV || 'development').toLowerCase();
const isProduction = appEnv === 'production' || env.NODE_ENV === 'production';
const errors = [];
const warnings = [];

const requireEnv = (name) => {
  if (!String(env[name] || '').trim()) errors.push(`${name} is required.`);
};

if (!['mock', 'sandbox', 'production'].includes(mode)) errors.push('E_INVOICE_MODE must be mock, sandbox, or production.');
if (isProduction && mode === 'mock') errors.push('E_INVOICE_MODE=mock is forbidden in production.');

requireEnv('DATABASE_URL');
requireEnv('JWT_SECRET');
if (isProduction) requireEnv('FRONTEND_URL');

const hasXsd = Boolean(env.TEIF_XSD_PATH && fs.existsSync(path.resolve(env.TEIF_XSD_PATH)));
const hasSignature =
  env.SIGNATURE_PROVIDER && env.SIGNATURE_PROVIDER !== 'mock' &&
  ((env.SIGNATURE_CERT_PATH && env.SIGNATURE_CERT_PASSWORD) || (env.SIGNATURE_HSM_URL && env.SIGNATURE_HSM_TOKEN));
const hasTtn =
  env.TTN_BASE_URL &&
  env.TTN_AUTH_ENDPOINT &&
  env.TTN_SUBMIT_INVOICE_ENDPOINT &&
  env.TTN_STATUS_ENDPOINT &&
  (env.TTN_API_KEY || (env.TTN_CLIENT_ID && env.TTN_CLIENT_SECRET) || (env.TTN_USERNAME && env.TTN_PASSWORD));

if (mode === 'production') {
  if (!hasXsd) errors.push('Production e-invoice mode requires TEIF_XSD_PATH pointing to an existing official XSD.');
  if (!hasSignature) errors.push('Production e-invoice mode requires a real signature provider/certificate or HSM.');
  if (!hasTtn) errors.push('Production e-invoice mode requires official TTN endpoints and credentials.');
} else {
  if (!hasXsd) warnings.push('Official TEIF XSD is not configured; official validation is blocked.');
  if (!hasSignature) warnings.push('Real signature provider is not configured; legal signature is blocked.');
  if (!hasTtn) warnings.push('TTN API is not configured; real TTN submission is blocked.');
}

const sensitiveStatic = read('src/index.ts');
if (sensitiveStatic.includes("app.use('/uploads'")) errors.push('Sensitive uploads must not be exposed as a static directory.');
if (!sensitiveStatic.includes("app.use('/uploads/logos'")) warnings.push('Logo-only static route not found.');

const routes = read('src/routes/invoiceRoutes.ts');
['generate-teif', 'sign-teif', 'submit-ttn', 'check-ttn-status', '/:id/xml', '/:id/pdf'].forEach((needle) => {
  if (!routes.includes(needle)) errors.push(`Invoice route missing: ${needle}`);
});

const schema = read('prisma/schema.prisma');
['teifXmlPath', 'signedXmlPath', 'signatureStatus', 'ttnReference', 'legalStatus', 'paymentStatus'].forEach((field) => {
  if (!schema.includes(field)) errors.push(`Prisma schema missing invoice field: ${field}`);
});

const combined = [
  read('src/services/ttnProvider.ts'),
  read('src/services/teifWorkflowService.ts'),
  read('src/utils/pdfGenerator.ts'),
].join('\n');

[
  'MOCK-SUB',
  'MOCK TTN ACCEPTED',
  'ttn_simulation_accepted_non_legal',
  'Signature simulee',
].forEach((needle) => {
  if (!combined.includes(needle)) warnings.push(`Expected safety marker not found: ${needle}`);
});

if (exists('../frontend/src')) {
  const frontendRoot = path.resolve(root, '..', 'frontend', 'src');
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(jsx?|tsx?)$/.test(entry.name)) files.push(full);
    }
  };
  walk(frontendRoot);
  const dangerous = files
    .map((file) => [file, fs.readFileSync(file, 'utf8')])
    .filter(([, text]) => /legally accepted by TTN|real TTN validated|legal signature completed/i.test(text));
  if (dangerous.length) errors.push(`Dangerous legal wording found in frontend: ${dangerous.map(([file]) => path.relative(frontendRoot, file)).join(', ')}`);
}

console.log(`E-invoice verification: appEnv=${appEnv}, mode=${mode}`);
warnings.forEach((warning) => console.warn(`WARNING: ${warning}`));
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('E-invoice verification passed. Legal production use still requires official TTN and real signature validation.');
