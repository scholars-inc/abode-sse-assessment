-- Ensure ATS sync idempotency and speed up dashboard pagination/aggregations

-- Candidate
CREATE UNIQUE INDEX IF NOT EXISTS "Candidate_externalId_key" ON "Candidate"("externalId");
CREATE INDEX IF NOT EXISTS "Candidate_createdAt_id_idx" ON "Candidate"("createdAt" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "Candidate_email_idx" ON "Candidate"("email");

-- Application
CREATE INDEX IF NOT EXISTS "Application_candidateId_idx" ON "Application"("candidateId");
CREATE INDEX IF NOT EXISTS "Application_createdAt_id_idx" ON "Application"("createdAt" DESC, "id" DESC);

-- InterviewNote
CREATE INDEX IF NOT EXISTS "InterviewNote_candidateId_idx" ON "InterviewNote"("candidateId");
CREATE INDEX IF NOT EXISTS "InterviewNote_applicationId_idx" ON "InterviewNote"("applicationId");
CREATE INDEX IF NOT EXISTS "InterviewNote_createdAt_id_idx" ON "InterviewNote"("createdAt" DESC, "id" DESC);

