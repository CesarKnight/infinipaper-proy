import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import { UsageService } from '../usage/usage.service.js';
import { EmbeddingsService } from './embeddings.service.js';
import { SearchIndexQueueService } from './search.queue.js';
import type { SearchQueryDto } from './dto/search-query.dto.js';

interface SearchRow {
  id: string;
  resourceId: string;
  chunkIndex: number;
  content: string;
  name: string;
  kind: string;
  origin: string;
  validationStatus: string;
  vectorScore: number;
  textScore: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly topK: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly permissions: PermissionsService,
    private readonly embeddings: EmbeddingsService,
    private readonly queue: SearchIndexQueueService,
    private readonly usage: UsageService,
    config: ConfigService,
  ) {
    this.topK = config.get<number>('SEARCH_TOP_K') ?? 10;
  }

  async enqueueResource(resourceId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      select: { folder: { select: { projectId: true } } },
    });
    if (!resource) return null;
    const active = await this.prisma.contentIndexJob.findFirst({
      where: {
        resourceId,
        status: { in: ['QUEUED', 'PROCESSING'] },
      },
      select: { id: true },
    });
    if (active) return active;
    const job = await this.prisma.contentIndexJob.create({
      data: {
        projectId: resource.folder.projectId,
        resourceId,
      },
    });
    await this.queue.enqueue(job.id);
    return job;
  }

  async reindexProject(projectId: string, userId: string) {
    await this.permissions.assertProjectRole(userId, projectId, 'editor');
    const active = await this.prisma.contentIndexJob.findFirst({
      where: {
        projectId,
        resourceId: null,
        status: { in: ['QUEUED', 'PROCESSING'] },
      },
      select: { id: true },
    });
    if (active) {
      throw new AppException(
        'INDEX_IN_PROGRESS',
        'Ya hay una reindexación en curso',
        HttpStatus.CONFLICT,
      );
    }
    const job = await this.prisma.contentIndexJob.create({
      data: { projectId },
    });
    await this.queue.enqueue(job.id);
    return job;
  }

  async status(projectId: string, userId: string) {
    await this.permissions.assertProjectRole(userId, projectId, 'editor');
    const jobs = await this.prisma.contentIndexJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return {
      jobs,
      lastJob: jobs[0] ?? null,
      pending: jobs.filter((job) => ['QUEUED', 'PROCESSING'].includes(job.status))
        .length,
    };
  }

  async search(projectId: string, userId: string, dto: SearchQueryDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new AppException(
        'PROJECT_NOT_FOUND',
        'Proyecto no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    const role = await this.permissions.resolveRole(userId, project);
    if (!role) {
      throw new AppException(
        'PROJECT_FORBIDDEN',
        'No tienes acceso a este proyecto',
        HttpStatus.FORBIDDEN,
      );
    }
    const q = dto.q.trim();
    if (!q) {
      throw new AppException(
        'SEARCH_QUERY_REQUIRED',
        'La búsqueda no puede estar vacía',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (dto.folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: dto.folderId },
        select: { projectId: true },
      });
      if (!folder || folder.projectId !== projectId) {
        throw new AppException(
          'INVALID_FILTER',
          'La carpeta no pertenece al proyecto',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    let vector: string | null = null;
    let warning: string | null = null;
    let mode: 'hybrid' | 'lexical' = 'hybrid';
    try {
      vector = this.embeddings.vectorLiteral(await this.embeddings.embed(q));
    } catch (error) {
      mode = 'lexical';
      warning = 'El proveedor de embeddings falló; se usó búsqueda léxica.';
      this.logger.warn((error as Error).message);
    }

    const rows = await this.query(projectId, dto, q, vector);
    void Promise.all(
      rows.slice(0, 10).map((row) =>
        this.usage.recordSearchHit(row.resourceId, userId),
      ),
    );
    return {
      mode,
      warning,
      query: q,
      results: rows.map((row) => ({
        resourceId: row.resourceId,
        chunkId: row.id,
        name: row.name,
        kind: row.kind,
        origin: row.origin,
        validationStatus: row.validationStatus,
        fragment: row.content.slice(0, 500),
        score: round(row.vectorScore * 0.7 + row.textScore * 0.3),
      })),
    };
  }

  async process(jobId: string): Promise<void> {
    const job = await this.prisma.contentIndexJob.findUnique({
      where: { id: jobId },
    });
    if (!job || job.status === 'DONE') return;
    await this.prisma.contentIndexJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });
    try {
      if (job.resourceId) {
        await this.indexResource(job.resourceId);
      } else {
        const resources = await this.prisma.resource.findMany({
          where: {
            folder: { projectId: job.projectId },
            kind: { in: ['MARKDOWN', 'QUIZ', 'AUDIO', 'MINDMAP'] },
          },
          select: { id: true },
        });
        for (const resource of resources) {
          await this.indexResource(resource.id);
        }
      }
      await this.prisma.contentIndexJob.update({
        where: { id: jobId },
        data: { status: 'DONE', error: null },
      });
    } catch (error) {
      const code =
        error instanceof AppException ? error.code : 'INDEX_FAILED';
      this.logger.error(`Index job ${jobId} failed: ${code}`);
      await this.prisma.contentIndexJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: code },
      });
    }
  }

  private async indexResource(resourceId: string): Promise<void> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        folder: { select: { projectId: true } },
        quiz: {
          include: {
            questions: { include: { options: true }, orderBy: { order: 'asc' } },
          },
        },
        transcriptions: {
          where: { status: 'DONE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!resource) return;

    let text = '';
    if (resource.kind === 'MARKDOWN') {
      const object = await this.storage.get(resource.s3Key);
      text = await streamToText(object.body);
    } else if (resource.kind === 'QUIZ' && resource.quiz) {
      text = [
        resource.quiz.title,
        resource.quiz.instructions ?? '',
        ...resource.quiz.questions.map(
          (question) =>
            `${question.prompt}\n${question.options.map((option) => option.text).join('\n')}`,
        ),
      ].join('\n\n');
    } else if (resource.kind === 'AUDIO') {
      text = resource.transcriptions[0]?.text ?? '';
    } else if (resource.kind === 'MINDMAP') {
      const object = await this.storage.get(resource.s3Key);
      text = await streamToText(object.body);
    }
    if (!text.trim()) return;

    const chunks = chunkText(text);
    await this.prisma.resourceChunk.deleteMany({ where: { resourceId } });
    for (const [index, content] of chunks.entries()) {
      const chunk = await this.prisma.resourceChunk.create({
        data: {
          resourceId,
          chunkIndex: index,
          content,
          tokens: content.split(/\s+/).length,
          metadata: {
            name: resource.name,
            kind: resource.kind,
            origin: resource.origin,
            validationStatus: resource.validationStatus,
          } as Prisma.InputJsonValue,
        },
      });
      try {
        const vector = this.embeddings.vectorLiteral(
          await this.embeddings.embed(content),
        );
        await this.prisma.$executeRawUnsafe(
          'UPDATE "ResourceChunk" SET "embedding" = $1::vector WHERE "id" = $2',
          vector,
          chunk.id,
        );
      } catch (error) {
        this.logger.warn(
          `Chunk ${chunk.id} sin embedding: ${(error as Error).message}`,
        );
      }
    }
  }

  private async query(
    projectId: string,
    dto: SearchQueryDto,
    q: string,
    vector: string | null,
  ): Promise<SearchRow[]> {
    const params: unknown[] = [
      vector,
      q,
      projectId,
      dto.folderId ?? null,
      dto.kind ?? null,
      dto.origin ?? null,
      dto.validationStatus ?? null,
      this.topK,
    ];
    const vectorExpr = vector
      ? '(1 - (c."embedding" <=> $1::vector))'
      : '0';
    const embeddingCondition = vector ? 'AND c."embedding" IS NOT NULL' : '';
    const sql = `
      SELECT c."id", c."resourceId", c."chunkIndex", c."content",
             r."name", r."kind"::text AS kind, r."origin"::text AS origin,
             r."validationStatus"::text AS "validationStatus",
             ${vectorExpr} AS "vectorScore",
             ts_rank_cd(to_tsvector('spanish', c."content"), plainto_tsquery('spanish', $2)) AS "textScore"
      FROM "ResourceChunk" c
      JOIN "Resource" r ON r."id" = c."resourceId"
      JOIN "Folder" f ON f."id" = r."folderId"
      WHERE f."projectId" = $3
        ${embeddingCondition}
        AND ($4::text IS NULL OR f."id" = $4)
        AND ($5::text IS NULL OR r."kind"::text = $5)
        AND ($6::text IS NULL OR r."origin"::text = $6)
        AND ($7::text IS NULL OR r."validationStatus"::text = $7)
      ORDER BY (${vectorExpr} * 0.7 +
        ts_rank_cd(to_tsvector('spanish', c."content"), plainto_tsquery('spanish', $2)) * 0.3) DESC
      LIMIT $8
    `;
    const rows = await this.prisma.$queryRawUnsafe<SearchRow[]>(sql, ...params);
    return rows;
  }
}

function chunkText(text: string): string[] {
  const normalized = text.replace(/\r/g, '').trim();
  const chunks: string[] = [];
  const size = 1200;
  const overlap = 200;
  for (let start = 0; start < normalized.length; start += size - overlap) {
    const chunk = normalized.slice(start, start + size).trim();
    if (chunk) chunks.push(chunk);
    if (start + size >= normalized.length) break;
  }
  return chunks;
}

async function streamToText(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
