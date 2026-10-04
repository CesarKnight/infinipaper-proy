import { HttpStatus, Injectable } from '@nestjs/common';
import type { Project } from '../../generated/prisma/client.js';
import { AppException } from '../errors/app.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type AccessRole = 'owner' | 'editor' | 'viewer' | 'public';

const ROLE_WEIGHT: Record<AccessRole, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
  public: 0,
};

export type RequiredRole = 'owner' | 'editor' | 'viewer';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Rol efectivo de un usuario (o anónimo) sobre un proyecto, o null si no tiene acceso. */
  async resolveRole(
    userId: string | null | undefined,
    project: Project,
  ): Promise<AccessRole | null> {
    if (userId && userId === project.ownerId) {
      return 'owner';
    }

    if (userId) {
      const membership = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId } },
        select: { role: true },
      });
      if (membership) {
        return membership.role === 'EDITOR' ? 'editor' : 'viewer';
      }
    }

    if (project.visibility === 'PUBLIC') {
      return 'public';
    }

    return null;
  }

  async assertProjectRole(
    userId: string | null | undefined,
    projectId: string,
    required: RequiredRole,
  ): Promise<AccessRole> {
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

    const role = await this.resolveRole(userId, project);
    if (!role) {
      throw new AppException(
        'PROJECT_FORBIDDEN',
        'No tienes permisos suficientes',
        HttpStatus.FORBIDDEN,
      );
    }
    // El acceso público solo concede lectura.
    if (required === 'viewer' && role === 'public') {
      return role;
    }
    if (ROLE_WEIGHT[role] < ROLE_WEIGHT[required]) {
      throw new AppException(
        'PROJECT_FORBIDDEN',
        'No tienes permisos suficientes',
        HttpStatus.FORBIDDEN,
      );
    }
    return role;
  }

  async getProjectByFolder(folderId: string): Promise<Project> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: { project: true },
    });
    if (!folder) {
      throw new AppException(
        'FOLDER_NOT_FOUND',
        'Carpeta no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    return folder.project;
  }

  async getProjectByResource(resourceId: string): Promise<Project> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: { folder: { include: { project: true } } },
    });
    if (!resource) {
      throw new AppException(
        'FILE_NOT_FOUND',
        'Recurso no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    return resource.folder.project;
  }
}
