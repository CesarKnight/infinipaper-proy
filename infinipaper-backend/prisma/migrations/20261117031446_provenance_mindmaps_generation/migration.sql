-- CreateEnum
CREATE TYPE "ResourceOrigin" AS ENUM ('UPLOAD', 'NOTE', 'TRANSCRIPTION', 'AI_STRUCTURE', 'AI_MINDMAP', 'AI_QUIZ', 'QUIZ', 'IMPORT');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResourceSourceRelation" AS ENUM ('DERIVED_FROM', 'CITES', 'USES');

-- CreateEnum
CREATE TYPE "ContentGenerationType" AS ENUM ('MINDMAP', 'QUIZ');

-- AlterEnum
ALTER TYPE "ResourceKind" ADD VALUE 'MINDMAP';

-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "sourceRefs" JSONB;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "origin" "ResourceOrigin" NOT NULL DEFAULT 'UPLOAD',
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedById" TEXT,
ADD COLUMN     "validationNote" TEXT,
ADD COLUMN     "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'UNVERIFIED';

-- CreateTable
CREATE TABLE "ResourceSource" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "sourceResourceId" TEXT,
    "relation" "ResourceSourceRelation" NOT NULL DEFAULT 'DERIVED_FROM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentGenerationJob" (
    "id" TEXT NOT NULL,
    "type" "ContentGenerationType" NOT NULL,
    "folderId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "AgentJobStatus" NOT NULL DEFAULT 'QUEUED',
    "sources" JSONB NOT NULL,
    "config" JSONB,
    "resultJson" JSONB,
    "resultResourceId" TEXT,
    "warnings" JSONB,
    "error" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceSource_resourceId_idx" ON "ResourceSource"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceSource_sourceResourceId_idx" ON "ResourceSource"("sourceResourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceSource_resourceId_sourceResourceId_relation_key" ON "ResourceSource"("resourceId", "sourceResourceId", "relation");

-- CreateIndex
CREATE UNIQUE INDEX "ContentGenerationJob_resultResourceId_key" ON "ContentGenerationJob"("resultResourceId");

-- CreateIndex
CREATE INDEX "ContentGenerationJob_folderId_idx" ON "ContentGenerationJob"("folderId");

-- CreateIndex
CREATE INDEX "ContentGenerationJob_requestedById_idx" ON "ContentGenerationJob"("requestedById");

-- CreateIndex
CREATE INDEX "ContentGenerationJob_status_idx" ON "ContentGenerationJob"("status");

-- CreateIndex
CREATE INDEX "ContentGenerationJob_type_idx" ON "ContentGenerationJob"("type");

-- CreateIndex
CREATE INDEX "Resource_origin_idx" ON "Resource"("origin");

-- CreateIndex
CREATE INDEX "Resource_validationStatus_idx" ON "Resource"("validationStatus");

-- CreateIndex
CREATE INDEX "Resource_validatedById_idx" ON "Resource"("validatedById");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSource" ADD CONSTRAINT "ResourceSource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceSource" ADD CONSTRAINT "ResourceSource_sourceResourceId_fkey" FOREIGN KEY ("sourceResourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGenerationJob" ADD CONSTRAINT "ContentGenerationJob_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGenerationJob" ADD CONSTRAINT "ContentGenerationJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGenerationJob" ADD CONSTRAINT "ContentGenerationJob_resultResourceId_fkey" FOREIGN KEY ("resultResourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
