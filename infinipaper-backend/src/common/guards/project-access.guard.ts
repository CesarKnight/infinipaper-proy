import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException } from '../errors/app.exception.js';
import {
  PermissionsService,
  type RequiredRole,
} from '../permissions/permissions.service.js';
import { PROJECT_ROLE_KEY } from '../decorators/require-project-role.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

interface RouteParams {
  projectId?: string;
  folderId?: string;
  fileId?: string;
  transcriptionId?: string;
}

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredRole>(
      PROJECT_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      AuthenticatedRequest & { params: RouteParams; projectId?: string }
    >();

    const projectId = await this.resolveProjectId(request.params);
    if (!projectId) {
      throw new AppException(
        'PROJECT_NOT_FOUND',
        'Proyecto no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.permissions.assertProjectRole(
      request.user?.id ?? null,
      projectId,
      required,
    );
    request.projectId = projectId;
    return true;
  }

  private async resolveProjectId(
    params: RouteParams,
  ): Promise<string | null> {
    if (params.projectId) {
      return params.projectId;
    }
    if (params.folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: params.folderId },
        select: { projectId: true },
      });
      return folder?.projectId ?? null;
    }
    if (params.fileId) {
      const resource = await this.prisma.resource.findUnique({
        where: { id: params.fileId },
        select: { folder: { select: { projectId: true } } },
      });
      return resource?.folder.projectId ?? null;
    }
    if (params.transcriptionId) {
      const job = await this.prisma.transcriptionJob.findUnique({
        where: { id: params.transcriptionId },
        select: { resource: { select: { folder: { select: { projectId: true } } } } },
      });
      return job?.resource.folder.projectId ?? null;
    }
    return null;
  }
}
