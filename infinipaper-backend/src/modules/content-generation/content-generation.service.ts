import { createHash } from 'node:crypto';
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
import {
  ContentAgentClient,
  type ContentAgentSource,
  type ContentSourceKind,
} from './content-agent.client.js';
import { ContentGenerationQueueService } from './content-generation.queue.js';
import { ResourceExtractionService } from './extraction.service.js';
import {
  isDeferredSource,
  resolveSourceFamily,
} from '../resources/resource-kind.util.js';
import type {
  CreateMindmapDto,
  CreateQuizGenerationDto,
} from './dto/content-generation.dto.js';

interface JobSource {
  resourceId: string;
  kind: ContentSourceKind;
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
  private readonly multiformatEnabled: boolean;
  private readonly maxSources: number;
  private readonly maxTotalBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly permissions: PermissionsService,
    private readonly provenance: ProvenanceService,
    private readonly resources: ResourcesService,
    private readonly quizzes: QuizzesService,
    private readonly agent: ContentAgentClient,
    private readonly queue: ContentGenerationQueueService,
    private readonly extraction: ResourceExtractionService,
    config: ConfigService,
  ) {
    this.presignTtlSeconds = config.get<number>('S3_PRESIGN_TTL_SECONDS', 900);
    this.multiformatEnabled =
      config.get<boolean>('AGENT_MULTIFORMAT_ENABLED', true) ?? true;
    this.maxSources = config.get<number>('AGENT_MAX_SOURCES', 30) ?? 30;
    this.maxTotalBytes =
      config.get<number>('AGENT_MAX_TOTAL_SOURCE_BYTES', 250 * 1024 * 1024) ??
      250 * 1024 * 1024;
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
      include: {
        folder: { select: { projectId: true, name: true } },
        requestedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
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

  async listActiveByProject(projectId: string, userId: string, limit = 20) {
    await this.permissions.assertProjectRole(userId, projectId, 'editor');
    const jobs = await this.prisma.contentGenerationJob.findMany({
      where: {
        folder: { projectId },
        status: { in: ['QUEUED', 'PROCESSING'] },
      },
      include: {
        folder: { select: { id: true, name: true } },
        requestedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: Math.min(Math.max(limit, 1), 50),
    });
    return {
      items: jobs.map((job) => {
        const sources = Array.isArray(job.sources)
          ? (job.sources as unknown as JobSource[])
          : [];
        return {
          id: job.id,
          type: job.type,
          status: job.status,
          stage: job.stage,
          progress: job.progress,
          folder: job.folder,
          requestedBy: job.requestedBy,
          sourceType: job.sourceType,
          sourceId: job.sourceId,
          sourceCount: sources.length,
          sourceNames: sources.slice(0, 3).map((source) => source.name),
          config: job.config,
          createdAt: job.createdAt,
        };
      }),
    };
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
    const activeKey =
      job.sourceType && job.sourceId
        ? buildActiveKey(job.type, job.folderId, {
            type: job.sourceType as 'RESOURCE' | 'FOLDER' | 'PROJECT',
            id: job.sourceId,
          }, job.config)
        : null;
    try {
      const updated = await this.prisma.contentGenerationJob.update({
        where: { id: jobId },
        data: {
          status: 'QUEUED',
          error: null,
          stage: null,
          activeKey,
        },
      });
      await this.queue.enqueue(jobId);
      return updated;
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw await this.duplicateJobException(activeKey);
      }
      throw error;
    }
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

    const initialWarnings = asStringArray(job.warnings);
    const warnings = [...initialWarnings];
    const sources = job.sources as unknown as JobSource[];
    const total = sources.length;

    try {
      const extracted: ContentAgentSource[] = [];
      await this.updateJobStage(jobId, 'EXTRACTING', 0, total);
      for (const [index, source] of sources.entries()) {
        try {
          const resource = await this.prisma.resource.findUnique({
            where: { id: source.resourceId },
            select: {
              s3Key: true,
              checksum: true,
              size: true,
              updatedAt: true,
            },
          });
          if (!resource) {
            throw new AppException(
              'EMPTY_SOURCE',
              'Una fuente ya no existe',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
          const sourceVersion =
            source.checksum ??
            resource.checksum ??
            resource.updatedAt.toISOString();
          const artifact = await this.extraction.getOrExtract({
            jobId: job.id,
            resourceId: source.resourceId,
            name: source.name,
            kind: source.kind,
            mimeType: source.mimeType,
            size: resource.size,
            checksum: source.checksum ?? resource.checksum,
            sourceVersion,
            s3Key: resource.s3Key,
            projectId: job.folder.projectId,
            folderId: job.folderId,
            language: 'es',
          });
          warnings.push(
            ...artifact.warnings.map((warning) => `${source.name}: ${warning}`),
          );
          extracted.push({
            resourceId: source.resourceId,
            kind: source.kind,
            name: source.name,
            mimeType: source.mimeType,
            size: resource.size,
            checksum: source.checksum ?? resource.checksum,
            url: await this.storage.getPresignedGetUrl(
              resource.s3Key,
              this.presignTtlSeconds,
            ),
            extraction: {
              sourceId: source.resourceId,
              kind: source.kind,
              text: artifact.markdown,
              markdown: artifact.markdown,
              blocks: artifact.blocks,
              metadata: artifact.metadata,
              warnings: artifact.warnings,
              extractor: artifact.extractor,
            },
          });
        } catch (error) {
          if (sources.length === 1 || job.sourceType === 'RESOURCE') {
            throw error;
          }
          const code =
            error instanceof AppException
              ? error.code
              : 'SOURCE_EXTRACTION_FAILED';
          warnings.push(`Se omitió ${source.name}: ${code}`);
        }
        await this.updateJobStage(jobId, 'EXTRACTING', index + 1, total);
      }

      if (!extracted.length) {
        throw new AppException(
          'EMPTY_SOURCE',
          'Ninguna fuente produjo contenido utilizable',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      await this.updateJobStage(jobId, 'GENERATING', total, total);
      const result = await this.agent.generate(
        job.type === 'MINDMAP' ? 'mindmap' : 'quiz',
        {
          jobId: job.id,
          sources: extracted,
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

      const requestedIds = new Set(result.usedSourceIds);
      const usedSources = requestedIds.size
        ? sources.filter((source) => requestedIds.has(source.resourceId))
        : sources;
      const persistenceSources = usedSources.length ? usedSources : sources;

      await this.updateJobStage(jobId, 'SAVING', total, total);
      const resourceId =
        job.type === 'MINDMAP'
          ? await this.persistMindmap(
              job.id,
              job.folderId,
              job.requestedById,
              persistenceSources,
              result.data,
            )
          : await this.persistQuiz(
              job.id,
              job.folderId,
              job.requestedById,
              persistenceSources,
              result.data,
              job.config,
            );

      const finalWarnings = [
        ...new Set([...warnings, ...result.warnings]),
      ];
      await this.prisma.contentGenerationJob.update({
        where: { id: jobId },
        data: {
          status: 'DONE',
          resultJson: result.data as Prisma.InputJsonValue,
          resultResourceId: resourceId,
          warnings: finalWarnings as Prisma.InputJsonValue,
          model: result.usage?.model ?? null,
          promptVersion: result.promptVersion ?? null,
          inputTokens: result.usage?.inputTokens ?? null,
          outputTokens: result.usage?.outputTokens ?? null,
          error: null,
          activeKey: null,
          stage: null,
          progress: { completed: total, total } as Prisma.InputJsonValue,
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
        data: {
          status: 'FAILED',
          error: code,
          activeKey: null,
          stage: null,
          warnings: warnings as Prisma.InputJsonValue,
        },
      });
    }
  }

  private async updateJobStage(
    jobId: string,
    stage: string,
    completed: number,
    total: number,
  ): Promise<void> {
    await this.prisma.contentGenerationJob.update({
      where: { id: jobId },
      data: {
        stage,
        progress: { completed, total } as Prisma.InputJsonValue,
      },
    });
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
    const { sources, warnings } = await this.resolveSources(
      folder.projectId,
      source,
    );
    const activeKey = buildActiveKey(type, folderId, source, config);
    try {
      return await this.prisma.contentGenerationJob.create({
        data: {
          type,
          folderId,
          requestedById: userId,
          sourceType: source.type,
          sourceId: source.id,
          activeKey,
          warnings: warnings as Prisma.InputJsonValue,
          sources: sources as unknown as Prisma.InputJsonValue,
          config: config as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw await this.duplicateJobException(activeKey);
      }
      throw error;
    }
  }

  private async duplicateJobException(
    activeKey: string | null,
  ): Promise<AppException> {
    const existing = activeKey
      ? await this.prisma.contentGenerationJob.findFirst({
          where: {
            activeKey,
            status: { in: ['QUEUED', 'PROCESSING'] },
          },
          select: { id: true },
        })
      : null;
    return new AppException(
      'GENERATION_JOB_IN_PROGRESS',
      'Ya hay una generación idéntica en curso',
      HttpStatus.CONFLICT,
      { jobId: existing?.id ?? null },
    );
  }

  private async resolveSources(
    projectId: string,
    source: CreateMindmapDto['source'],
  ): Promise<{ sources: JobSource[]; warnings: string[] }> {
    const select = {
      id: true,
      name: true,
      kind: true,
      mimeType: true,
      size: true,
      checksum: true,
      folderId: true,
      folder: { select: { projectId: true } },
    } as const;
    type SourceResource = {
      id: string;
      name: string;
      kind: string;
      mimeType: string;
      size: number;
      checksum: string | null;
      folderId: string;
      folder: { projectId: string };
    };
    const warnings: string[] = [];
    const toJobSource = (resource: SourceResource): JobSource | null => {
      const family = resolveSourceFamily(resource.name, resource.mimeType);
      if (!family || family === 'web') {
        if (isDeferredSource(resource.name)) {
          warnings.push(
            `${resource.name}: formato diferido a la segunda fase`,
          );
        } else {
          warnings.push(`${resource.name}: formato no compatible`);
        }
        return null;
      }
      return {
        resourceId: resource.id,
        kind: family,
        name: resource.name,
        mimeType: resource.mimeType,
        size: resource.size,
        checksum: resource.checksum,
      };
    };

    if (source.type === 'RESOURCE') {
      const resource = (await this.prisma.resource.findUnique({
        where: { id: source.id },
        select,
      })) as SourceResource | null;
      if (!resource || resource.folder.projectId !== projectId) {
        throw new AppException(
          'EMPTY_SOURCE',
          'La fuente no pertenece al proyecto',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const mapped = toJobSource(resource);
      if (!mapped || (!this.multiformatEnabled && mapped.kind !== 'markdown')) {
        throw new AppException(
          'UNSUPPORTED_SOURCE_TYPE',
          isDeferredSource(resource.name)
            ? 'Este formato se habilitará en la segunda fase'
            : 'El formato de la fuente no es compatible con la generación',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }
      return { sources: [mapped], warnings };
    }

    let resources: SourceResource[];
    if (source.type === 'FOLDER') {
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
      resources = (await this.prisma.resource.findMany({
        where: {
          folderId: source.id,
          kind: this.multiformatEnabled
            ? { in: ['MARKDOWN', 'DOCUMENT', 'IMAGE', 'AUDIO', 'VIDEO'] }
            : 'MARKDOWN',
        },
        orderBy: { name: 'asc' },
        select,
      })) as SourceResource[];
    } else {
      resources = (await this.prisma.resource.findMany({
        where: {
          folder: { projectId },
          kind: this.multiformatEnabled
            ? { in: ['MARKDOWN', 'DOCUMENT', 'IMAGE', 'AUDIO', 'VIDEO'] }
            : 'MARKDOWN',
        },
        orderBy: { name: 'asc' },
        select,
      })) as SourceResource[];
    }

    const mappedSources = resources
      .map(toJobSource)
      .filter((item): item is JobSource => item !== null);
    if (!mappedSources.length) {
      throw new AppException(
        'EMPTY_SOURCE',
        'No hay archivos compatibles para generar contenido',
        HttpStatus.UNPROCESSABLE_ENTITY,
        { warnings },
      );
    }
    if (mappedSources.length > this.maxSources) {
      throw new AppException(
        'TOO_MANY_SOURCES',
        `Se permiten como máximo ${this.maxSources} archivos por generación`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const totalBytes = mappedSources.reduce(
      (sum, item) => sum + item.size,
      0,
    );
    if (totalBytes > this.maxTotalBytes) {
      throw new AppException(
        'SOURCE_TOO_LARGE',
        'El conjunto de archivos supera el límite de tamaño',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return { sources: mappedSources, warnings };
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

export function buildActiveKey(
  type: 'MINDMAP' | 'QUIZ',
  folderId: string,
  source: { type: 'RESOURCE' | 'FOLDER' | 'PROJECT'; id: string },
  config: unknown,
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        type,
        folderId,
        sourceType: source.type,
        sourceId: source.id,
        config: canonicalize(config),
      }),
    )
    .digest('hex');
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

function asStringArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
