import prisma from '../prisma';
import { decryptSecret, encryptSecret, maskSecret } from '../utils/secretCrypto';

export type IntegrationKey =
  | 'ttn'
  | 'signature'
  | 'billing'
  | 'email'
  | 'ai'
  | 'ga4'
  | 'gtm'
  | 'searchConsole'
  | 'metaPixel';

type Field = { name: string; env?: string; secret?: boolean };

export const INTEGRATIONS: Record<IntegrationKey, { label: string; fields: Field[] }> = {
  ttn: {
    label: 'TTN / El Fatoora',
    fields: [
      { name: 'baseUrl', env: 'TTN_BASE_URL' },
      { name: 'authEndpoint', env: 'TTN_AUTH_ENDPOINT' },
      { name: 'submitInvoiceEndpoint', env: 'TTN_SUBMIT_INVOICE_ENDPOINT' },
      { name: 'statusEndpoint', env: 'TTN_STATUS_ENDPOINT' },
      { name: 'apiKey', env: 'TTN_API_KEY', secret: true },
    ],
  },
  signature: {
    label: 'Signature provider',
    fields: [
      { name: 'provider', env: 'SIGNATURE_PROVIDER' },
      { name: 'apiKey', env: 'SIGNATURE_API_KEY', secret: true },
      { name: 'hsmUrl', env: 'SIGNATURE_HSM_URL' },
    ],
  },
  billing: {
    label: 'Billing provider',
    fields: [
      { name: 'provider', env: 'BILLING_PROVIDER' },
      { name: 'apiKey', env: 'BILLING_API_KEY', secret: true },
      { name: 'webhookSecret', env: 'BILLING_WEBHOOK_SECRET', secret: true },
    ],
  },
  email: {
    label: 'Email SMTP',
    fields: [
      { name: 'host', env: 'SMTP_HOST' },
      { name: 'port', env: 'SMTP_PORT' },
      { name: 'user', env: 'SMTP_USER' },
      { name: 'password', env: 'SMTP_PASSWORD', secret: true },
    ],
  },
  ai: {
    label: 'AI provider',
    fields: [
      { name: 'provider', env: 'AI_PROVIDER' },
      { name: 'apiKey', env: 'AI_API_KEY', secret: true },
    ],
  },
  ga4: { label: 'Google Analytics', fields: [{ name: 'measurementId', env: 'GA4_MEASUREMENT_ID' }] },
  gtm: { label: 'Google Tag Manager', fields: [{ name: 'containerId', env: 'GTM_CONTAINER_ID' }] },
  searchConsole: {
    label: 'Google Search Console',
    fields: [
      { name: 'siteUrl', env: 'GOOGLE_SEARCH_CONSOLE_SITE_URL' },
      { name: 'serviceAccountPath', env: 'GOOGLE_SERVICE_ACCOUNT_JSON_PATH' },
    ],
  },
  metaPixel: { label: 'Meta Pixel', fields: [{ name: 'pixelId', env: 'META_PIXEL_ID' }] },
};

const envConfigured = (value?: string) => Boolean(value && value.trim() && !value.includes('CHANGE_ME'));
const dbKey = (integration: string, field: string) => `${integration}.${field}`;

const getStoredRows = async () => {
  try {
    return await (prisma as any).integrationSecret.findMany();
  } catch (error) {
    return [];
  }
};

export const getIntegrationStatus = async () => {
  const rows = await getStoredRows();
  const rowFor = (key: string) => rows.find((row: any) => row.key === key);

  const statusFor = (integration: IntegrationKey) => {
    const config = INTEGRATIONS[integration];
    const fields = config.fields.map((field) => {
      const row = rowFor(dbKey(integration, field.name));
      const envValue = field.env ? process.env[field.env] : undefined;
      const configured = Boolean(row?.encryptedValue || row?.publicValue || envConfigured(envValue));
      const rawForMask = row?.publicValue || (field.secret ? undefined : envValue) || (field.secret && envConfigured(envValue) ? envValue : undefined);
      return {
        name: field.name,
        secret: Boolean(field.secret),
        configured,
        masked: configured ? maskSecret(rawForMask || 'configured') : undefined,
        lastUpdatedAt: row?.updatedAt || null,
        source: row ? 'admin' : envConfigured(envValue) ? 'env' : 'missing',
      };
    });
    return {
      configured: fields.some((field) => field.configured),
      lastUpdatedAt: fields.map((field) => field.lastUpdatedAt).filter(Boolean).sort().pop() || null,
      fields,
    };
  };

  const ttn = statusFor('ttn');
  const signature = statusFor('signature');
  const billing = statusFor('billing');
  const email = statusFor('email');
  const ai = statusFor('ai');
  const ga4 = statusFor('ga4');
  const gtm = statusFor('gtm');
  const searchConsole = statusFor('searchConsole');
  const metaPixel = statusFor('metaPixel');

  return {
    ttn,
    signature,
    billing,
    email,
    ai,
    analytics: {
      ga4Configured: ga4.configured,
      gtmConfigured: gtm.configured,
      searchConsoleConfigured: searchConsole.configured,
      metaPixelConfigured: metaPixel.configured,
      ga4,
      gtm,
      searchConsole,
      metaPixel,
    },
  };
};

export const saveIntegrationSettings = async (integration: IntegrationKey, payload: Record<string, any>, adminId?: string) => {
  const config = INTEGRATIONS[integration];
  if (!config) throw new Error('Integration inconnue');
  const updates = [];

  for (const field of config.fields) {
    if (payload[field.name] === undefined || payload[field.name] === '') continue;
    const value = String(payload[field.name]).trim();
    const data = {
      encryptedValue: field.secret ? encryptSecret(value) : null,
      publicValue: field.secret ? null : value,
      valueType: field.secret ? 'secret' : 'public',
      lastUpdatedBy: adminId || null,
    };
    updates.push(
      (prisma as any).integrationSecret.upsert({
        where: { key: dbKey(integration, field.name) },
        update: data,
        create: { key: dbKey(integration, field.name), ...data },
      })
    );
  }

  await Promise.all(updates);
  return getIntegrationStatus();
};

export const getConfiguredValue = async (integration: IntegrationKey, fieldName: string) => {
  const config = INTEGRATIONS[integration];
  const field = config?.fields.find((item) => item.name === fieldName);
  if (!field) return '';
  const row = await (prisma as any).integrationSecret.findUnique({ where: { key: dbKey(integration, fieldName) } }).catch(() => null);
  if (row?.encryptedValue) return decryptSecret(row.encryptedValue);
  if (row?.publicValue) return row.publicValue;
  return field.env ? process.env[field.env] || '' : '';
};
