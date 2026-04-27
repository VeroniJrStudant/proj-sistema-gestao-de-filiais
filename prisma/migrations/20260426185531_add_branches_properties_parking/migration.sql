-- CreateTable
CREATE TABLE "PhysicalRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmployeeJobRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RegistryCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "email" TEXT,
    "document" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OTHER',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "description" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "rentSuggestedCents" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'PERSON',
    "name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeaseContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "monthlyRentCents" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL DEFAULT 5,
    "depositCents" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaseContract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaseContract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParkingFacility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "branchId" TEXT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "addressLabel" TEXT,
    "capacityCars" INTEGER,
    "capacityMotorcycles" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParkingFacility_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MuralEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MuralEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "UserAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "entryAt" DATETIME,
    "exitAt" DATETIME,
    "note" TEXT,
    "alertFlag" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceRecord" ("date", "entryAt", "exitAt", "id", "note", "status", "studentId") SELECT "date", "entryAt", "exitAt", "id", "note", "status", "studentId" FROM "AttendanceRecord";
DROP TABLE "AttendanceRecord";
ALTER TABLE "new_AttendanceRecord" RENAME TO "AttendanceRecord";
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");
CREATE UNIQUE INDEX "AttendanceRecord_studentId_date_key" ON "AttendanceRecord"("studentId", "date");
CREATE TABLE "new_ClassRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "room" TEXT,
    "teacherName" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "year" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "shiftId" TEXT NOT NULL,
    "physicalRoomId" TEXT,
    CONSTRAINT "ClassRoom_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassRoom_physicalRoomId_fkey" FOREIGN KEY ("physicalRoomId") REFERENCES "PhysicalRoom" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ClassRoom" ("active", "capacity", "id", "name", "room", "shiftId", "teacherName", "year") SELECT "active", "capacity", "id", "name", "room", "shiftId", "teacherName", "year" FROM "ClassRoom";
DROP TABLE "ClassRoom";
ALTER TABLE "new_ClassRoom" RENAME TO "ClassRoom";
CREATE INDEX "ClassRoom_physicalRoomId_idx" ON "ClassRoom"("physicalRoomId");
CREATE TABLE "new_CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "legalName" TEXT,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "stateRegistration" TEXT,
    "municipalRegistration" TEXT,
    "phone" TEXT,
    "financeEmail" TEXT,
    "website" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "bankCode" TEXT,
    "bankName" TEXT,
    "agency" TEXT,
    "agencyDigit" TEXT,
    "accountNumber" TEXT,
    "accountDigit" TEXT,
    "accountType" TEXT,
    "pixKey" TEXT,
    "pixKeyType" TEXT,
    "boletoConvenio" TEXT,
    "boletoCarteira" TEXT,
    "boletoVariacao" TEXT,
    "boletoInstrucoes" TEXT,
    "boletoBatchNotes" TEXT,
    "invoicePaymentNotes" TEXT,
    "depositNotes" TEXT,
    "nfeNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CompanySettings" ("accountDigit", "accountNumber", "accountType", "agency", "agencyDigit", "bankCode", "bankName", "boletoBatchNotes", "boletoCarteira", "boletoConvenio", "boletoInstrucoes", "boletoVariacao", "city", "cnpj", "complement", "createdAt", "depositNotes", "financeEmail", "id", "invoicePaymentNotes", "legalName", "municipalRegistration", "neighborhood", "nfeNotes", "number", "phone", "pixKey", "pixKeyType", "state", "stateRegistration", "street", "tradeName", "updatedAt", "website", "zip") SELECT "accountDigit", "accountNumber", "accountType", "agency", "agencyDigit", "bankCode", "bankName", "boletoBatchNotes", "boletoCarteira", "boletoConvenio", "boletoInstrucoes", "boletoVariacao", "city", "cnpj", "complement", "createdAt", "depositNotes", "financeEmail", "id", "invoicePaymentNotes", "legalName", "municipalRegistration", "neighborhood", "nfeNotes", "number", "phone", "pixKey", "pixKeyType", "state", "stateRegistration", "street", "tradeName", "updatedAt", "website", "zip" FROM "CompanySettings";
