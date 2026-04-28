-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL DEFAULT 'PERSON',
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "billingProfile" TEXT NOT NULL DEFAULT 'AVULSO',
    "preferredDueDay" INTEGER,
    "suggestedAmountCents" INTEGER,
    "preferredPaymentMethods" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccessRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "branchId" TEXT,
    "propertyId" TEXT,
    "parkingFacilityId" TEXT,
    "vehiclePlate" TEXT,
    "vehicleType" TEXT,
    "customerName" TEXT,
    "customerDocument" TEXT,
    "phone" TEXT,
    "customerId" TEXT,
    "entryAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitAt" DATETIME,
    "chargedCents" INTEGER NOT NULL DEFAULT 0,
    "paidCents" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pricingPlanId" TEXT,
    CONSTRAINT "AccessRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessRecord_parkingFacilityId_fkey" FOREIGN KEY ("parkingFacilityId") REFERENCES "ParkingFacility" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessRecord_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "AccessPricingPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AccessRecord" ("assetType", "branchId", "chargedCents", "createdAt", "customerDocument", "customerName", "entryAt", "exitAt", "id", "note", "paidCents", "parkingFacilityId", "phone", "pricingPlanId", "propertyId", "status", "updatedAt", "vehiclePlate", "vehicleType") SELECT "assetType", "branchId", "chargedCents", "createdAt", "customerDocument", "customerName", "entryAt", "exitAt", "id", "note", "paidCents", "parkingFacilityId", "phone", "pricingPlanId", "propertyId", "status", "updatedAt", "vehiclePlate", "vehicleType" FROM "AccessRecord";
DROP TABLE "AccessRecord";
ALTER TABLE "new_AccessRecord" RENAME TO "AccessRecord";
CREATE INDEX "AccessRecord_entryAt_idx" ON "AccessRecord"("entryAt");
CREATE INDEX "AccessRecord_exitAt_idx" ON "AccessRecord"("exitAt");
CREATE INDEX "AccessRecord_status_idx" ON "AccessRecord"("status");
CREATE INDEX "AccessRecord_branchId_idx" ON "AccessRecord"("branchId");
CREATE INDEX "AccessRecord_propertyId_idx" ON "AccessRecord"("propertyId");
CREATE INDEX "AccessRecord_parkingFacilityId_idx" ON "AccessRecord"("parkingFacilityId");
CREATE INDEX "AccessRecord_vehiclePlate_idx" ON "AccessRecord"("vehiclePlate");
CREATE INDEX "AccessRecord_customerId_idx" ON "AccessRecord"("customerId");
CREATE INDEX "AccessRecord_pricingPlanId_idx" ON "AccessRecord"("pricingPlanId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_document_idx" ON "Customer"("document");

-- CreateIndex
CREATE INDEX "Customer_billingProfile_idx" ON "Customer"("billingProfile");
