import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, Project } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import type { PaginationDto } from '../../common/dto/pagination.dto.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
import type { ExtendArchiveDto } from './dto/extend-archive.dto.js';
import type { ListProjectsDto, ProjectScope } from './dto/list-projects.dto.js';
import type { UpdateProjectDto } from './dto/update-project.dto.js';

const OWNER_SELECT = {
  select: { id: true, username: true, displayName: true, avatarUrl: true },
} as const;

const CARD_INCLUDE = {
  owner: OWNER_SELECT,
  _count: { select: { folders: true, members: true } },
} as const;

function scopeWhere(userId: string, scope: ProjectScope) {
  switch (scope) {
    case 'owned':
      return { ownerId: userId };
    case 'participating':
      return { ownerId: { not: userId }, members: { some: { userId } } };
    case 'public':
      return {
        visibility: 'PUBLIC' as const,
        status: 'ACTIVE' as const,
        ownerId: { not: userId },
        members: { none: { userId } },
      };
    default:
      return {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { visibility: 'PUBLIC' as const, status: 'ACTIVE' as const },
        ],
      };
  }
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly archiveAccessDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly storage: StorageService,
    config: ConfigService,
  ) {
    this.archiveAccessDays =
      config.get<number>('PROJECT_ARCHIVE_ACCESS_DAYS') ?? 30;
  }

  async create(userId: string, dto: CreateProjectDto) {
    const type = dto.type ?? 'PERSONAL';
    if (type === 'COURSE') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          teacherProfile: { select: { status: true } },
        },
      });
      if (
        !user ||
        user.role !== 'TEACHER' ||
        user.teacherProfile?.status !== 'VERIFIED'
      ) {
        throw new AppException(
          'TEACHER_VERIFICATION_REQUIRED',
          'Solo un docente verificado puede crear proyectos de curso',
          HttpStatus.FORBIDDEN,
        );
      }
      if (!dto.institution || !dto.period) {
        throw new AppException(
          'COURSE_METADATA_REQUIRED',
          'La institución y el periodo son obligatorios para un curso',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    return this.prisma.project.create({
      data: {
        ownerId: userId,
        name: dto.name.trim(),
        description: dto.description ?? null,
        visibility: dto.visibility ?? 'PRIVATE',
        type,
        institution: dto.institution?.trim() ?? null,
        period: dto.period?.trim() ?? null,
        subject: dto.subject?.trim() ?? null,
        code: dto.code?.trim() ?? null,
        folders: {
          create: { name: 'root', isRoot: true },
        },
      },
      include: { owner: OWNER_SELECT },
    });
  }

  async findAccessible(userId: string, dto: ListProjectsDto) {
    const limit = dto.limit ?? 20;
    const projects = await this.prisma.project.findMany({
      where: scopeWhere(userId, dto.scope ?? 'all'),
      include: {
        ...CARD_INCLUDE,
        members: { where: { userId }, select: { role: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
    });

    const hasMore = projects.length > limit;
    const page = hasMore ? projects.slice(0, limit) : projects;
    const items = page.map(({ members, ...project }) => ({
      ...project,
      role:
        project.ownerId === userId
          ? 'owner'
          : members[0]?.role === 'EDITOR'
            ? 'editor'
            : members[0]?.role === 'STUDENT'
              ? 'student'
              : members[0]
                ? 'viewer'
                : 'public',
    }));
    return { items, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  async findPublic(dto: PaginationDto) {
    const limit = dto.limit ?? 20;
    const projects = await this.prisma.project.findMany({
      where: { visibility: 'PUBLIC', status: 'ACTIVE' },
      include: CARD_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, limit) : projects;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async findOne(id: string, userId: string | null) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: OWNER_SELECT,
        _count: { select: { folders: true, members: true } },
      },
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
        'No tienes permisos suficientes',
        HttpStatus.FORBIDDEN,
      );
    }

    const membership = userId
      ? await this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: id, userId } },
          select: { role: true },
        })
      : null;

    return {
      ...project,
      role:
        project.ownerId === userId
          ? 'owner'
          : membership?.role === 'STUDENT'
            ? 'student'
            : role,
    };
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
        ...(dto.institution !== undefined
          ? { institution: dto.institution?.trim() || null }
          : {}),
        ...(dto.period !== undefined
          ? { period: dto.period?.trim() || null }
          : {}),
        ...(dto.subject !== undefined
          ? { subject: dto.subject?.trim() || null }
          : {}),
        ...(dto.code !== undefined
          ? { code: dto.code?.trim() || null }
          : {}),
      },
    });
  }

  async archive(id: string, actorId: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new AppException(
        'PROJECT_NOT_FOUND',
        'Proyecto no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    if (project.status === 'ARCHIVED') {
      throw new AppException(
        'PROJECT_ALREADY_ARCHIVED',
        'El proyecto ya está archivado',
        HttpStatus.CONFLICT,
      );
    }

    const now = new Date();
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: now,
        archiveAccessUntil: this.addDays(now, this.archiveAccessDays),
      },
    });
    await this.audit(actorId, 'PROJECT_ARCHIVED', id, {
      archiveAccessUntil: updated.archiveAccessUntil,
    });
    return updated;
  }

  async extendArchive(
    id: string,
    actorId: string,
    dto: ExtendArchiveDto,
  ): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new AppException(
        'PROJECT_NOT_FOUND',
        'Proyecto no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    if (project.status !== 'ARCHIVED') {
      throw new AppException(
        'PROJECT_NOT_ARCHIVED',
        'El proyecto no está archivado',
        HttpStatus.CONFLICT,
      );
    }

    const days = dto.days ?? this.archiveAccessDays;
    const updated = await this.prisma.project.update({
      where: { id },
      data: { archiveAccessUntil: this.addDays(new Date(), days) },
    });
    await this.audit(actorId, 'PROJECT_ARCHIVE_EXTENDED', id, { days });
    return updated;
  }

  async restore(id: string, actorId: string): Promise<Project> {
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        archivedAt: null,
        archiveAccessUntil: null,
      },
    });
    await this.audit(actorId, 'PROJECT_RESTORED', id, {});
    return updated;
  }

  async purgeExpired(): Promise<number> {
    const expired = await this.prisma.project.findMany({
      where: {
        status: 'ARCHIVED',
        archiveAccessUntil: { lte: new Date() },
      },
      select: {
        id: true,
        ownerId: true,
        folders: {
          select: { resources: { select: { s3Key: true } } },
        },
      },
    });

    let purged = 0;
    for (const project of expired) {
      const keys = project.folders.flatMap((folder) =>
        folder.resources.map((resource) => resource.s3Key),
      );
      const results = await Promise.allSettled(
        keys.map((key) => this.storage.delete(key)),
      );
      if (results.some((result) => result.status === 'rejected')) {
        this.logger.error(
          `No se pudo purgar el proyecto ${project.id}: fallo al borrar archivos`,
        );
        continue;
      }

      await this.prisma.project.delete({ where: { id: project.id } });
      await this.audit(null, 'PROJECT_PURGED', project.id, {
        ownerId: project.ownerId,
        resources: keys.length,
      });
      purged += 1;
    }
    return purged;
  }

  async remove(id: string): Promise<void> {
    const folders = await this.prisma.folder.findMany({
      where: { projectId: id },
      select: { resources: { select: { s3Key: true } } },
    });
    const keys = folders.flatMap((folder) =>
      folder.resources.map((resource) => resource.s3Key),
    );

    await this.prisma.project.delete({ where: { id } });
    await Promise.allSettled(keys.map((key) => this.storage.delete(key)));
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private audit(
    actorId: string | null,
    action: string,
    entityId: string,
    metadata: Record<string, unknown>,
  ): Promise<unknown> {
    return this.prisma.auditEvent.create({
      data: {
        actorId,
        action,
        entityType: 'Project',
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}