DROP TABLE "CompanySettings";
ALTER TABLE "new_CompanySettings" RENAME TO "CompanySettings";
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
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_parkingFacilityId_fkey" FOREIGN KEY ("parkingFacilityId") REFERENCES "ParkingFacility" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialRecord" ("amountCents", "createdAt", "description", "direction", "dueDate", "externalRef", "id", "kind", "metadata", "settledAt", "status", "studentId", "updatedAt") SELECT "amountCents", "createdAt", "description", "direction", "dueDate", "externalRef", "id", "kind", "metadata", "settledAt", "status", "studentId", "updatedAt" FROM "FinancialRecord";
DROP TABLE "FinancialRecord";
ALTER TABLE "new_FinancialRecord" RENAME TO "FinancialRecord";
CREATE INDEX "FinancialRecord_dueDate_idx" ON "FinancialRecord"("dueDate");
CREATE INDEX "FinancialRecord_status_idx" ON "FinancialRecord"("status");
CREATE INDEX "FinancialRecord_kind_idx" ON "FinancialRecord"("kind");
CREATE INDEX "FinancialRecord_branchId_idx" ON "FinancialRecord"("branchId");
CREATE INDEX "FinancialRecord_propertyId_idx" ON "FinancialRecord"("propertyId");
CREATE INDEX "FinancialRecord_parkingFacilityId_idx" ON "FinancialRecord"("parkingFacilityId");
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productCategory" TEXT,
    "stockRegistryCategoryId" TEXT,
    "brand" TEXT,
    "sku" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "minQuantity" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "location" TEXT,
    "imageUrl" TEXT,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InventoryItem_stockRegistryCategoryId_fkey" FOREIGN KEY ("stockRegistryCategoryId") REFERENCES "RegistryCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("brand", "category", "createdAt", "id", "imageUrl", "location", "minQuantity", "name", "productCategory", "quantity", "sku", "unit", "unitPriceCents") SELECT "brand", "category", "createdAt", "id", "imageUrl", "location", "minQuantity", "name", "productCategory", "quantity", "sku", "unit", "unitPriceCents" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE INDEX "InventoryItem_stockRegistryCategoryId_idx" ON "InventoryItem"("stockRegistryCategoryId");
CREATE TABLE "new_Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "lessonDurationMinutes" INTEGER NOT NULL DEFAULT 45,
    "snackDurationMinutes" INTEGER NOT NULL DEFAULT 15
);
INSERT INTO "new_Shift" ("endTime", "id", "name", "startTime") SELECT "endTime", "id", "name", "startTime" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";
CREATE TABLE "new_Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierCode" TEXT,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
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
    "notes" TEXT,
    "paymentMethod" TEXT,
    "paymentDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "supplierCategoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Supplier_supplierCategoryId_fkey" FOREIGN KEY ("supplierCategoryId") REFERENCES "RegistryCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Supplier" ("active", "city", "complement", "createdAt", "document", "email", "id", "name", "neighborhood", "notes", "number", "paymentDate", "paymentMethod", "phone", "state", "street", "tradeName", "updatedAt", "zip") SELECT "active", "city", "complement", "createdAt", "document", "email", "id", "name", "neighborhood", "notes", "number", "paymentDate", "paymentMethod", "phone", "state", "street", "tradeName", "updatedAt", "zip" FROM "Supplier";
