-- AlterTable
ALTER TABLE "Guardian" ADD COLUMN "city" TEXT;
ALTER TABLE "Guardian" ADD COLUMN "complement" TEXT;
ALTER TABLE "Guardian" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "Guardian" ADD COLUMN "number" TEXT;
ALTER TABLE "Guardian" ADD COLUMN "state" TEXT;
ALTER TABLE "Guardian" ADD COLUMN "street" TEXT;
ALTER TABLE "Guardian" ADD COLUMN "zip" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "allergies" TEXT;
ALTER TABLE "Student" ADD COLUMN "dietaryNotes" TEXT;
ALTER TABLE "Student" ADD COLUMN "healthNotes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentGuardian" (
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relation" TEXT,
    "pickupAuthorized" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("studentId", "guardianId"),
    CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentGuardian" ("guardianId", "relation", "studentId") SELECT "guardianId", "relation", "studentId" FROM "StudentGuardian";
DROP TABLE "StudentGuardian";
ALTER TABLE "new_StudentGuardian" RENAME TO "StudentGuardian";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
