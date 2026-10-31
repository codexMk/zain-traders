DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Invoice"
    WHERE "idempotencyKey" IS NOT NULL
    GROUP BY "idempotencyKey"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add Invoice idempotency index: duplicate idempotencyKey values must be reviewed first';
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_idempotencyKey_key"
    ON "Invoice"("idempotencyKey");
END
$$;