DROP TABLE "Supplier";
ALTER TABLE "new_Supplier" RENAME TO "Supplier";
CREATE UNIQUE INDEX "Supplier_supplierCode_key" ON "Supplier"("supplierCode");
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");
CREATE INDEX "Supplier_supplierCategoryId_idx" ON "Supplier"("supplierCategoryId");
CREATE TABLE "new_Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "jobRole" TEXT,
    "employeeJobRoleId" TEXT,
    "employeeCategoryId" TEXT,
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
    "dismissalDate" DATETIME,
    "salaryCents" INTEGER,
    "salaryPaymentMethod" TEXT,
    "salaryPaymentDay" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Teacher_employeeJobRoleId_fkey" FOREIGN KEY ("employeeJobRoleId") REFERENCES "EmployeeJobRole" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Teacher_employeeCategoryId_fkey" FOREIGN KEY ("employeeCategoryId") REFERENCES "RegistryCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Teacher" ("active", "admissionDate", "birthDate", "city", "complement", "createdAt", "dismissalDate", "document", "email", "employeeCode", "id", "jobRole", "name", "neighborhood", "nickname", "notes", "number", "phone", "photoUrl", "salaryCents", "salaryPaymentDay", "salaryPaymentMethod", "specialty", "state", "street", "updatedAt", "workCardNumber", "workCardSeries", "workCardUf", "zip") SELECT "active", "admissionDate", "birthDate", "city", "complement", "createdAt", "dismissalDate", "document", "email", "employeeCode", "id", "jobRole", "name", "neighborhood", "nickname", "notes", "number", "phone", "photoUrl", "salaryCents", "salaryPaymentDay", "salaryPaymentMethod", "specialty", "state", "street", "updatedAt", "workCardNumber", "workCardSeries", "workCardUf", "zip" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_employeeCode_key" ON "Teacher"("employeeCode");
CREATE INDEX "Teacher_employeeJobRoleId_idx" ON "Teacher"("employeeJobRoleId");
CREATE INDEX "Teacher_employeeCategoryId_idx" ON "Teacher"("employeeCategoryId");
CREATE TABLE "new_UserAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "loginName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "document" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT NOT NULL,
    "profileRole" TEXT NOT NULL,
    "permissionsJson" TEXT NOT NULL DEFAULT '[]',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "guardianId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserAccount_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserAccount" ("active", "createdAt", "displayName", "email", "guardianId", "id", "loginName", "passwordHash", "permissionsJson", "profileRole", "twoFactorEnabled", "twoFactorSecret", "updatedAt") SELECT "active", "createdAt", "displayName", "email", "guardianId", "id", "loginName", "passwordHash", "permissionsJson", "profileRole", "twoFactorEnabled", "twoFactorSecret", "updatedAt" FROM "UserAccount";
DROP TABLE "UserAccount";
ALTER TABLE "new_UserAccount" RENAME TO "UserAccount";
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "UserAccount_loginName_key" ON "UserAccount"("loginName");
CREATE INDEX "UserAccount_guardianId_idx" ON "UserAccount"("guardianId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalRoom_code_key" ON "PhysicalRoom"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeJobRole_name_key" ON "EmployeeJobRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RegistryCategory_name_scope_key" ON "RegistryCategory"("name", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_name_idx" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

-- CreateIndex
CREATE INDEX "Property_branchId_idx" ON "Property"("branchId");

-- CreateIndex
CREATE INDEX "Property_name_idx" ON "Property"("name");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Tenant_name_idx" ON "Tenant"("name");

-- CreateIndex
CREATE INDEX "LeaseContract_propertyId_idx" ON "LeaseContract"("propertyId");

-- CreateIndex
CREATE INDEX "LeaseContract_tenantId_idx" ON "LeaseContract"("tenantId");

-- CreateIndex
CREATE INDEX "LeaseContract_status_idx" ON "LeaseContract"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingFacility_code_key" ON "ParkingFacility"("code");

-- CreateIndex
CREATE INDEX "ParkingFacility_branchId_idx" ON "ParkingFacility"("branchId");

-- CreateIndex
CREATE INDEX "ParkingFacility_name_idx" ON "ParkingFacility"("name");

-- CreateIndex
CREATE INDEX "ParkingFacility_status_idx" ON "ParkingFacility"("status");

-- CreateIndex
CREATE INDEX "MuralEvent_startsAt_idx" ON "MuralEvent"("startsAt");

-- CreateIndex
CREATE INDEX "MuralEvent_endsAt_idx" ON "MuralEvent"("endsAt");

-- CreateIndex
CREATE INDEX "MuralEvent_createdByUserId_idx" ON "MuralEvent"("createdByUserId");
