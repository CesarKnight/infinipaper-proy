import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import { ResourcesService } from '../resources/resources.service.js';
import { AgentClientService } from './agent-client.service.js';
import { NoteStructureQueueService } from './note-structure.queue.js';
import type { ApplyStructureJobDto } from './dto/apply-structure-job.dto.js';
import type { CreateStructureJobDto } from './dto/create-structure-job.dto.js';

const ACTIVE_STATUSES = ['QUEUED', 'PROCESSING'] as const;

@Injectable()
export class NoteStructureService {
  private readonly logger = new Logger(NoteStructureService.name);
  private readonly presignTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly resources: ResourcesService,
    private readonly agent: AgentClientService,
    private readonly queue: NoteStructureQueueService,
    config: ConfigService,
  ) {
    this.presignTtlSeconds = config.get<number>(
      'S3_PRESIGN_TTL_SECONDS',
      900,
    );
  }

  async createJob(
    fileId: string,
    userId: string,
    dto: CreateStructureJobDto,
  ) {
    this.assertEnabled();

    const resource = await this.prisma.resource.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        kind: true,
        checksum: true,
        folder: { select: { projectId: true } },
      },
    });
    if (!resource) {
      throw new AppException(
        'FILE_NOT_FOUND',
        'Recurso no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    if (resource.kind !== 'MARKDOWN') {
      throw new AppException(
        'UNSUPPORTED_SOURCE_TYPE',
        'Solo se pueden estructurar apuntes Markdown',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const active = await this.prisma.noteStructureJob.findFirst({
      where: {
        resourceId: fileId,
        status: { in: [...ACTIVE_STATUSES] },
      },
      select: { id: true },
    });
    if (active) {
      throw new AppException(
        'STRUCTURE_JOB_IN_PROGRESS',
        'Ya hay una estructuración en curso para este apunte',
        HttpStatus.CONFLICT,
        { jobId: active.id },
      );
    }

    const job = await this.prisma.noteStructureJob.create({
      data: {
        resourceId: fileId,
        requestedById: userId,
        language: dto.language ?? 'es',
        instructions: dto.instructions ?? null,
        sourceChecksum: resource.checksum,
      },
    });

    await this.queue.enqueue(job.id);
    return job;
  }

  async getJob(jobId: string) {
    const job = await this.prisma.noteStructureJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new AppException(
        'STRUCTURE_JOB_NOT_FOUND',
        'Job de estructuración no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    return job;
  }

  async apply(jobId: string, userId: string, dto: ApplyStructureJobDto) {
    const job = await this.getJob(jobId);

    if (job.status !== 'DONE') {
      throw new AppException(
        'STRUCTURE_JOB_NOT_READY',
        'La estructuración todavía no está lista',
        HttpStatus.CONFLICT,
      );
    }
    if (!job.resultMarkdown?.trim()) {
      throw new AppException(
        'STRUCTURE_RESULT_EMPTY',
        'La estructuración no tiene contenido',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (job.resultResourceId) {
      const existing = await this.prisma.resource.findUnique({
        where: { id: job.resultResourceId },
      });
      if (existing) return existing;
    }

    const original = await this.prisma.resource.findUnique({
      where: { id: job.resourceId },
      select: { id: true, name: true, folderId: true },
    });
    if (!original) {
      throw new AppException(
        'FILE_NOT_FOUND',
        'El apunte original ya no existe',
        HttpStatus.NOT_FOUND,
      );
    }

    const baseName = original.name.replace(/\.md$/i, '');
    const name = dto.name ?? `${baseName}-estructurado.md`;
    const created = await this.resources.createNote(
      original.folderId,
      userId,
      { name, content: job.resultMarkdown },
    );

    await this.prisma.noteStructureJob.update({
      where: { id: job.id },
      data: { resultResourceId: created.id },
    });

    return created;
  }

  async process(jobId: string): Promise<void> {
    const job = await this.prisma.noteStructureJob.findUnique({
      where: { id: jobId },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            kind: true,
            mimeType: true,
            size: true,
            s3Key: true,
            checksum: true,
            folderId: true,
            folder: { select: { projectId: true } },
          },
        },
      },
    });
    if (!job || job.status === 'DONE') return;

    await this.prisma.noteStructureJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    try {
      if (job.resource.kind !== 'MARKDOWN') {
        throw new AppException(
          'UNSUPPORTED_SOURCE_TYPE',
          'Solo se pueden estructurar apuntes Markdown',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }

      const url = await this.storage.getPresignedGetUrl(
        job.resource.s3Key,
        this.presignTtlSeconds,
      );

      const result = await this.agent.structure({
        jobId: job.id,
        sources: [
          {
            resourceId: job.resource.id,
            kind: 'markdown',
            name: job.resource.name,
            mimeType: job.resource.mimeType,
            size: job.resource.size,
            checksum: job.resource.checksum,
            url,
          },
        ],
        context: {
          projectId: job.resource.folder.projectId,
          folderId: job.resource.folderId,
          language: job.language,
          instructions: job.instructions,
        },
      });

      await this.prisma.noteStructureJob.update({
        where: { id: job.id },
        data: {
          status: 'DONE',
          resultMarkdown: result.markdown,
          outline: result.outline as object,
          warnings: result.warnings as object,
          model: result.usage?.model ?? null,
          promptVersion: result.promptVersion ?? null,
          inputTokens: result.usage?.inputTokens ?? null,
          outputTokens: result.usage?.outputTokens ?? null,
          error: null,
        },
      });
    } catch (error) {
      const code =
        error instanceof AppException
          ? error.code
          : 'AGENT_SERVICE_UNAVAILABLE';
      this.logger.error(
        `Note structure job ${job.id} failed: ${code} — ${
          (error as Error).message
        }`,
      );
      await this.prisma.noteStructureJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', error: code },
      });
    }
  }

  private assertEnabled(): void {
    if (!this.agent.isEnabled()) {
      throw new AppException(
        'AGENT_STRUCTURING_DISABLED',
        'La estructuración con IA está desactivada',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
