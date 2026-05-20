-- Admin integrations, internal analytics, and richer system-error tracking
CREATE TABLE IF NOT EXISTS "IntegrationSecret" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "encryptedValue" TEXT,
  "publicValue" TEXT,
  "valueType" TEXT NOT NULL DEFAULT 'secret',
  "lastUpdatedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationSecret_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationSecret_key_key" ON "IntegrationSecret"("key");
CREATE INDEX IF NOT EXISTS "IntegrationSecret_key_idx" ON "IntegrationSecret"("key");

CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "userAgent" TEXT,
  "deviceType" TEXT,
  "country" TEXT,
  "city" TEXT,
  "companyId" TEXT,
  "sessionId" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "ipHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_path_createdAt_idx" ON "AnalyticsEvent"("path", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_companyId_createdAt_idx" ON "AnalyticsEvent"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_visitorId_createdAt_idx" ON "AnalyticsEvent"("visitorId", "createdAt");

ALTER TABLE "AdminSystemError" ADD COLUMN IF NOT EXISTS "route" TEXT;
ALTER TABLE "AdminSystemError" ADD COLUMN IF NOT EXISTS "stack" TEXT;
ALTER TABLE "AdminSystemError" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
