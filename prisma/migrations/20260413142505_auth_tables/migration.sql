-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "loginName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT NOT NULL,
    "profileRole" TEXT NOT NULL,
    "permissionsJson" TEXT NOT NULL DEFAULT '[]',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "detailsJson" TEXT,
    "ip" TEXT,
    CONSTRAINT "UserActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "UserAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "body" TEXT NOT NULL,
    "authorLabel" TEXT,
    "toEmailsJson" TEXT NOT NULL DEFAULT '[]',
    "toPhonesJson" TEXT NOT NULL DEFAULT '[]',
    "deliveryStatus" TEXT NOT NULL DEFAULT 'QUEUED',
    "deliveryDetailsJson" TEXT,
    CONSTRAINT "StudentMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AcceptedSchoolPaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AcceptedSchoolPaymentMethod" ("active", "code", "createdAt", "id", "notes", "sortOrder", "updatedAt") SELECT "active", "code", "createdAt", "id", "notes", "sortOrder", "updatedAt" FROM "AcceptedSchoolPaymentMethod";
DROP TABLE "AcceptedSchoolPaymentMethod";
ALTER TABLE "new_AcceptedSchoolPaymentMethod" RENAME TO "AcceptedSchoolPaymentMethod";
CREATE UNIQUE INDEX "AcceptedSchoolPaymentMethod_code_key" ON "AcceptedSchoolPaymentMethod"("code");
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productCategory" TEXT,
    "brand" TEXT,
    "sku" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "minQuantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "location" TEXT,
    "imageUrl" TEXT,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_InventoryItem" ("brand", "category", "id", "imageUrl", "location", "minQuantity", "name", "productCategory", "quantity", "sku", "unit", "unitPriceCents") SELECT "brand", "category", "id", "imageUrl", "location", "minQuantity", "name", "productCategory", "quantity", "sku", "unit", "unitPriceCents" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE TABLE "new_Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "birthDate" DATETIME,
    "phone" TEXT,
    "email" TEXT,
    "document" TEXT,
    "specialty" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "workCardNumber" TEXT,
    "workCardSeries" TEXT,
    "workCardUf" TEXT,
    "admissionDate" DATETIME,
    "salaryCents" INTEGER,
    "salaryPaymentMethod" TEXT,
    "salaryPaymentDay" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Teacher" ("active", "admissionDate", "birthDate", "city", "complement", "createdAt", "document", "email", "employeeCode", "id", "name", "neighborhood", "notes", "number", "phone", "photoUrl", "salaryCents", "salaryPaymentDay", "salaryPaymentMethod", "specialty", "state", "street", "updatedAt", "workCardNumber", "workCardSeries", "workCardUf", "zip") SELECT "active", "admissionDate", "birthDate", "city", "complement", "createdAt", "document", "email", "employeeCode", "id", "name", "neighborhood", "notes", "number", "phone", "photoUrl", "salaryCents", "salaryPaymentDay", "salaryPaymentMethod", "specialty", "state", "street", "updatedAt", "workCardNumber", "workCardSeries", "workCardUf", "zip" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_employeeCode_key" ON "Teacher"("employeeCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_loginName_key" ON "UserAccount"("loginName");

-- CreateIndex
CREATE INDEX "UserActivityLog_createdAt_idx" ON "UserActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "UserActivityLog_actorUserId_idx" ON "UserActivityLog"("actorUserId");

-- CreateIndex
CREATE INDEX "UserActivityLog_action_idx" ON "UserActivityLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "StudentMessage_studentId_createdAt_idx" ON "StudentMessage"("studentId", "createdAt");
