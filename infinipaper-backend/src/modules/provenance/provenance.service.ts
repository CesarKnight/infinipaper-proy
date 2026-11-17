import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma, ResourceOrigin, ResourceSourceRelation } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import type { ValidateResourceDto } from './dto/provenance.dto.js';

const PROVENANCE_INCLUDE = {
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  validatedBy: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  sources: {
    select: {
      id: true,
      relation: true,
      sourceResourceId: true,
      sourceResource: {
        select: {
          id: true,
          name: true,
          origin: true,
          validationStatus: true,
          kind: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class ProvenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async get(fileId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: fileId },
      include: PROVENANCE_INCLUDE,
    });
    if (!resource) {
      throw this.notFound();
    }
    return resource;
  }

  async validate(fileId: string, userId: string, dto: ValidateResourceDto) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        folder: { select: { projectId: true } },
      },
    });
    if (!resource) {
      throw this.notFound();
    }
    await this.permissions.assertProjectRole(
      userId,
      resource.folder.projectId,
      'editor',
    );

    const updated = await this.prisma.resource.update({
      where: { id: fileId },
      data: {
        validationStatus: dto.status,
        validatedById: userId,
        validatedAt: new Date(),
        validationNote: dto.note?.trim() || null,
      },
      include: PROVENANCE_INCLUDE,
    });

    await this.prisma.auditEvent.create({
      data: {
        actorId: userId,
        action: dto.status === 'VERIFIED' ? 'RESOURCE_VERIFIED' : 'RESOURCE_REJECTED',
        entityType: 'Resource',
        entityId: fileId,
        metadata: { note: dto.note ?? null } as Prisma.InputJsonValue,
      },
    });
    return updated;
  }

  async setOrigin(resourceId: string, origin: ResourceOrigin): Promise<void> {
    await this.prisma.resource.update({
      where: { id: resourceId },
      data: { origin },
    });
  }

  async addSources(
    resourceId: string,
    sources: Array<{ resourceId: string; relation?: ResourceSourceRelation }>,
  ): Promise<void> {
    const unique = new Map<string, ResourceSourceRelation>();
    for (const source of sources) {
      if (!source.resourceId) continue;
      if (source.resourceId === resourceId) {
        throw new AppException(
          'RESOURCE_SOURCE_CYCLE',
          'Un recurso no puede ser fuente de sí mismo',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      unique.set(source.resourceId, source.relation ?? 'DERIVED_FROM');
    }
    if (!unique.size) return;

    const existing = await this.prisma.resource.findMany({
      where: { id: { in: [...unique.keys()] } },
      select: { id: true },
    });
    if (existing.length !== unique.size) {
      throw new AppException(
        'RESOURCE_SOURCE_NOT_FOUND',
        'Alguna fuente no existe',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    for (const sourceId of unique.keys()) {
      if (await this.reaches(sourceId, resourceId)) {
        throw new AppException(
          'RESOURCE_SOURCE_CYCLE',
          'La procedencia crearía un ciclo',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    await this.prisma.resourceSource.createMany({
      data: [...unique].map(([sourceResourceId, relation]) => ({
        resourceId,
        sourceResourceId,
        relation,
      })),
      skipDuplicates: true,
    });
  }

  async replaceSources(
    resourceId: string,
    sources: Array<{ resourceId: string; relation?: ResourceSourceRelation }>,
  ): Promise<void> {
    await this.prisma.resourceSource.deleteMany({ where: { resourceId } });
    await this.addSources(resourceId, sources);
  }

  private async reaches(startId: string, targetId: string): Promise<boolean> {
    const seen = new Set<string>();
    const queue = [startId];
    while (queue.length) {
      const current = queue.shift()!;
      if (current === targetId) return true;
      if (seen.has(current)) continue;
      seen.add(current);
      const edges = await this.prisma.resourceSource.findMany({
        where: { resourceId: current, sourceResourceId: { not: null } },
        select: { sourceResourceId: true },
      });
      for (const edge of edges) {
        if (edge.sourceResourceId) queue.push(edge.sourceResourceId);
      }
    }
    return false;
  }

  private notFound(): AppException {
    return new AppException(
      'FILE_NOT_FOUND',
      'Recurso no encontrado',
      HttpStatus.NOT_FOUND,
    );
  }
}
