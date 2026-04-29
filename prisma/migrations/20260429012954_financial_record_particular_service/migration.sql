/*
  Warnings:

  - You are about to alter the column `active` on the `ServiceCatalog` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
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
    "particularServiceId" TEXT,
    "accessRecordId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_parkingFacilityId_fkey" FOREIGN KEY ("parkingFacilityId") REFERENCES "ParkingFacility" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_particularServiceId_fkey" FOREIGN KEY ("particularServiceId") REFERENCES "ParticularService" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_accessRecordId_fkey" FOREIGN KEY ("accessRecordId") REFERENCES "AccessRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialRecord" ("accessRecordId", "amountCents", "branchId", "createdAt", "description", "direction", "dueDate", "externalRef", "id", "kind", "metadata", "parkingFacilityId", "propertyId", "settledAt", "status", "studentId", "updatedAt") SELECT "accessRecordId", "amountCents", "branchId", "createdAt", "description", "direction", "dueDate", "externalRef", "id", "kind", "metadata", "parkingFacilityId", "propertyId", "settledAt", "status", "studentId", "updatedAt" FROM "FinancialRecord";
DROP TABLE "FinancialRecord";
ALTER TABLE "new_FinancialRecord" RENAME TO "FinancialRecord";
CREATE INDEX "FinancialRecord_dueDate_idx" ON "FinancialRecord"("dueDate");
CREATE INDEX "FinancialRecord_status_idx" ON "FinancialRecord"("status");
CREATE INDEX "FinancialRecord_kind_idx" ON "FinancialRecord"("kind");
CREATE INDEX "FinancialRecord_branchId_idx" ON "FinancialRecord"("branchId");
CREATE INDEX "FinancialRecord_propertyId_idx" ON "FinancialRecord"("propertyId");
CREATE INDEX "FinancialRecord_parkingFacilityId_idx" ON "FinancialRecord"("parkingFacilityId");
CREATE INDEX "FinancialRecord_particularServiceId_idx" ON "FinancialRecord"("particularServiceId");
CREATE INDEX "FinancialRecord_accessRecordId_idx" ON "FinancialRecord"("accessRecordId");
CREATE TABLE "new_ServiceCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ServiceCatalog" ("active", "createdAt", "description", "id", "name", "updatedAt") SELECT "active", "createdAt", "description", "id", "name", "updatedAt" FROM "ServiceCatalog";
DROP TABLE "ServiceCatalog";
ALTER TABLE "new_ServiceCatalog" RENAME TO "ServiceCatalog";
CREATE INDEX "ServiceCatalog_name_idx" ON "ServiceCatalog"("name");
CREATE INDEX "ServiceCatalog_active_idx" ON "ServiceCatalog"("active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
