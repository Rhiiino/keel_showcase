-- Add optional service end date to finance obligations.

BEGIN;

ALTER TABLE finance_obligations
    ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

COMMIT;
