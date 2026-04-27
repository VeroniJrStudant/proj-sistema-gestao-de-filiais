-- Redefine StudentMessage with direction + readAt (SQLite: recreate table)
PRAGMA foreign_keys=OFF;

CREATE TABLE "StudentMessage_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "body" TEXT NOT NULL,
    "authorLabel" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'SCHOOL_TO_FAMILY',
    "readAt" DATETIME,
    "toEmailsJson" TEXT NOT NULL DEFAULT '[]',
    "toPhonesJson" TEXT NOT NULL DEFAULT '[]',
    "deliveryStatus" TEXT NOT NULL DEFAULT 'QUEUED',
    "deliveryDetailsJson" TEXT,
    CONSTRAINT "StudentMessage_new_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "StudentMessage_new" ("id", "studentId", "createdAt", "body", "authorLabel", "direction", "readAt", "toEmailsJson", "toPhonesJson", "deliveryStatus", "deliveryDetailsJson")
SELECT "id", "studentId", "createdAt", "body", "authorLabel", 'SCHOOL_TO_FAMILY', NULL, "toEmailsJson", "toPhonesJson", "deliveryStatus", "deliveryDetailsJson"
FROM "StudentMessage";

DROP TABLE "StudentMessage";
ALTER TABLE "StudentMessage_new" RENAME TO "StudentMessage";

CREATE INDEX "StudentMessage_studentId_createdAt_idx" ON "StudentMessage"("studentId", "createdAt");
CREATE INDEX "StudentMessage_studentId_direction_readAt_idx" ON "StudentMessage"("studentId", "direction", "readAt");

PRAGMA foreign_keys=ON;
