import fs from 'fs-extra';

export type AppEnv = 'development' | 'test' | 'production';
export type EInvoiceMode = 'mock' | 'sandbox' | 'production';

const allowedAppEnvs: AppEnv[] = ['development', 'test', 'production'];
const allowedModes: EInvoiceMode[] = ['mock', 'sandbox', 'production'];
const isNodeProduction = () => (process.env.NODE_ENV || '').toLowerCase() === 'production';

const readAppEnv = (): AppEnv => {
  const value = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase() as AppEnv;
  if (!allowedAppEnvs.includes(value)) {
    throw new Error(`INVALID_APP_ENV: APP_ENV must be one of ${allowedAppEnvs.join(', ')}`);
  }
  return value;
};

const readEInvoiceMode = (): EInvoiceMode => {
  const value = (process.env.E_INVOICE_MODE || process.env.TTN_MODE || 'mock').toLowerCase() as EInvoiceMode;
  if (!allowedModes.includes(value)) {
    throw new Error(`INVALID_E_INVOICE_MODE: E_INVOICE_MODE must be one of ${allowedModes.join(', ')}`);
  }
  return value;
};

export const getEInvoiceConfig = () => {
  const appEnv = readAppEnv();
  const mode = readEInvoiceMode();

  if ((appEnv === 'production' || isNodeProduction()) && mode === 'mock') {
    throw new Error('INVALID_E_INVOICE_CONFIGURATION: E_INVOICE_MODE=mock is not allowed in production.');
  }

  return {
    appEnv,
    mode,
    isMockMode: mode === 'mock',
    isSandboxMode: mode === 'sandbox',
    isProductionMode: mode === 'production',
  };
};

export const assertNoMockInProduction = (operation: string) => {
  const config = getEInvoiceConfig();
  if ((config.appEnv === 'production' || isNodeProduction()) && config.mode === 'mock') {
    throw new Error(`MOCK_NOT_ALLOWED_IN_PRODUCTION: ${operation} cannot run in mock mode in production.`);
  }
};

export const getTeifConfigured = () => {
  const xsdPath = process.env.TEIF_XSD_PATH;
  return Boolean(process.env.TEIF_SCHEMA_VERSION && xsdPath && fs.existsSync(xsdPath));
};

export const getSignatureConfigured = () => {
  const provider = (process.env.SIGNATURE_PROVIDER || 'mock').toLowerCase();
  if (provider === 'mock') return getEInvoiceConfig().isMockMode;
  if (provider === 'hsm') return Boolean(process.env.SIGNATURE_HSM_URL && process.env.SIGNATURE_HSM_TOKEN);
  return Boolean(process.env.SIGNATURE_CERT_PATH && process.env.SIGNATURE_CERT_PASSWORD);
};

export const getTTNConfigured = () =>
  Boolean(
    process.env.TTN_BASE_URL &&
      process.env.TTN_AUTH_ENDPOINT &&
      process.env.TTN_SUBMIT_INVOICE_ENDPOINT &&
      process.env.TTN_STATUS_ENDPOINT &&
      (process.env.TTN_API_KEY ||
        (process.env.TTN_CLIENT_ID && process.env.TTN_CLIENT_SECRET) ||
        (process.env.TTN_USERNAME && process.env.TTN_PASSWORD))
  );

type CompanyDossierInput = {
  name?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  matriculeFiscal?: string | null;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  country?: string | null;
  phone?: string | null;
};

export const getCompanyDossierStatus = (company?: CompanyDossierInput | null) => {
  if (!company) {
    return {
      status: 'incomplete',
      complete: false,
      missingFields: ['Company profile'],
    };
  }

  const requiredFields: Array<[keyof CompanyDossierInput, string]> = [
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

export const getEInvoiceReadiness = (company?: CompanyDossierInput | null) => {
  const config = getEInvoiceConfig();
  const teifConfigured = getTeifConfigured();
  const signatureConfigured = getSignatureConfigured();
  const ttnConfigured = getTTNConfigured();
  const dossier = getCompanyDossierStatus(company);
  const missingRequirements: string[] = [];
  const warnings: string[] = [];
  const nextActions: string[] = [];

  if (!teifConfigured) missingRequirements.push('Official TTN TEIF XSD not configured');
  if (!signatureConfigured) missingRequirements.push('Signature provider not configured');
  if (!ttnConfigured) missingRequirements.push('TTN API credentials missing');
  if (!dossier.complete) missingRequirements.push(`Company dossier incomplete: ${dossier.missingFields.join(', ')}`);
  if (config.isMockMode) warnings.push('Mode simulation actif - non legal.');
  if (config.isSandboxMode) warnings.push('Mode sandbox/test - non legal.');
  if (!dossier.complete) nextActions.push('Completer le dossier entreprise.');
  if (!teifConfigured) nextActions.push('Configurer le XSD TEIF officiel.');
  if (!signatureConfigured) nextActions.push('Configurer une signature electronique reelle.');
  if (!ttnConfigured) nextActions.push('Configurer les endpoints et secrets TTN officiels.');
  const productionReady = config.isProductionMode && teifConfigured && signatureConfigured && ttnConfigured && dossier.complete;

  return {
    mode: config.mode,
    appEnv: config.appEnv,
    teifConfigured,
    signatureConfigured,
    ttnConfigured,
    companyDossierStatus: dossier.status,
    companyDossierComplete: dossier.complete,
    companyDossierMissingFields: dossier.missingFields,
    canIssueLegalInvoices: productionReady,
    missingRequirements,
    companyFileComplete: dossier.complete,
    teifGenerationReady: dossier.complete,
    officialXsdConfigured: teifConfigured,
    signatureProviderConfigured: signatureConfigured,
    realSignatureReady: config.isProductionMode && signatureConfigured,
    sandboxReady: config.isSandboxMode && teifConfigured && signatureConfigured && ttnConfigured && dossier.complete,
    productionReady,
    blockingReasons: missingRequirements,
    warnings,
    nextActions,
  };
};

export const assertProductionTeifValidationConfigured = () => {
  if (getEInvoiceConfig().isProductionMode && !getTeifConfigured()) {
    throw new Error('TEIF_XSD_NOT_CONFIGURED: Please configure the official TTN TEIF XSD before production use.');
  }
};

export const assertProductionSignatureConfigured = () => {
  const config = getEInvoiceConfig();
  if (config.isProductionMode && !getSignatureConfigured()) {
    throw new Error("Impossible de signer : la signature électronique n'est pas configurée.");
  }
};

export const assertProductionTTNConfigured = () => {
  const config = getEInvoiceConfig();
  if ((config.isProductionMode || config.isSandboxMode) && !getTTNConfigured()) {
    throw new Error('TTN_API_NOT_CONFIGURED: Please configure official TTN API credentials and endpoints before production use.');
  }
};

export const assertNoMockProviderInProduction = assertNoMockInProduction;

export const assertProductionSignatureProviderConfigured = assertProductionSignatureConfigured;
