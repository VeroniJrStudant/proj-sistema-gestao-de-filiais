-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matricula" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "birthDate" DATETIME,
    "notes" TEXT,
    "allergies" TEXT,
    "healthNotes" TEXT,
    "dietaryNotes" TEXT,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Student" ("allergies", "birthDate", "createdAt", "dietaryNotes", "healthNotes", "id", "matricula", "name", "notes", "photoUrl", "updatedAt") SELECT "allergies", "birthDate", "createdAt", "dietaryNotes", "healthNotes", "id", "matricula", "name", "notes", "photoUrl", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_matricula_key" ON "Student"("matricula");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
