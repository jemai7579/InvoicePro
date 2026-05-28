CREATE TABLE "FailedLoginAttempt" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "lastFailedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailedLoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiMonthlyUsage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "monthStart" TIMESTAMP(3) NOT NULL,
    "usedTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiMonthlyUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FailedLoginAttempt_keyHash_key" ON "FailedLoginAttempt"("keyHash");
CREATE INDEX "FailedLoginAttempt_blockedUntil_idx" ON "FailedLoginAttempt"("blockedUntil");
CREATE INDEX "FailedLoginAttempt_lastFailedAt_idx" ON "FailedLoginAttempt"("lastFailedAt");
CREATE UNIQUE INDEX "AiMonthlyUsage_companyId_monthStart_key" ON "AiMonthlyUsage"("companyId", "monthStart");
CREATE INDEX "AiMonthlyUsage_monthStart_idx" ON "AiMonthlyUsage"("monthStart");

ALTER TABLE "AiMonthlyUsage" ADD CONSTRAINT "AiMonthlyUsage_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
