import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

const OWNER_SELECT = {
  select: { id: true, username: true, displayName: true, avatarUrl: true },
} as const;

const CARD_INCLUDE = {
  owner: OWNER_SELECT,
  _count: { select: { folders: true, members: true } },
} as const;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, limit = 12) {
    const [
      owned,
      participatingRaw,
      publicProjects,
      ownedCount,
      participatingCount,
      publicCount,
    ] = await Promise.all([
      this.prisma.project.findMany({
        where: { ownerId: userId },
        include: CARD_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.project.findMany({
        where: {
          ownerId: { not: userId },
          members: { some: { userId } },
        },
        include: {
          ...CARD_INCLUDE,
          members: { where: { userId }, select: { role: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.project.findMany({
        where: {
          visibility: 'PUBLIC',
          ownerId: { not: userId },
          members: { none: { userId } },
        },
        include: CARD_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.project.count({ where: { ownerId: userId } }),
      this.prisma.project.count({
        where: { ownerId: { not: userId }, members: { some: { userId } } },
      }),
      this.prisma.project.count({
        where: {
          visibility: 'PUBLIC',
          ownerId: { not: userId },
          members: { none: { userId } },
        },
      }),
    ]);

    return {
      owned: owned.map((project) => ({ ...project, role: 'owner' })),
      participating: participatingRaw.map(({ members, ...project }) => ({
        ...project,
        role: members[0]?.role === 'EDITOR' ? 'editor' : 'viewer',
      })),
      public: publicProjects.map((project) => ({ ...project, role: 'public' })),
      counts: {
        owned: ownedCount,
        participating: participatingCount,
        public: publicCount,
      },
    };
  }
}
