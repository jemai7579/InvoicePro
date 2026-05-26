import {
  getEInvoiceConfig,
  getSignatureConfigured,
  getTeifConfigured,
  getTTNConfigured,
} from '../services/einvoiceConfig';

const weakJwtSecrets = new Set([
  'secret',
  'secret123',
  'replace_with_strong_secret',
  'change_me_use_a_long_random_secret_here',
  'changeme',
]);

const hasStrongJwtSecret = (value?: string) =>
  Boolean(
    value &&
      value.length >= 48 &&
      !weakJwtSecrets.has(value.toLowerCase()) &&
      !/(replace|change[_-]?me|changeme|development[_-]?only|example)/i.test(value)
  );

export const validateStartupEnvironment = () => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const appEnv = (process.env.APP_ENV || nodeEnv).toLowerCase();
  const isProduction = nodeEnv === 'production' || appEnv === 'production';
  const databaseUrl = process.env.DATABASE_URL || '';

  if (!databaseUrl) {
    errors.push('DATABASE_URL is required.');
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push('DATABASE_URL must be a PostgreSQL URL.');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required.');
  } else if (!hasStrongJwtSecret(process.env.JWT_SECRET)) {
    const message = 'JWT_SECRET must be a unique random secret of at least 48 characters.';
    if (isProduction) errors.push(message);
    else warnings.push(message);
  }

  if (isProduction) {
    if (nodeEnv !== 'production') errors.push('NODE_ENV must be production when APP_ENV=production.');
    if (appEnv !== 'production') errors.push('APP_ENV must be production when NODE_ENV=production.');
    if (!process.env.FRONTEND_URL) errors.push('FRONTEND_URL is required in production for CORS.');
  }

  let eInvoiceConfig;
  try {
    eInvoiceConfig = getEInvoiceConfig();
  } catch (error: any) {
    errors.push(error.message);
  }

  if (isProduction && eInvoiceConfig?.isProductionMode) {
    if (!getTeifConfigured()) errors.push('TEIF_XSD_PATH and TEIF_SCHEMA_VERSION must reference the official production XSD.');
    if (!getSignatureConfigured()) errors.push('A real signature provider must be configured for production e-invoicing.');
    if (!getTTNConfigured()) errors.push('Official TTN endpoints and credentials must be configured for production e-invoicing.');
  }

  if (errors.length) {
    throw new Error(`Startup configuration is invalid:\n- ${errors.join('\n- ')}`);
  }
  if (!eInvoiceConfig) {
    throw new Error('Startup configuration is invalid: e-invoice configuration could not be loaded.');
  }

  return { warnings, eInvoiceConfig };
};
