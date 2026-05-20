import crypto from 'crypto';

const algorithm = 'aes-256-gcm';

const getKey = () => {
  const raw = process.env.ENCRYPTION_KEY || '';
  if (!raw && process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY is required to save integration secrets in production');
  }
  const material = raw || 'development-only-encryption-key-change-before-production';
  return crypto.createHash('sha256').update(material).digest();
};

export const encryptSecret = (plainText: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

export const decryptSecret = (payload?: string | null) => {
  if (!payload) return '';
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(':');
  if (!ivRaw || !tagRaw || !encryptedRaw) return '';
  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(ivRaw, 'base64'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64')), decipher.final()]).toString('utf8');
};

export const maskSecret = (value?: string | null) => {
  if (!value) return undefined;
  const visible = value.slice(-4);
  return `${'*'.repeat(Math.max(8, Math.min(12, value.length - visible.length)))}${visible}`;
};

export const hashValue = (value?: string | null) => {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(`${process.env.JWT_SECRET || 'dev'}:${value}`).digest('hex');
};
