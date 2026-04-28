/*
  Warnings:

  - You are about to drop the column `preferredPaymentMethods` on the `Customer` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL DEFAULT 'PERSON',
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'OTHER',
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "billingProfile" TEXT NOT NULL DEFAULT 'AVULSO',
    "preferredDueDay" INTEGER,
    "suggestedAmountCents" INTEGER,
    "preferredPaymentMethodsJson" TEXT DEFAULT '[]',
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("active", "billingProfile", "createdAt", "document", "email", "id", "kind", "name", "notes", "phone", "preferredDueDay", "suggestedAmountCents", "tradeName", "updatedAt") SELECT "active", "billingProfile", "createdAt", "document", "email", "id", "kind", "name", "notes", "phone", "preferredDueDay", "suggestedAmountCents", "tradeName", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE INDEX "Customer_name_idx" ON "Customer"("name");
CREATE INDEX "Customer_document_idx" ON "Customer"("document");
CREATE INDEX "Customer_billingProfile_idx" ON "Customer"("billingProfile");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
