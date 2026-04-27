-- CreateTable
CREATE TABLE "AccessRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "branchId" TEXT,
    "propertyId" TEXT,
    "parkingFacilityId" TEXT,
    "vehiclePlate" TEXT,
    "customerName" TEXT,
    "entryAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitAt" DATETIME,
    "chargedCents" INTEGER NOT NULL DEFAULT 0,
    "paidCents" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccessRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessRecord_parkingFacilityId_fkey" FOREIGN KEY ("parkingFacilityId") REFERENCES "ParkingFacility" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinancialRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "direction" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "dueDate" DATETIME,
    "settledAt" DATETIME,
    "description" TEXT,
    "externalRef" TEXT,
    "studentId" TEXT,
    "branchId" TEXT,
    "propertyId" TEXT,
    "parkingFacilityId" TEXT,
    "accessRecordId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_parkingFacilityId_fkey" FOREIGN KEY ("parkingFacilityId") REFERENCES "ParkingFacility" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_accessRecordId_fkey" FOREIGN KEY ("accessRecordId") REFERENCES "AccessRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialRecord" ("amountCents", "branchId", "createdAt", "description", "direction", "dueDate", "externalRef", "id", "kind", "metadata", "parkingFacilityId", "propertyId", "settledAt", "status", "studentId", "updatedAt") SELECT "amountCents", "branchId", "createdAt", "description", "direction", "dueDate", "externalRef", "id", "kind", "metadata", "parkingFacilityId", "propertyId", "settledAt", "status", "studentId", "updatedAt" FROM "FinancialRecord";
DROP TABLE "FinancialRecord";
ALTER TABLE "new_FinancialRecord" RENAME TO "FinancialRecord";
CREATE INDEX "FinancialRecord_dueDate_idx" ON "FinancialRecord"("dueDate");
CREATE INDEX "FinancialRecord_status_idx" ON "FinancialRecord"("status");
CREATE INDEX "FinancialRecord_kind_idx" ON "FinancialRecord"("kind");
CREATE INDEX "FinancialRecord_branchId_idx" ON "FinancialRecord"("branchId");
CREATE INDEX "FinancialRecord_propertyId_idx" ON "FinancialRecord"("propertyId");
CREATE INDEX "FinancialRecord_parkingFacilityId_idx" ON "FinancialRecord"("parkingFacilityId");
CREATE INDEX "FinancialRecord_accessRecordId_idx" ON "FinancialRecord"("accessRecordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AccessRecord_entryAt_idx" ON "AccessRecord"("entryAt");

-- CreateIndex
CREATE INDEX "AccessRecord_exitAt_idx" ON "AccessRecord"("exitAt");

-- CreateIndex
CREATE INDEX "AccessRecord_status_idx" ON "AccessRecord"("status");

-- CreateIndex
CREATE INDEX "AccessRecord_branchId_idx" ON "AccessRecord"("branchId");

-- CreateIndex
CREATE INDEX "AccessRecord_propertyId_idx" ON "AccessRecord"("propertyId");

-- CreateIndex
CREATE INDEX "AccessRecord_parkingFacilityId_idx" ON "AccessRecord"("parkingFacilityId");
