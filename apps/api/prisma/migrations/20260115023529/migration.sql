-- DropIndex
DROP INDEX "Application_createdAt_id_idx";

-- DropIndex
DROP INDEX "Candidate_createdAt_id_idx";

-- DropIndex
DROP INDEX "InterviewNote_createdAt_id_idx";

-- CreateIndex
CREATE INDEX "Application_createdAt_id_idx" ON "Application"("createdAt", "id");

-- CreateIndex
CREATE INDEX "Candidate_createdAt_id_idx" ON "Candidate"("createdAt", "id");

-- CreateIndex
CREATE INDEX "InterviewNote_createdAt_id_idx" ON "InterviewNote"("createdAt", "id");
