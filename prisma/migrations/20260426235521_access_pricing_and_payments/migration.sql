-- CreateTable
CREATE TABLE "AccessPricingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "branchId" TEXT,
    "propertyId" TEXT,
    "parkingFacilityId" TEXT,
    "fractionMinutes" INTEGER DEFAULT 60,
    "pricePerFractionCents" INTEGER DEFAULT 0,
    "graceMinutes" INTEGER DEFAULT 0,
    "dailyMaxCents" INTEGER,
    "fixedPriceCents" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccessPricingPlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessPricingPlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessPricingPlan_parkingFacilityId_fkey" FOREIGN KEY ("parkingFacilityId") REFERENCES "ParkingFacility" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessPaymentPart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "paidAt" DATETIME,
    "notes" TEXT,
    "financialRecordId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccessPaymentPart_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AccessRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccessPaymentPart_financialRecordId_fkey" FOREIGN KEY ("financialRecordId") REFERENCES "FinancialRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "AccessRecord_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "AccessPricingPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AccessRecord" ("assetType", "branchId", "chargedCents", "createdAt", "customerName", "entryAt", "exitAt", "id", "note", "paidCents", "parkingFacilityId", "propertyId", "status", "updatedAt", "vehiclePlate") SELECT "assetType", "branchId", "chargedCents", "createdAt", "customerName", "entryAt", "exitAt", "id", "note", "paidCents", "parkingFacilityId", "propertyId", "status", "updatedAt", "vehiclePlate" FROM "AccessRecord";
DROP TABLE "AccessRecord";
ALTER TABLE "new_AccessRecord" RENAME TO "AccessRecord";
CREATE INDEX "AccessRecord_entryAt_idx" ON "AccessRecord"("entryAt");
CREATE INDEX "AccessRecord_exitAt_idx" ON "AccessRecord"("exitAt");
CREATE INDEX "AccessRecord_status_idx" ON "AccessRecord"("status");
CREATE INDEX "AccessRecord_branchId_idx" ON "AccessRecord"("branchId");
CREATE INDEX "AccessRecord_propertyId_idx" ON "AccessRecord"("propertyId");
CREATE INDEX "AccessRecord_parkingFacilityId_idx" ON "AccessRecord"("parkingFacilityId");
CREATE INDEX "AccessRecord_vehiclePlate_idx" ON "AccessRecord"("vehiclePlate");
CREATE INDEX "AccessRecord_pricingPlanId_idx" ON "AccessRecord"("pricingPlanId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AccessPricingPlan_active_idx" ON "AccessPricingPlan"("active");

-- CreateIndex
CREATE INDEX "AccessPricingPlan_kind_idx" ON "AccessPricingPlan"("kind");

-- CreateIndex
CREATE INDEX "AccessPricingPlan_branchId_idx" ON "AccessPricingPlan"("branchId");

-- CreateIndex
CREATE INDEX "AccessPricingPlan_propertyId_idx" ON "AccessPricingPlan"("propertyId");

-- CreateIndex
CREATE INDEX "AccessPricingPlan_parkingFacilityId_idx" ON "AccessPricingPlan"("parkingFacilityId");

-- CreateIndex
CREATE INDEX "AccessPaymentPart_sessionId_idx" ON "AccessPaymentPart"("sessionId");

-- CreateIndex
CREATE INDEX "AccessPaymentPart_paidAt_idx" ON "AccessPaymentPart"("paidAt");

-- CreateIndex
CREATE INDEX "AccessPaymentPart_financialRecordId_idx" ON "AccessPaymentPart"("financialRecordId");
