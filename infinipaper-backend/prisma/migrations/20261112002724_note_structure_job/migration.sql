-- CreateEnum
CREATE TYPE "AgentJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "NoteStructureJob" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "AgentJobStatus" NOT NULL DEFAULT 'QUEUED',
    "language" TEXT NOT NULL DEFAULT 'es',
    "instructions" TEXT,
    "sourceChecksum" TEXT,
    "resultMarkdown" TEXT,
    "resultResourceId" TEXT,
    "warnings" JSONB,
    "error" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteStructureJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoteStructureJob_resultResourceId_key" ON "NoteStructureJob"("resultResourceId");

-- CreateIndex
CREATE INDEX "NoteStructureJob_resourceId_idx" ON "NoteStructureJob"("resourceId");

-- CreateIndex
CREATE INDEX "NoteStructureJob_status_idx" ON "NoteStructureJob"("status");

-- AddForeignKey
ALTER TABLE "NoteStructureJob" ADD CONSTRAINT "NoteStructureJob_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteStructureJob" ADD CONSTRAINT "NoteStructureJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteStructureJob" ADD CONSTRAINT "NoteStructureJob_resultResourceId_fkey" FOREIGN KEY ("resultResourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
