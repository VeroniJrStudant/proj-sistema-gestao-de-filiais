-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT,
    "operationScope" TEXT NOT NULL DEFAULT 'GENERAL',
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("active", "billingProfile", "createdAt", "document", "documentType", "email", "id", "kind", "name", "notes", "phone", "preferredDueDay", "preferredPaymentMethodsJson", "suggestedAmountCents", "tradeName", "updatedAt", "street", "number", "complement", "neighborhood", "city", "state", "zip") SELECT "active", "billingProfile", "createdAt", "document", "documentType", "email", "id", "kind", "name", "notes", "phone", "preferredDueDay", "preferredPaymentMethodsJson", "suggestedAmountCents", "tradeName", "updatedAt", "street", "number", "complement", "neighborhood", "city", "state", "zip" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE INDEX "Customer_name_idx" ON "Customer"("name");
CREATE INDEX "Customer_document_idx" ON "Customer"("document");
CREATE INDEX "Customer_billingProfile_idx" ON "Customer"("billingProfile");
CREATE INDEX "Customer_branchId_idx" ON "Customer"("branchId");
CREATE INDEX "Customer_operationScope_idx" ON "Customer"("operationScope");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
