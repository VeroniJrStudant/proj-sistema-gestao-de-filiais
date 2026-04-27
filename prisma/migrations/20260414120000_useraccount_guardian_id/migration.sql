-- Add guardianId relation field to UserAccount.
-- SQLite can't add a foreign key constraint without table rebuild; we add the column + index to satisfy the schema.

ALTER TABLE "UserAccount" ADD COLUMN "guardianId" TEXT;

CREATE INDEX IF NOT EXISTS "UserAccount_guardianId_idx" ON "UserAccount"("guardianId");

