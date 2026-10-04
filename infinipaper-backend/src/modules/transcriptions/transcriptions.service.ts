import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import { ResourcesService } from '../resources/resources.service.js';
import type { Readable } from 'node:stream';
import { AsrService } from './asr.service.js';
import { QueueService } from './queue.service.js';
import type {
  CreateTranscriptionDto,
  SaveNoteDto,
} from './dto/transcription.dto.js';

@Injectable()
export class TranscriptionsService {
  private readonly logger = new Logger(TranscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly asr: AsrService,
    private readonly queue: QueueService,
    private readonly resources: ResourcesService,
  ) {}

  async create(fileId: string, userId: string, dto: CreateTranscriptionDto) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: fileId },
    });
    if (!resource) {
      throw new AppException('FILE_NOT_FOUND', 'Recurso no encontrado', 404);
    }
    if (resource.kind !== 'AUDIO') {
      throw new AppException(
        'AUDIO_UNSUPPORTED',
        'El recurso no es un archivo de audio',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const job = await this.prisma.transcriptionJob.create({
      data: {
        resourceId: fileId,
        requestedById: userId,
        language: dto.language ?? 'es',
      },
    });

    await this.queue.enqueue(job.id);
    return job;
  }

  async get(jobId: string) {
    const job = await this.prisma.transcriptionJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new AppException(
        'TRANSCRIPTION_NOT_FOUND',
        'Transcripción no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    return job;
  }

  async listByProject(projectId: string) {
    return this.prisma.transcriptionJob.findMany({
      where: { resource: { folder: { projectId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveAsNote(jobId: string, userId: string, dto: SaveNoteDto) {
    const job = await this.get(jobId);
    const content = dto.content ?? job.text;
    if (job.status !== 'DONE' || !content || !content.trim()) {
      throw new AppException(
        'TRANSCRIPTION_REQUIRED',
        'No hay una transcripción válida para guardar',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const resource = await this.prisma.resource.findUnique({
      where: { id: job.resourceId },
      select: { folderId: true },
    });
    if (!resource) {
      throw new AppException('FILE_NOT_FOUND', 'Recurso no encontrado', 404);
    }

    return this.resources.createNote(resource.folderId, userId, {
      name: dto.name,
      content,
    });
  }

  /** Procesa un trabajo (invocado por el worker de la cola). */
  async process(jobId: string): Promise<void> {
    const job = await this.prisma.transcriptionJob.findUnique({
      where: { id: jobId },
      include: { resource: true },
    });
    if (!job) {
      return;
    }

    await this.prisma.transcriptionJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    try {
      const object = await this.storage.get(job.resource.s3Key);
      const buffer = await this.streamToBuffer(object.body);
      const { text } = await this.asr.transcribe(
        buffer,
        job.resource.name,
        job.resource.mimeType,
        job.language,
      );

      if (!text.trim()) {
        throw new AppException(
          'ASR_NO_SPEECH',
          'No se detectó voz en el audio',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      await this.prisma.transcriptionJob.update({
        where: { id: jobId },
        data: { status: 'DONE', text, error: null },
      });
    } catch (error) {
      const code =
        error instanceof AppException ? error.code : 'ASR_SERVICE_ERROR';
      this.logger.error(`Transcription ${jobId} failed: ${code}`);
      await this.prisma.transcriptionJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: code },
      });
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}
