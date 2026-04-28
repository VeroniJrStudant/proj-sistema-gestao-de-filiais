-- CreateTable
CREATE TABLE "ParticularService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "partyName" TEXT,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "monthlyAmountCents" INTEGER,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ParticularService_title_idx" ON "ParticularService"("title");

-- CreateIndex
CREATE INDEX "ParticularService_updatedAt_idx" ON "ParticularService"("updatedAt");
