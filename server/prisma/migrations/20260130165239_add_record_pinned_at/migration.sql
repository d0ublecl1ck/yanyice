-- AlterTable
ALTER TABLE "ConsultationRecord" ADD COLUMN "pinnedAt" DATETIME;

-- CreateIndex
CREATE INDEX "ConsultationRecord_userId_module_pinnedAt_idx" ON "ConsultationRecord"("userId", "module", "pinnedAt");
