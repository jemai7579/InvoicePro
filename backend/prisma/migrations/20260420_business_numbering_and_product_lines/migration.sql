-- Visible business numbers and yearly company-scoped sequences
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "number" TEXT;
ALTER TABLE "Devis" ADD COLUMN IF NOT EXISTS "number" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "number" TEXT;

-- Product catalog enhancements
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- Optional product linkage for line snapshots
ALTER TABLE "DevisLine" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "productId" TEXT;

-- Sequence storage
CREATE TABLE IF NOT EXISTS "DocumentSequence" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "currentValue" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Client_companyId_number_key" ON "Client"("companyId", "number");
CREATE UNIQUE INDEX IF NOT EXISTS "Devis_companyId_number_key" ON "Devis"("companyId", "number");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_companyId_number_key" ON "Invoice"("companyId", "number");
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentSequence_companyId_entityType_year_key"
  ON "DocumentSequence"("companyId", "entityType", "year");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'DocumentSequence_companyId_fkey'
      AND table_name = 'DocumentSequence'
  ) THEN
    ALTER TABLE "DocumentSequence"
      ADD CONSTRAINT "DocumentSequence_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'DevisLine_productId_fkey'
      AND table_name = 'DevisLine'
  ) THEN
    ALTER TABLE "DevisLine"
      ADD CONSTRAINT "DevisLine_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'InvoiceLine_productId_fkey'
      AND table_name = 'InvoiceLine'
  ) THEN
    ALTER TABLE "InvoiceLine"
      ADD CONSTRAINT "InvoiceLine_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
