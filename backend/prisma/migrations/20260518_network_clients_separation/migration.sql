CREATE TABLE IF NOT EXISTS "PlatformInvitation" (
  "id" TEXT NOT NULL,
  "senderCompanyId" TEXT NOT NULL,
  "recipientCompanyId" TEXT,
  "recipientEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformInvitation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "rne" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE TABLE IF NOT EXISTS "PartnerConnection" (
  "id" TEXT NOT NULL,
  "companyAId" TEXT NOT NULL,
  "companyBId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnerConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PartnerMessage" (
  "id" TEXT NOT NULL,
  "senderCompanyId" TEXT NOT NULL,
  "recipientCompanyId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlatformInvitation_senderCompanyId_status_idx" ON "PlatformInvitation"("senderCompanyId", "status");
CREATE INDEX IF NOT EXISTS "PlatformInvitation_recipientCompanyId_status_idx" ON "PlatformInvitation"("recipientCompanyId", "status");
CREATE INDEX IF NOT EXISTS "PlatformInvitation_recipientEmail_status_idx" ON "PlatformInvitation"("recipientEmail", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerConnection_companyAId_companyBId_key" ON "PartnerConnection"("companyAId", "companyBId");
CREATE INDEX IF NOT EXISTS "PartnerConnection_companyAId_status_idx" ON "PartnerConnection"("companyAId", "status");
CREATE INDEX IF NOT EXISTS "PartnerConnection_companyBId_status_idx" ON "PartnerConnection"("companyBId", "status");
CREATE INDEX IF NOT EXISTS "PartnerMessage_senderCompanyId_recipientCompanyId_createdAt_idx" ON "PartnerMessage"("senderCompanyId", "recipientCompanyId", "createdAt");
CREATE INDEX IF NOT EXISTS "PartnerMessage_recipientCompanyId_createdAt_idx" ON "PartnerMessage"("recipientCompanyId", "createdAt");

ALTER TABLE "PlatformInvitation"
  ADD CONSTRAINT "PlatformInvitation_senderCompanyId_fkey"
  FOREIGN KEY ("senderCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlatformInvitation"
  ADD CONSTRAINT "PlatformInvitation_recipientCompanyId_fkey"
  FOREIGN KEY ("recipientCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PartnerConnection"
  ADD CONSTRAINT "PartnerConnection_companyAId_fkey"
  FOREIGN KEY ("companyAId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerConnection"
  ADD CONSTRAINT "PartnerConnection_companyBId_fkey"
  FOREIGN KEY ("companyBId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerMessage"
  ADD CONSTRAINT "PartnerMessage_senderCompanyId_fkey"
  FOREIGN KEY ("senderCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PartnerMessage"
  ADD CONSTRAINT "PartnerMessage_recipientCompanyId_fkey"
  FOREIGN KEY ("recipientCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
