-- CreateTable
CREATE TABLE "ConsultationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT 'liuyao',
    "customerId" TEXT,
    "customerName" TEXT,
    "subject" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "liuyaoDataJson" TEXT,
    "baziDataJson" TEXT,
    "verifiedStatus" TEXT NOT NULL DEFAULT 'unverified',
    "verifiedNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsultationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ConsultationRecord_userId_module_createdAt_idx" ON "ConsultationRecord"("userId", "module", "createdAt");
