import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../prisma';

const positiveIntegerFromEnv = (name: string, fallback: number) => {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const FAILED_LOGIN_MAX = () => positiveIntegerFromEnv('AUTH_FAILED_LOGIN_MAX', 10);
const FAILED_LOGIN_WINDOW_MS = () =>
  positiveIntegerFromEnv('AUTH_FAILED_LOGIN_WINDOW_MINUTES', 15) * 60 * 1000;

const keyHash = (scope: string, email: string, ipAddress: string) =>
  crypto
    .createHash('sha256')
    .update(`${scope}:${email.trim().toLowerCase()}:${ipAddress}`)
    .digest('hex');

const retryAfterSeconds = (date: Date) =>
  Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));

export const getFailedLoginBlock = async (scope: string, email: string, ipAddress: string) => {
  const attempt = await prisma.failedLoginAttempt.findUnique({
    where: { keyHash: keyHash(scope, email, ipAddress) },
  });

  if (attempt?.blockedUntil && attempt.blockedUntil.getTime() > Date.now()) {
    return retryAfterSeconds(attempt.blockedUntil);
  }

  return null;
};

export const recordFailedLogin = async (scope: string, email: string, ipAddress: string) => {
  const now = new Date();
  const windowMs = FAILED_LOGIN_WINDOW_MS();
  const failedLoginMax = FAILED_LOGIN_MAX();
  const attemptKey = keyHash(scope, email, ipAddress);
  const intervalExpression = Prisma.sql`${windowMs} * INTERVAL '1 millisecond'`;
  const withinWindowExpression = Prisma.sql`
    "FailedLoginAttempt"."windowStartedAt" + ${intervalExpression} > EXCLUDED."lastFailedAt"
  `;
  const failedCountExpression = Prisma.sql`
    CASE
      WHEN ${withinWindowExpression} THEN "FailedLoginAttempt"."failedCount" + 1
      ELSE 1
    END
  `;
  const windowStartExpression = Prisma.sql`
    CASE
      WHEN ${withinWindowExpression} THEN "FailedLoginAttempt"."windowStartedAt"
      ELSE EXCLUDED."windowStartedAt"
    END
  `;

  // A single upsert prevents concurrent failed attempts from overwriting increments.
  const attempts = await prisma.$queryRaw<Array<{ blockedUntil: Date | null }>>(Prisma.sql`
    INSERT INTO "FailedLoginAttempt" (
      "id", "keyHash", "failedCount", "windowStartedAt", "blockedUntil",
      "lastFailedAt", "createdAt", "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()}, ${attemptKey}, 1, ${now},
      ${failedLoginMax === 1 ? new Date(now.getTime() + windowMs) : null},
      ${now}, ${now}, ${now}
    )
    ON CONFLICT ("keyHash") DO UPDATE SET
      "failedCount" = ${failedCountExpression},
      "windowStartedAt" = ${windowStartExpression},
      "blockedUntil" = CASE
        WHEN ${failedCountExpression} >= ${failedLoginMax}
          THEN ${windowStartExpression} + ${intervalExpression}
        ELSE NULL
      END,
      "lastFailedAt" = EXCLUDED."lastFailedAt",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "blockedUntil"
  `);

  const blockedUntil = attempts[0]?.blockedUntil;
  return blockedUntil ? retryAfterSeconds(blockedUntil) : null;
};

export const clearFailedLogins = (scope: string, email: string, ipAddress: string) =>
  prisma.failedLoginAttempt.deleteMany({
    where: { keyHash: keyHash(scope, email, ipAddress) },
  });
