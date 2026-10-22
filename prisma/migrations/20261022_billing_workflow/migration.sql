-- Additive billing changes. Existing invoices and customer/payment rows are retained.
ALTER TYPE "InvoiceStatus" ADD VALUE 'CANCELLED';

ALTER TABLE "Customer"
  ADD COLUMN "shopName" TEXT,
  ADD COLUMN "stateCode" TEXT;

ALTER TABLE "Invoice"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "customerName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "customerMobile" TEXT,
  ADD COLUMN "customerAddress" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "customerGstNumber" TEXT,
  ADD COLUMN "customerStateCode" TEXT,
  ADD COLUMN "placeOfSupplyStateCode" TEXT,
  ADD COLUMN "supplierName" TEXT NOT NULL DEFAULT 'Zain Traders',
  ADD COLUMN "supplierAddress" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "supplierGstin" TEXT,
  ADD COLUMN "supplierPhones" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancelledById" TEXT,
  ADD COLUMN "cancellationReason" TEXT;

UPDATE "Invoice" AS i
SET "customerName" = c."name",
    "customerMobile" = c."mobile",
    "customerAddress" = c."address",
    "customerGstNumber" = c."gstNumber",
    "customerStateCode" = c."stateCode"
FROM "Customer" AS c
WHERE i."customerId" = c."id";

CREATE UNIQUE INDEX "Invoice_idempotencyKey_key" ON "Invoice"("idempotencyKey");

ALTER TABLE "Invoice" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvoiceItem"
  ADD COLUMN "productName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "productSku" TEXT,
  ADD COLUMN "hsnCode" TEXT,
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'PIECE',
  ADD COLUMN "lineSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "taxableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "igstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "InvoiceItem" AS ii
    SET "productName" = COALESCE(NULLIF(p."marathiName", '') || ' (' || p."name" || ')', p."name"),
    "productSku" = p."sku",
    "hsnCode" = p."hsnCode",
    "unit" = p."unit"::TEXT,
    "lineSubtotal" = ii."quantity" * ii."rate",
    "taxableAmount" = GREATEST(0, ii."quantity" * ii."rate" - ii."discountAmount")
FROM "Product" AS p
WHERE ii."productId" = p."id";

ALTER TABLE "InvoiceItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_productId_fkey";
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CustomerPayment"
  ADD COLUMN "reversedAt" TIMESTAMP(3),
  ADD COLUMN "reversedById" TEXT,
  ADD COLUMN "reversalReason" TEXT;

ALTER TABLE "CustomerPayment" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "CustomerPayment" DROP CONSTRAINT "CustomerPayment_customerId_fkey";
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "BusinessSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "legalName" TEXT NOT NULL DEFAULT 'Zain Traders',
  "address" TEXT,
  "phoneNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "gstin" TEXT,
  "registeredStateCode" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceCounter" (
  "year" INTEGER NOT NULL,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("year")
);
