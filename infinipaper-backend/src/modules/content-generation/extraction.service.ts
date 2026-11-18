import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import { ContentAgentClient, type ContentSourceKind } from './content-agent.client.js';

export interface ExtractionArtifact {
  markdown: string;
  blocks: unknown[];
  metadata: Record<string, unknown>;
  warnings: string[];
  extractor: string;
}

@Injectable()
export class ResourceExtractionService {
  private readonly logger = new Logger(ResourceExtractionService.name);
  private readonly extractorVersion: string;
  private readonly presignTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly agent: ContentAgentClient,
    config: ConfigService,
  ) {
    this.extractorVersion =
      config.get<string>('AGENT_EXTRACTION_VERSION') ?? 'v1';
    this.presignTtlSeconds = config.get<number>('S3_PRESIGN_TTL_SECONDS', 900);
  }

  async getOrExtract(input: {
    jobId: string;
    resourceId: string;
    name: string;
    kind: ContentSourceKind;
    mimeType: string;
    size: number;
    checksum: string | null;
    sourceVersion: string;
    s3Key: string;
    projectId: string;
    folderId: string;
    language: string;
  }): Promise<ExtractionArtifact> {
    const cached = await this.prisma.resourceExtraction.findFirst({
      where: {
        resourceId: input.resourceId,
        checksum: input.sourceVersion,
        extractorVersion: this.extractorVersion,
        status: 'DONE',
      },
    });
    if (cached?.content) {
      return this.fromRow(cached);
    }

    const url = await this.storage.getPresignedGetUrl(
      input.s3Key,
      this.presignTtlSeconds,
    );
    const result = await this.agent.extractSource({
      jobId: input.jobId,
      source: {
        resourceId: input.resourceId,
        kind: input.kind,
        name: input.name,
        mimeType: input.mimeType,
        size: input.size,
        checksum: input.checksum,
        url,
      },
      context: {
        projectId: input.projectId,
        folderId: input.folderId,
        language: input.language,
      },
    });

    const document = result.document;
    const markdown =
      typeof document.markdown === 'string' && document.markdown.trim()
        ? document.markdown
        : typeof document.text === 'string'
          ? document.text
          : '';
    if (!markdown.trim()) {
      throw new AppException(
        'SOURCE_EMPTY',
        `La fuente ${input.name} no contiene texto reconocible`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const documentWarnings = Array.isArray(document.warnings)
      ? document.warnings.map((item) => String(item))
      : [];
    const warnings = [...new Set([...result.warnings, ...documentWarnings])];
    const blocks = Array.isArray(document.blocks) ? document.blocks : [];
    const metadata =
      document.metadata && typeof document.metadata === 'object'
        ? (document.metadata as Record<string, unknown>)
        : {};
    const extractor =
      typeof document.extractor === 'string'
        ? document.extractor
        : `extractor/${this.extractorVersion}`;

    const data = {
      resourceId: input.resourceId,
      checksum: input.sourceVersion,
      extractor,
      extractorVersion: this.extractorVersion,
      status: 'DONE' as const,
      content: markdown,
      metadata: {
        blocks,
        metadata,
        extractor,
      } as Prisma.InputJsonValue,
      warnings: warnings as Prisma.InputJsonValue,
      error: null,
    };
    try {
      await this.prisma.resourceExtraction.upsert({
        where: {
          resourceId_checksum_extractorVersion: {
            resourceId: input.resourceId,
            checksum: input.sourceVersion,
            extractorVersion: this.extractorVersion,
          },
        },
        create: data,
        update: data,
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo guardar la extracción de ${input.resourceId}: ${
          (error as Error).message
        }`,
      );
    }

    return { markdown, blocks, metadata, warnings, extractor };
  }

  private fromRow(row: {
    content: string | null;
    metadata: Prisma.JsonValue | null;
    warnings: Prisma.JsonValue | null;
  }): ExtractionArtifact {
    const payload =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {};
    return {
      markdown: row.content ?? '',
      blocks: Array.isArray(payload.blocks) ? payload.blocks : [],
      metadata:
        payload.metadata && typeof payload.metadata === 'object'
          ? (payload.metadata as Record<string, unknown>)
          : {},
      warnings: Array.isArray(row.warnings)
        ? row.warnings.filter((item): item is string => typeof item === 'string')
        : [],
      extractor:
        typeof payload.extractor === 'string'
          ? payload.extractor
          : `extractor/${this.extractorVersion}`,
    };
  }
}
