CREATE TABLE "TvaRate" (
  "id" TEXT NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL,
  "label" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TvaRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TvaRate_rate_key" ON "TvaRate"("rate");

INSERT INTO "TvaRate" ("id", "rate", "label", "active", "sortOrder", "updatedAt")
VALUES
  ('tva-standard-19', 19, 'Standard', true, 1, CURRENT_TIMESTAMP),
  ('tva-special-13', 13, 'Spécial', true, 2, CURRENT_TIMESTAMP),
  ('tva-reduit-7', 7, 'Réduit', true, 3, CURRENT_TIMESTAMP),
  ('tva-exonere-0', 0, 'Exonéré', true, 4, CURRENT_TIMESTAMP)
ON CONFLICT ("rate") DO NOTHING;
