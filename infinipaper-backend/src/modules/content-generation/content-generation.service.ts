import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import { ProvenanceService } from '../provenance/provenance.service.js';
import { QuizzesService } from '../quizzes/quizzes.service.js';
import { ResourcesService } from '../resources/resources.service.js';
import { ContentAgentClient } from './content-agent.client.js';
import { ContentGenerationQueueService } from './content-generation.queue.js';
import type {
  CreateMindmapDto,
  CreateQuizGenerationDto,
} from './dto/content-generation.dto.js';

interface JobSource {
  resourceId: string;
  name: string;
  mimeType: string;
  size: number;
  checksum: string | null;
}

interface MindmapNode {
  id: string;
  label: string;
  type?: string;
  description?: string;
}

interface MindmapEdge {
  source: string;
  target: string;
  label?: string;
}

interface MindmapPayload {
  title: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  sources?: string[];
}

interface GeneratedQuizQuestion {
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  prompt: string;
  points?: number;
  correctText?: string;
  caseSensitive?: boolean;
  options?: Array<{ text: string; isCorrect: boolean }>;
  sourceRefs?: string[];
}

interface GeneratedQuizPayload {
  title: string;
  instructions?: string;
  questions: GeneratedQuizQuestion[];
}

const MINDMAP_MIME = 'application/vnd.infinipaper.mindmap+json';

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);
  private readonly presignTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly permissions: PermissionsService,
    private readonly provenance: ProvenanceService,
    private readonly resources: ResourcesService,
    private readonly quizzes: QuizzesService,
    private readonly agent: ContentAgentClient,
    private readonly queue: ContentGenerationQueueService,
    config: ConfigService,
  ) {
    this.presignTtlSeconds = config.get<number>('S3_PRESIGN_TTL_SECONDS', 900);
  }

  async createMindmap(
    folderId: string,
    userId: string,
    dto: CreateMindmapDto,
  ) {
    const job = await this.createJob(
      'MINDMAP',
      folderId,
      userId,
      dto.source,
      { instructions: dto.instructions ?? null },
    );
    await this.queue.enqueue(job.id);
    return job;
  }

  async createQuiz(
    folderId: string,
    userId: string,
    dto: CreateQuizGenerationDto,
  ) {
    const job = await this.createJob(
      'QUIZ',
      folderId,
      userId,
      dto.source,
      {
        count: dto.count,
        difficulty: dto.difficulty,
        types: dto.types,
        instructions: dto.instructions ?? null,
      },
    );
    await this.queue.enqueue(job.id);
    return job;
  }

  async getJob(jobId: string, userId: string) {
    const job = await this.prisma.contentGenerationJob.findUnique({
      where: { id: jobId },
      include: { folder: { select: { projectId: true } } },
    });
    if (!job) {
      throw new AppException(
        'GENERATION_JOB_NOT_FOUND',
        'Job de generación no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.permissions.assertProjectRole(
      userId,
      job.folder.projectId,
      'editor',
    );
    return job;
  }

  async retry(jobId: string, userId: string) {
    const job = await this.getJob(jobId, userId);
    if (job.status !== 'FAILED') {
      throw new AppException(
        'GENERATION_JOB_NOT_RETRYABLE',
        'Solo se pueden reintentar jobs fallidos',
        HttpStatus.CONFLICT,
      );
    }
    const updated = await this.prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: { status: 'QUEUED', error: null },
    });
    await this.queue.enqueue(jobId);
    return updated;
  }

  async process(jobId: string): Promise<void> {
    const job = await this.prisma.contentGenerationJob.findUnique({
      where: { id: jobId },
      include: { folder: { select: { id: true, projectId: true } } },
    });
    if (!job || job.status === 'DONE') return;

    await this.prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    try {
      const sources = job.sources as unknown as JobSource[];
      const agentSources = await Promise.all(
        sources.map(async (source) => {
          const resource = await this.prisma.resource.findUnique({
            where: { id: source.resourceId },
            select: { s3Key: true, checksum: true, size: true },
          });
          if (!resource) {
            throw new AppException(
              'EMPTY_SOURCE',
              'Una fuente ya no existe',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
          return {
            resourceId: source.resourceId,
            kind: 'markdown' as const,
            name: source.name,
            mimeType: source.mimeType,
            size: resource.size,
            checksum: source.checksum ?? resource.checksum,
            url: await this.storage.getPresignedGetUrl(
              resource.s3Key,
              this.presignTtlSeconds,
            ),
          };
        }),
      );

      const result = await this.agent.generate(
        job.type === 'MINDMAP' ? 'mindmap' : 'quiz',
        {
          jobId: job.id,
          sources: agentSources,
          context: {
            projectId: job.folder.projectId,
            folderId: job.folderId,
            language: 'es',
            instructions:
              (job.config as Record<string, unknown> | null)?.instructions as
                | string
                | null,
          },
          config: (job.config ?? {}) as Record<string, unknown>,
        },
      );

      const resourceId =
        job.type === 'MINDMAP'
          ? await this.persistMindmap(job.id, job.folderId, job.requestedById, sources, result.data)
          : await this.persistQuiz(job.id, job.folderId, job.requestedById, sources, result.data, job.config);

      await this.prisma.contentGenerationJob.update({
        where: { id: jobId },
        data: {
          status: 'DONE',
          resultJson: result.data as Prisma.InputJsonValue,
          resultResourceId: resourceId,
          warnings: result.warnings as Prisma.InputJsonValue,
          model: result.usage?.model ?? null,
          promptVersion: result.promptVersion ?? null,
          inputTokens: result.usage?.inputTokens ?? null,
          outputTokens: result.usage?.outputTokens ?? null,
          error: null,
        },
      });
    } catch (error) {
      const code =
        error instanceof AppException ? error.code : 'AGENT_SERVICE_UNAVAILABLE';
      this.logger.error(
        `Content generation ${job.id} failed: ${code} — ${
          (error as Error).message
        }`,
      );
      await this.prisma.contentGenerationJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', error: code },
      });
    }
  }

  private async createJob(
    type: 'MINDMAP' | 'QUIZ',
    folderId: string,
    userId: string,
    source: CreateMindmapDto['source'],
    config: Record<string, unknown>,
  ) {
    if (!this.agent.isEnabled()) {
      throw new AppException(
        'AGENT_CONTENT_DISABLED',
        'La generación con IA está desactivada',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, projectId: true },
    });
    if (!folder) {
      throw new AppException(
        'FOLDER_NOT_FOUND',
        'Carpeta no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.permissions.assertProjectRole(userId, folder.projectId, 'editor');
    const sources = await this.resolveSources(folder.projectId, source);
    return this.prisma.contentGenerationJob.create({
      data: {
        type,
        folderId,
        requestedById: userId,
        sources: sources as unknown as Prisma.InputJsonValue,
        config: config as Prisma.InputJsonValue,
      },
    });
  }

  private async resolveSources(
    projectId: string,
    source: CreateMindmapDto['source'],
  ): Promise<JobSource[]> {
    const select = {
      id: true,
      name: true,
      mimeType: true,
      size: true,
      checksum: true,
      folderId: true,
      folder: { select: { projectId: true } },
    } as const;

    let resources: Array<{
      id: string;
      name: string;
      mimeType: string;
      size: number;
      checksum: string | null;
      folderId: string;
      folder: { projectId: string };
    }> = [];

    if (source.type === 'RESOURCE') {
      const resource = await this.prisma.resource.findUnique({
        where: { id: source.id },
        select,
      });
      if (!resource || resource.folder.projectId !== projectId) {
        throw new AppException(
          'EMPTY_SOURCE',
          'La fuente no pertenece al proyecto',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if (resource.mimeType !== 'text/markdown') {
        throw new AppException(
          'UNSUPPORTED_SOURCE_TYPE',
          'Solo se pueden usar apuntes Markdown como fuente',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }
      resources = [resource];
    } else if (source.type === 'FOLDER') {
      const folder = await this.prisma.folder.findUnique({
        where: { id: source.id },
        select: { projectId: true },
      });
      if (!folder || folder.projectId !== projectId) {
        throw new AppException(
          'EMPTY_SOURCE',
          'La carpeta no pertenece al proyecto',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      resources = await this.prisma.resource.findMany({
        where: { folderId: source.id, mimeType: 'text/markdown' },
        select,
      });
    } else {
      resources = await this.prisma.resource.findMany({
        where: {
          folder: { projectId },
          mimeType: 'text/markdown',
        },
        select,
      });
    }

    if (!resources.length) {
      throw new AppException(
        'EMPTY_SOURCE',
        'No hay apuntes de texto para generar contenido',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return resources.map((resource) => ({
      resourceId: resource.id,
      name: resource.name,
      mimeType: resource.mimeType,
      size: resource.size,
      checksum: resource.checksum,
    }));
  }

  private async persistMindmap(
    jobId: string,
    folderId: string,
    userId: string,
    sources: JobSource[],
    raw: Record<string, unknown>,
  ): Promise<string> {
    const payload = validateMindmap(raw);
    const sourceIds = new Set(sources.map((source) => source.resourceId));
    const content = Buffer.from(JSON.stringify(payload), 'utf8');
    const resource = await this.resources.createGenerated(folderId, userId, {
      name: `${payload.title}.mindmap.json`,
      kind: 'MINDMAP',
      mimeType: MINDMAP_MIME,
      content,
      origin: 'AI_MINDMAP',
    });
    await this.provenance.addSources(
      resource.id,
      sources
        .filter((source) => sourceIds.has(source.resourceId))
        .map((source) => ({ resourceId: source.resourceId })),
    );
    await this.prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: { resultResourceId: resource.id },
    });
    return resource.id;
  }

  private async persistQuiz(
    jobId: string,
    folderId: string,
    userId: string,
    sources: JobSource[],
    raw: Record<string, unknown>,
    config: Prisma.JsonValue | null,
  ): Promise<string> {
    const payload = validateQuiz(raw, config);
    const sourceIds = new Set(sources.map((source) => source.resourceId));
    const { resource, quiz } = await this.quizzes.create(folderId, userId, {
      title: payload.title,
      instructions: payload.instructions,
      settings: {
        generatedByAI: true,
        difficulty:
          (config as Record<string, unknown> | null)?.difficulty ?? 'medium',
      },
    });
    const questions = payload.questions.map((question) => ({
      type: question.type,
      prompt: question.prompt,
      points: question.points ?? 1,
      caseSensitive: question.caseSensitive ?? false,
      correctText: question.correctText,
      sourceRefs: (question.sourceRefs ?? []).filter((id) => sourceIds.has(id)),
      options: question.options ?? [],
    }));
    await this.quizzes.setQuestions(quiz.id, userId, questions);
    await this.prisma.resource.update({
      where: { id: resource.id },
      data: { origin: 'AI_QUIZ', validationStatus: 'UNVERIFIED' },
    });
    await this.provenance.addSources(
      resource.id,
      sources.map((source) => ({ resourceId: source.resourceId })),
    );
    await this.prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: { resultResourceId: resource.id },
    });
    return resource.id;
  }
}

function validateMindmap(raw: Record<string, unknown>): MindmapPayload {
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const edges = Array.isArray(raw.edges) ? raw.edges : [];
  if (!title || nodes.length < 2 || nodes.length > 100) {
    throw new AppException(
      'MINDMAP_INVALID',
      'El mapa mental necesita un título y entre 2 y 100 nodos',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  const cleanNodes: MindmapNode[] = [];
  for (const item of nodes) {
    if (!item || typeof item !== 'object') continue;
    const node = item as Record<string, unknown>;
    const id = typeof node.id === 'string' ? node.id.trim() : '';
    const label = typeof node.label === 'string' ? node.label.trim() : '';
    if (!id || !label) continue;
    cleanNodes.push({
      id,
      label: cleanText(label),
      type: typeof node.type === 'string' ? cleanText(node.type) : undefined,
      description:
        typeof node.description === 'string'
          ? cleanText(node.description)
          : undefined,
    });
  }
  const ids = new Set(cleanNodes.map((node) => node.id));
  const cleanEdges: MindmapEdge[] = [];
  for (const item of edges) {
    if (!item || typeof item !== 'object') continue;
    const edge = item as Record<string, unknown>;
    const source = typeof edge.source === 'string' ? edge.source : '';
    const target = typeof edge.target === 'string' ? edge.target : '';
    if (!ids.has(source) || !ids.has(target) || source === target) continue;
    cleanEdges.push({
      source,
      target,
      label: typeof edge.label === 'string' ? cleanText(edge.label) : undefined,
    });
  }
  if (!cleanEdges.length) {
    throw new AppException(
      'MINDMAP_INVALID',
      'El mapa mental no contiene aristas válidas',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  return { title: cleanText(title), nodes: cleanNodes, edges: cleanEdges };
}

function validateQuiz(
  raw: Record<string, unknown>,
  config: Prisma.JsonValue | null,
): GeneratedQuizPayload {
  const requested = Number(
    (config as Record<string, unknown> | null)?.count ?? 10,
  );
  const count = Math.min(30, Math.max(5, requested));
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  if (!title || questions.length < 5 || questions.length > 30) {
    throw new AppException(
      'QUIZ_INVALID',
      'El cuestionario necesita un título y entre 5 y 30 preguntas',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  const seen = new Set<string>();
  const clean: GeneratedQuizQuestion[] = [];
  for (const item of questions) {
    if (!item || typeof item !== 'object') continue;
    const q = item as Record<string, unknown>;
    const prompt = typeof q.prompt === 'string' ? cleanText(q.prompt) : '';
    const type = q.type;
    if (
      !prompt ||
      !['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(String(type))
    ) {
      continue;
    }
    const key = prompt.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const options = Array.isArray(q.options)
      ? q.options
          .filter((option): option is Record<string, unknown> =>
            Boolean(option && typeof option === 'object'),
          )
          .map((option) => ({
            text: typeof option.text === 'string' ? cleanText(option.text) : '',
            isCorrect: option.isCorrect === true,
          }))
          .filter((option) => option.text)
      : [];
    if (type !== 'SHORT_ANSWER' && (options.length < 2 || !options.some((o) => o.isCorrect))) {
      continue;
    }
    clean.push({
      type: type as GeneratedQuizQuestion['type'],
      prompt,
      points: typeof q.points === 'number' && q.points > 0 ? Math.round(q.points) : 1,
      correctText: typeof q.correctText === 'string' ? cleanText(q.correctText) : undefined,
      caseSensitive: q.caseSensitive === true,
      options,
      sourceRefs: Array.isArray(q.sourceRefs)
        ? q.sourceRefs.filter((id): id is string => typeof id === 'string')
        : [],
    });
  }
  if (clean.length < 5) {
    throw new AppException(
      'AGENT_INVALID_OUTPUT',
      'El cuestionario generado no contiene suficientes preguntas válidas',
      HttpStatus.BAD_GATEWAY,
    );
  }
  return {
    title: cleanText(title),
    instructions:
      typeof raw.instructions === 'string' ? cleanText(raw.instructions) : undefined,
    questions: clean.slice(0, count),
  };
}

function cleanText(value: string): string {
  return value.replace(/<[^>]*>/g, '').slice(0, 4000).trim();
}
