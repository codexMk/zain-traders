import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ZT-${year}-`;
  const [lastInvoice, counter] = await Promise.all([
    prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    }),
    prisma.invoiceCounter.findUnique({ where: { year }, select: { sequence: true } }),
  ]);
  const invoiceSequence = lastInvoice ? Number(lastInvoice.invoiceNumber.slice(prefix.length)) : 0;
  const next = Math.max(invoiceSequence, counter?.sequence ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function reserveInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const [row] = await tx.$queryRaw<{ sequence: number }[]>`
    INSERT INTO "InvoiceCounter" ("year", "sequence")
    VALUES (
      ${year},
      COALESCE((
        SELECT MAX(SPLIT_PART("invoiceNumber", '-', 3)::INTEGER)
        FROM "Invoice"
        WHERE "invoiceNumber" ~ ('^ZT-' || ${year}::TEXT || '-[0-9]+$')
      ), 0) + 1
    )
    ON CONFLICT ("year") DO UPDATE SET "sequence" = "InvoiceCounter"."sequence" + 1
    RETURNING "sequence"
  `;
  return `ZT-${year}-${String(row.sequence).padStart(4, "0")}`;
}
