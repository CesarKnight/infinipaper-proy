CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "ResourceEventType" AS ENUM ('VIEW', 'DOWNLOAD', 'SEARCH_HIT', 'QUIZ_USE');

-- CreateTable
CREATE TABLE "ResourceEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "resourceId" TEXT,
    "userId" TEXT,
    "type" "ResourceEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceChunk" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentIndexJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "resourceId" TEXT,
    "status" "AgentJobStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentIndexJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpToken" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McpToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceEvent_projectId_createdAt_idx" ON "ResourceEvent"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceEvent_resourceId_createdAt_idx" ON "ResourceEvent"("resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceEvent_type_idx" ON "ResourceEvent"("type");

-- CreateIndex
CREATE INDEX "ResourceChunk_resourceId_idx" ON "ResourceChunk"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceChunk_resourceId_chunkIndex_key" ON "ResourceChunk"("resourceId", "chunkIndex");

-- CreateIndex
CREATE INDEX "ContentIndexJob_projectId_status_idx" ON "ContentIndexJob"("projectId", "status");

-- CreateIndex
CREATE INDEX "ContentIndexJob_resourceId_idx" ON "ContentIndexJob"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "McpToken_tokenHash_key" ON "McpToken"("tokenHash");

-- CreateIndex
CREATE INDEX "McpToken_ownerId_idx" ON "McpToken"("ownerId");

-- CreateIndex
CREATE INDEX "McpToken_projectId_idx" ON "McpToken"("projectId");

-- AddForeignKey
ALTER TABLE "ResourceEvent" ADD CONSTRAINT "ResourceEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceEvent" ADD CONSTRAINT "ResourceEvent_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceEvent" ADD CONSTRAINT "ResourceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceChunk" ADD CONSTRAINT "ResourceChunk_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentIndexJob" ADD CONSTRAINT "ContentIndexJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentIndexJob" ADD CONSTRAINT "ContentIndexJob_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpToken" ADD CONSTRAINT "McpToken_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpToken" ADD CONSTRAINT "McpToken_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Vector and full-text indexes
CREATE INDEX "ResourceChunk_embedding_hnsw_idx" ON "ResourceChunk" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "ResourceChunk_content_fts_idx" ON "ResourceChunk" USING GIN (to_tsvector('spanish', "content"));
