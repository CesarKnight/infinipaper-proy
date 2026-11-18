import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import type { UsageQueryDto } from './dto/usage-query.dto.js';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);
  private readonly retentionDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    config: ConfigService,
  ) {
    this.retentionDays =
      config.get<number>('RESOURCE_EVENT_RETENTION_DAYS') ?? 365;
  }

  async record(
    resourceId: string,
    userId: string | undefined,
    type: 'VIEW' | 'DOWNLOAD' | 'SEARCH_HIT' | 'QUIZ_USE',
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      const resource = await this.prisma.resource.findUnique({
        where: { id: resourceId },
        select: {
          name: true,
          kind: true,
          origin: true,
          validationStatus: true,
          folder: { select: { projectId: true } },
        },
      });
      if (!resource) return;
      await this.prisma.resourceEvent.create({
        data: {
          projectId: resource.folder.projectId,
          resourceId,
          userId: userId ?? null,
          type,
          metadata: {
            name: resource.name,
            resourceKind: resource.kind,
            origin: resource.origin,
            validationStatus: resource.validationStatus,
            ...metadata,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.warn(`No se pudo registrar evento ${type}: ${(error as Error).message}`);
    }
  }

  recordView(resourceId: string, userId?: string) {
    return this.record(resourceId, userId, 'VIEW');
  }

  recordDownload(resourceId: string, userId?: string) {
    return this.record(resourceId, userId, 'DOWNLOAD');
  }

  recordSearchHit(resourceId: string, userId?: string) {
    return this.record(resourceId, userId, 'SEARCH_HIT');
  }

  recordQuizUse(resourceId: string, userId?: string) {
    return this.record(resourceId, userId, 'QUIZ_USE');
  }

  async getProjectUsage(
    projectId: string,
    userId: string,
    dto: UsageQueryDto,
  ) {
    await this.permissions.assertProjectRole(userId, projectId, 'editor');
    return this.aggregate(projectId, dto);
  }

  async getFileUsage(fileId: string, userId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: fileId },
      select: { folder: { select: { projectId: true } } },
    });
    if (!resource) {
      throw new AppException(
        'FILE_NOT_FOUND',
        'Recurso no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.permissions.assertProjectRole(
      userId,
      resource.folder.projectId,
      'editor',
    );
    const events = await this.prisma.resourceEvent.findMany({
      where: { resourceId: fileId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      total: events.length,
      byType: countByType(events),
      uniqueUsers: new Set(events.map((event) => event.userId).filter(Boolean)).size,
      lastEvents: events.slice(0, 20).map((event) => ({
        type: event.type,
        createdAt: event.createdAt,
        metadata: event.metadata,
      })),
    };
  }

  async exportCsv(projectId: string, userId: string, dto: UsageQueryDto) {
    const usage = await this.getProjectUsage(projectId, userId, dto);
    const lines = [
      'recurso,tipo,origen,validacion,vistas,descargas,busquedas,usos_quiz,usuarios_unicos,ultimo_evento',
      ...usage.resources.map((row) =>
        [
          csv(row.name),
          row.kind,
          row.origin,
          row.validationStatus,
          row.view,
          row.download,
          row.searchHit,
          row.quizUse,
          row.uniqueUsers,
          row.lastEventAt ? row.lastEventAt.toISOString() : '',
        ].join(','),
      ),
    ];
    return lines.join('\n');
  }

  async purgeExpired(): Promise<number> {
    const cutoff = new Date(
      Date.now() - this.retentionDays * 24 * 60 * 60 * 1000,
    );
    const result = await this.prisma.resourceEvent.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }

  private async aggregate(projectId: string, dto: UsageQueryDto) {
    const from = dto.from ? new Date(dto.from) : undefined;
    const to = dto.to ? new Date(dto.to) : undefined;
    const resourceFilter: Prisma.ResourceWhereInput = {
      ...(dto.resourceKind ? { kind: dto.resourceKind } : {}),
      ...(dto.origin ? { origin: dto.origin } : {}),
      ...(dto.validationStatus ? { validationStatus: dto.validationStatus } : {}),
    };
    const where: Prisma.ResourceEventWhereInput = {
      projectId,
      ...(dto.kind ? { type: dto.kind } : {}),
      ...(dto.resourceId ? { resourceId: dto.resourceId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(Object.keys(resourceFilter).length
        ? { resource: { is: resourceFilter } }
        : {}),
    };
    const events = await this.prisma.resourceEvent.findMany({
      where,
      include: {
        resource: {
          select: {
            name: true,
            kind: true,
            origin: true,
            validationStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 20_000,
    });
    if (events.length >= 20_000) {
      throw new AppException(
        'EXPORT_TOO_LARGE',
        'Hay demasiados eventos; acota el periodo o los filtros',
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    const byResource = new Map<
      string,
      {
        resourceId: string | null;
        name: string;
        kind: string;
        origin: string;
        validationStatus: string;
        view: number;
        download: number;
        searchHit: number;
        quizUse: number;
        users: Set<string>;
        lastEventAt: Date | null;
      }
    >();

    for (const event of events) {
      const key = event.resourceId ?? '__deleted__';
      const metadata = (event.metadata ?? {}) as Record<string, unknown>;
      const row =
        byResource.get(key) ??
        {
          resourceId: event.resourceId,
          name:
            event.resource?.name ??
            (typeof metadata.name === 'string' ? metadata.name : 'Recurso eliminado'),
          kind:
            event.resource?.kind ??
            (typeof metadata.resourceKind === 'string'
              ? metadata.resourceKind
              : 'UNKNOWN'),
          origin:
            event.resource?.origin ??
            (typeof metadata.origin === 'string' ? metadata.origin : 'UNKNOWN'),
          validationStatus:
            event.resource?.validationStatus ??
            (typeof metadata.validationStatus === 'string'
              ? metadata.validationStatus
              : 'UNKNOWN'),
          view: 0,
          download: 0,
          searchHit: 0,
          quizUse: 0,
          users: new Set<string>(),
          lastEventAt: null,
        };
      if (event.type === 'VIEW') row.view += 1;
      if (event.type === 'DOWNLOAD') row.download += 1;
      if (event.type === 'SEARCH_HIT') row.searchHit += 1;
      if (event.type === 'QUIZ_USE') row.quizUse += 1;
      if (event.userId) row.users.add(event.userId);
      row.lastEventAt = event.createdAt;
      byResource.set(key, row);
    }

    const resources = [...byResource.values()]
      .map((row) => ({
        resourceId: row.resourceId,
        name: row.name,
        kind: row.kind,
        origin: row.origin,
        validationStatus: row.validationStatus,
        view: row.view,
        download: row.download,
        searchHit: row.searchHit,
        quizUse: row.quizUse,
        uniqueUsers: row.users.size,
        lastEventAt: row.lastEventAt,
      }))
      .sort((a, b) => b.view + b.download - (a.view + a.download));

    return {
      filters: {
        from: dto.from ?? null,
        to: dto.to ?? null,
        kind: dto.kind ?? null,
        resourceKind: dto.resourceKind ?? null,
        origin: dto.origin ?? null,
        validationStatus: dto.validationStatus ?? null,
      },
      summary: {
        events: events.length,
        byType: countByType(events),
        uniqueUsers: new Set(events.map((event) => event.userId).filter(Boolean)).size,
        resources: resources.length,
        retentionDays: this.retentionDays,
      },
      resources,
    };
  }
}

function countByType(events: Array<{ type: string }>) {
  return events.reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});
}

function csv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}
