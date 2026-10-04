import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { AddMemberDto } from './dto/add-member.dto.js';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';

const USER_SELECT = {
  select: { id: true, username: true, displayName: true, avatarUrl: true },
} as const;

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: USER_SELECT },
      orderBy: { createdAt: 'asc' },
    });
  }

  async add(projectId: string, dto: AddMemberDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) {
      throw new AppException(
        'PROJECT_NOT_FOUND',
        'Proyecto no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.userId === project.ownerId) {
      throw new AppException(
        'MEMBER_ALREADY_EXISTS',
        'El propietario ya pertenece al proyecto',
        HttpStatus.CONFLICT,
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!user) {
      throw new AppException(
        'USER_NOT_FOUND',
        'Usuario no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: dto.userId } },
      select: { id: true },
    });
    if (existing) {
      throw new AppException(
        'MEMBER_ALREADY_EXISTS',
        'El usuario ya es participante',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role ?? 'VIEWER',
      },
      include: { user: USER_SELECT },
    });
  }

  async updateRole(
    projectId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (project && project.ownerId === userId) {
      throw new AppException(
        'OWNER_ROLE_IMMUTABLE',
        'No se puede cambiar el rol del propietario',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true },
    });
    if (!member) {
      throw new AppException(
        'MEMBER_NOT_FOUND',
        'Participante no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role: dto.role },
      include: { user: USER_SELECT },
    });
  }

  async remove(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (project && project.ownerId === userId) {
      throw new AppException(
        'OWNER_CANNOT_BE_REMOVED',
        'El propietario no puede ser retirado',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const result = await this.prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });
    if (result.count === 0) {
      throw new AppException(
        'MEMBER_NOT_FOUND',
        'Participante no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
