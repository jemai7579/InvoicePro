-- Project owner feedback v2: user audit trail, offers, payments, onboarding support.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentSequenceType') THEN
    ALTER TYPE "DocumentSequenceType" ADD VALUE IF NOT EXISTS 'OFFER';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "UserActivityLog" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorType" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "objectType" TEXT NOT NULL,
  "objectId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Offer" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "clientId" TEXT,
  "invoiceRequestId" TEXT,
  "number" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "estimatedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deliveryDelay" TEXT,
  "validUntil" TIMESTAMP(3),
  "terms" TEXT,
  "purchaseOrderReference" TEXT,
  "purchaseOrderFile" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "publicToken" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OfferComment" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "actorType" TEXT NOT NULL DEFAULT 'USER',
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfferComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "method" TEXT NOT NULL DEFAULT 'CASH',
  "status" TEXT NOT NULL DEFAULT 'PAID',
  "reference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SignatureProviderOption" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetUsers" TEXT NOT NULL,
  "costDescription" TEXT,
  "difficulty" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "setupInstructions" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEEDS_VERIFICATION',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SignatureProviderOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OnboardingRequest" (
  "id" TEXT NOT NULL,
  "companyId" TEXT,
  "name" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "needType" TEXT NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OnboardingRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserActivityLog_companyId_createdAt_idx" ON "UserActivityLog"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "UserActivityLog_companyId_objectType_objectId_idx" ON "UserActivityLog"("companyId", "objectType", "objectId");
CREATE UNIQUE INDEX IF NOT EXISTS "Offer_companyId_number_key" ON "Offer"("companyId", "number");
CREATE UNIQUE INDEX IF NOT EXISTS "Offer_publicToken_key" ON "Offer"("publicToken");

ALTER TABLE "UserActivityLog"
  ADD CONSTRAINT "UserActivityLog_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Offer"
  ADD CONSTRAINT "Offer_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Offer"
  ADD CONSTRAINT "Offer_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OfferComment"
  ADD CONSTRAINT "OfferComment_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OnboardingRequest"
  ADD CONSTRAINT "OnboardingRequest_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
