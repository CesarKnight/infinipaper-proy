import { describe, expect, it, vi } from 'vitest';
import { PermissionsService } from './permissions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const archivedProject = {
  id: 'project-1',
  ownerId: 'owner-1',
  visibility: 'PRIVATE',
  status: 'ARCHIVED',
} as never;

function makeService() {
  const prisma = {
    project: { findUnique: vi.fn().mockResolvedValue(archivedProject) },
    projectMember: { findUnique: vi.fn() },
  };
  return {
    service: new PermissionsService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('PermissionsService', () => {
  it('maps STUDENT membership to viewer access', async () => {
    const { service, prisma } = makeService();
    prisma.projectMember.findUnique.mockResolvedValue({ role: 'STUDENT' });

    await expect(
      service.assertProjectRole('student-1', 'project-1', 'viewer'),
    ).resolves.toBe('viewer');
  });

  it('blocks editor writes in an archived project', async () => {
    const { service, prisma } = makeService();
    prisma.projectMember.findUnique.mockResolvedValue({ role: 'EDITOR' });

    await expect(
      service.assertProjectRole('editor-1', 'project-1', 'editor'),
    ).rejects.toMatchObject({ code: 'PROJECT_ARCHIVED' });
  });

  it('allows the owner to manage an archived project', async () => {
    const { service } = makeService();
    await expect(
      service.assertProjectRole('owner-1', 'project-1', 'owner'),
    ).resolves.toBe('owner');
  });
});
