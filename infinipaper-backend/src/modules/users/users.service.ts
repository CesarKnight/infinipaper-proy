import { HttpStatus, Injectable } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import type { UploadedFileData } from '../../common/types/uploaded-file.js';
import { PasswordService } from '../auth/password.service.js';
import { SessionService } from '../auth/session.service.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { SearchUsersDto } from './dto/search-users.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly password: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  async search(dto: SearchUsersDto) {
    const limit = dto.limit ?? 20;
    const query = dto.query?.trim();

    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        ...(query
          ? {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: PUBLIC_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), status: 'ACTIVE' },
      select: {
        ...PUBLIC_USER_SELECT,
        projects: {
          where: { visibility: 'PUBLIC' },
          select: { id: true, name: true, description: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new AppException(
        'USER_NOT_FOUND',
        'Usuario no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined
          ? { displayName: dto.displayName.trim() }
          : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
      },
      select: PUBLIC_USER_SELECT,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppException('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    const valid = await this.password.verify(
      user.passwordHash,
      dto.currentPassword,
    );
    if (!valid) {
      throw new AppException(
        'AUTH_INVALID_PASSWORD',
        'La contraseña actual es incorrecta',
        HttpStatus.FORBIDDEN,
      );
    }

    const passwordHash = await this.password.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async setAvatar(
    user: User,
    file: UploadedFileData,
  ): Promise<{ avatarUrl: string }> {
    const key = `avatars/${user.id}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    const avatarUrl = `/api/v1/users/${user.username}/avatar`;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });
    return { avatarUrl };
  }

  async getAvatar(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase(), status: 'ACTIVE' },
      select: { id: true },
    });
    if (!user) {
      throw new AppException('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    return this.storage.get(`avatars/${user.id}`);
  }

  async archive(userId: string): Promise<void> {
    const privateProjects = await this.prisma.project.findMany({
      where: { ownerId: userId, visibility: 'PRIVATE' },
      select: {
        folders: {
          select: { resources: { select: { s3Key: true } } },
        },
      },
    });

    const keys = privateProjects.flatMap((project) =>
      project.folders.flatMap((folder) =>
        folder.resources.map((resource) => resource.s3Key),
      ),
    );

    await this.prisma.$transaction([
      this.prisma.project.deleteMany({
        where: { ownerId: userId, visibility: 'PRIVATE' },
      }),
      this.prisma.projectMember.deleteMany({ where: { userId } }),
      this.prisma.session.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { status: 'ARCHIVED', avatarUrl: null },
      }),
    ]);

    await Promise.allSettled([
      ...keys.map((key) => this.storage.delete(key)),
      this.storage.delete(`avatars/${userId}`),
    ]);
  }
}
