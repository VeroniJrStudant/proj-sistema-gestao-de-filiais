-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationLinkKind" TEXT NOT NULL DEFAULT 'NONE',
    "branchId" TEXT,
    "propertyId" TEXT,
    "parkingFacilityId" TEXT,
    "leaseContractId" TEXT,
    "tenantId" TEXT,
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
    CONSTRAINT "Customer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Customer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Customer_parkingFacilityId_fkey" FOREIGN KEY ("parkingFacilityId") REFERENCES "ParkingFacility" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Customer_leaseContractId_fkey" FOREIGN KEY ("leaseContractId") REFERENCES "LeaseContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" (
    "id", "branchId", "operationLinkKind", "propertyId", "parkingFacilityId", "leaseContractId", "tenantId",
    "kind", "name", "tradeName", "documentType", "document", "phone", "email",
    "street", "number", "complement", "neighborhood", "city", "state", "zip",
    "billingProfile", "preferredDueDay", "suggestedAmountCents", "preferredPaymentMethodsJson", "notes", "active", "createdAt", "updatedAt"
)
SELECT
    "id",
    CASE WHEN "branchId" IS NOT NULL THEN "branchId" ELSE NULL END,
    CASE WHEN "branchId" IS NOT NULL THEN 'BRANCH' ELSE 'NONE' END,
    NULL, NULL, NULL, NULL,
    "kind", "name", "tradeName", "documentType", "document", "phone", "email",
    "street", "number", "complement", "neighborhood", "city", "state", "zip",
    "billingProfile", "preferredDueDay", "suggestedAmountCents", "preferredPaymentMethodsJson", "notes", "active", "createdAt", "updatedAt"
FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE INDEX "Customer_name_idx" ON "Customer"("name");
CREATE INDEX "Customer_document_idx" ON "Customer"("document");
CREATE INDEX "Customer_billingProfile_idx" ON "Customer"("billingProfile");
CREATE INDEX "Customer_branchId_idx" ON "Customer"("branchId");
CREATE INDEX "Customer_operationLinkKind_idx" ON "Customer"("operationLinkKind");
CREATE INDEX "Customer_propertyId_idx" ON "Customer"("propertyId");
CREATE INDEX "Customer_parkingFacilityId_idx" ON "Customer"("parkingFacilityId");
CREATE INDEX "Customer_leaseContractId_idx" ON "Customer"("leaseContractId");
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
