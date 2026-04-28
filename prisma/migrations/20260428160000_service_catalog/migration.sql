-- CreateTable
CREATE TABLE "ServiceCatalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ServiceCatalog_name_idx" ON "ServiceCatalog"("name");

-- CreateIndex
CREATE INDEX "ServiceCatalog_active_idx" ON "ServiceCatalog"("active");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ParticularService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "serviceCatalogId" TEXT,
    "partyName" TEXT,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "monthlyAmountCents" INTEGER,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParticularService_serviceCatalogId_fkey" FOREIGN KEY ("serviceCatalogId") REFERENCES "ServiceCatalog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ParticularService" ("id", "title", "partyName", "document", "phone", "email", "monthlyAmountCents", "startsAt", "endsAt", "notes", "createdAt", "updatedAt") SELECT "id", "title", "partyName", "document", "phone", "email", "monthlyAmountCents", "startsAt", "endsAt", "notes", "createdAt", "updatedAt" FROM "ParticularService";
DROP TABLE "ParticularService";
ALTER TABLE "new_ParticularService" RENAME TO "ParticularService";
CREATE INDEX "ParticularService_title_idx" ON "ParticularService"("title");
CREATE INDEX "ParticularService_updatedAt_idx" ON "ParticularService"("updatedAt");
CREATE INDEX "ParticularService_serviceCatalogId_idx" ON "ParticularService"("serviceCatalogId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
