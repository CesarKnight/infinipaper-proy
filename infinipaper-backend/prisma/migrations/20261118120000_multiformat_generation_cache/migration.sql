-- AlterTable
ALTER TABLE "ContentGenerationJob"
  ADD COLUMN "activeKey" TEXT,
  ADD COLUMN "progress" JSONB,
  ADD COLUMN "sourceId" TEXT,
  ADD COLUMN "sourceType" TEXT,
  ADD COLUMN "stage" TEXT;

-- CreateTable
CREATE TABLE "ResourceExtraction" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "checksum" TEXT,
    "extractor" TEXT NOT NULL,
    "extractorVersion" TEXT NOT NULL,
    "status" "AgentJobStatus" NOT NULL DEFAULT 'QUEUED',
    "content" TEXT,
    "metadata" JSONB,
    "warnings" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceExtraction_resourceId_status_idx"
  ON "ResourceExtraction"("resourceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceExtraction_resourceId_checksum_extractorVersion_key"
  ON "ResourceExtraction"("resourceId", "checksum", "extractorVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ContentGenerationJob_activeKey_key"
  ON "ContentGenerationJob"("activeKey");

-- CreateIndex
CREATE INDEX "ContentGenerationJob_folderId_status_idx"
  ON "ContentGenerationJob"("folderId", "status");

-- AddForeignKey
ALTER TABLE "ResourceExtraction"
  ADD CONSTRAINT "ResourceExtraction_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
