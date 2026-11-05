import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const invoiceSequenceFromExistingInvoices = (year: number) => Prisma.sql`
  COALESCE((
    SELECT MAX(SPLIT_PART("invoiceNumber", '-', 3)::INTEGER)
    FROM "Invoice"
    WHERE "invoiceNumber" ~ ('^ZT-' || ${year}::TEXT || '-[0-9]+$')
  ), 0)
`;

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [row] = await prisma.$queryRaw<{ sequence: number }[]>`
    SELECT GREATEST(
      ${invoiceSequenceFromExistingInvoices(year)},
      COALESCE((
        SELECT "sequence"
        FROM "InvoiceCounter"
        WHERE "year" = ${year}
      ), 0)
    ) + 1 AS "sequence"
  `;

  if (!row) throw new Error("Could not determine the next invoice number");
  return `ZT-${year}-${String(row.sequence).padStart(4, "0")}`;
}

export async function reserveInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const [row] = await tx.$queryRaw<{ sequence: number }[]>`
    INSERT INTO "InvoiceCounter" AS counter ("year", "sequence")
    VALUES (
      ${year},
      ${invoiceSequenceFromExistingInvoices(year)} + 1
    )
    ON CONFLICT ("year") DO UPDATE
    SET "sequence" = GREATEST(counter."sequence" + 1, EXCLUDED."sequence")
    RETURNING "sequence"
  `;

  if (!row) throw new Error("Could not reserve an invoice number");
  return `ZT-${year}-${String(row.sequence).padStart(4, "0")}`;
}
