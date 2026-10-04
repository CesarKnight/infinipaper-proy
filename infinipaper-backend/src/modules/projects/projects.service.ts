import { HttpStatus, Injectable } from '@nestjs/common';
import type { Project } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import type { PaginationDto } from '../../common/dto/pagination.dto.js';
import type { CreateProjectDto } from './dto/create-project.dto.js';
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
        ownerId: { not: userId },
        members: { none: { userId } },
      };
    default:
      return {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { visibility: 'PUBLIC' as const },
        ],
      };
  }
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly storage: StorageService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ownerId: userId,
        name: dto.name.trim(),
        description: dto.description ?? null,
        visibility: dto.visibility ?? 'PRIVATE',
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
            : members[0]
              ? 'viewer'
              : 'public',
    }));
    return { items, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  async findPublic(dto: PaginationDto) {
    const limit = dto.limit ?? 20;
    const projects = await this.prisma.project.findMany({
      where: { visibility: 'PUBLIC' },
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

    return { ...project, role };
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
      },
    });
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
}
