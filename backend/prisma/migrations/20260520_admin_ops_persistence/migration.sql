CREATE TABLE "AdminCompanyProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "dossierStatus" TEXT NOT NULL DEFAULT 'incomplete',
    "requestedDocuments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminCompanyProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminCompanyNote" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'company',
    "targetId" TEXT NOT NULL,
    "companyId" TEXT,
    "adminId" TEXT,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminCompanyNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSupportTicket" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "userLabel" TEXT NOT NULL DEFAULT 'Company owner',
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminSupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSupportReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "adminId" TEXT,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSupportReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSystemError" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "companyId" TEXT,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminSystemError_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminPlatformPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "status" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "method" TEXT,
    "providerReference" TEXT,
    "createdByAdminId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminPlatformPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminDossierStatusHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "adminId" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminDossierStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminCompanyStatusHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "adminId" TEXT,
    "actionType" TEXT NOT NULL DEFAULT 'status_change',
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminCompanyStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminCompanyProfile_companyId_key" ON "AdminCompanyProfile"("companyId");
CREATE INDEX "AdminCompanyProfile_status_idx" ON "AdminCompanyProfile"("status");
CREATE INDEX "AdminCompanyProfile_dossierStatus_idx" ON "AdminCompanyProfile"("dossierStatus");
CREATE INDEX "AdminCompanyNote_targetType_targetId_createdAt_idx" ON "AdminCompanyNote"("targetType", "targetId", "createdAt");
CREATE INDEX "AdminCompanyNote_companyId_createdAt_idx" ON "AdminCompanyNote"("companyId", "createdAt");
CREATE INDEX "AdminSupportTicket_companyId_status_idx" ON "AdminSupportTicket"("companyId", "status");
CREATE INDEX "AdminSupportTicket_status_createdAt_idx" ON "AdminSupportTicket"("status", "createdAt");
CREATE INDEX "AdminSupportReply_ticketId_createdAt_idx" ON "AdminSupportReply"("ticketId", "createdAt");
CREATE INDEX "AdminSystemError_status_severity_idx" ON "AdminSystemError"("status", "severity");
CREATE INDEX "AdminSystemError_companyId_createdAt_idx" ON "AdminSystemError"("companyId", "createdAt");
CREATE INDEX "AdminPlatformPayment_companyId_status_idx" ON "AdminPlatformPayment"("companyId", "status");
CREATE INDEX "AdminPlatformPayment_status_createdAt_idx" ON "AdminPlatformPayment"("status", "createdAt");
CREATE INDEX "AdminDossierStatusHistory_companyId_createdAt_idx" ON "AdminDossierStatusHistory"("companyId", "createdAt");
CREATE INDEX "AdminCompanyStatusHistory_companyId_actionType_createdAt_idx" ON "AdminCompanyStatusHistory"("companyId", "actionType", "createdAt");

ALTER TABLE "AdminCompanyProfile" ADD CONSTRAINT "AdminCompanyProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminCompanyNote" ADD CONSTRAINT "AdminCompanyNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminCompanyNote" ADD CONSTRAINT "AdminCompanyNote_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminSupportTicket" ADD CONSTRAINT "AdminSupportTicket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminSupportReply" ADD CONSTRAINT "AdminSupportReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "AdminSupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminSupportReply" ADD CONSTRAINT "AdminSupportReply_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminSystemError" ADD CONSTRAINT "AdminSystemError_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminPlatformPayment" ADD CONSTRAINT "AdminPlatformPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminDossierStatusHistory" ADD CONSTRAINT "AdminDossierStatusHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminDossierStatusHistory" ADD CONSTRAINT "AdminDossierStatusHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminCompanyStatusHistory" ADD CONSTRAINT "AdminCompanyStatusHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminCompanyStatusHistory" ADD CONSTRAINT "AdminCompanyStatusHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
