import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NoteStructureService } from './note-structure.service.js';

const prisma = {
  resource: { findUnique: vi.fn() },
  noteStructureJob: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};
const storage = { getPresignedGetUrl: vi.fn() };
const resources = { createNote: vi.fn() };
const agent = { isEnabled: vi.fn(() => true), structure: vi.fn() };
const queue = { enqueue: vi.fn() };
const config = { get: vi.fn((_key: string, fallback: unknown) => fallback) };

function makeService(): NoteStructureService {
  return new NoteStructureService(
    prisma as never,
    storage as never,
    resources as never,
    agent as never,
    queue as never,
    config as never,
  );
}

describe('NoteStructureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    agent.isEnabled.mockReturnValue(true);
    queue.enqueue.mockResolvedValue(undefined);
  });

  it('creates and enqueues a job for a markdown note', async () => {
    prisma.resource.findUnique.mockResolvedValue({
      id: 'res-1',
      name: 'tema.md',
      kind: 'MARKDOWN',
      checksum: 'abc',
      folder: { projectId: 'proj-1' },
    });
    prisma.noteStructureJob.findFirst.mockResolvedValue(null);
    prisma.noteStructureJob.create.mockResolvedValue({
      id: 'job-1',
      status: 'QUEUED',
    });

    const service = makeService();
    const job = await service.createJob('res-1', 'user-1', {
      instructions: 'Ordena',
    });

    expect(job).toEqual({ id: 'job-1', status: 'QUEUED' });
    expect(queue.enqueue).toHaveBeenCalledWith('job-1');
  });

  it('rejects a job when there is already an active one', async () => {
    prisma.resource.findUnique.mockResolvedValue({
      id: 'res-1',
      name: 'tema.md',
      kind: 'MARKDOWN',
      checksum: 'abc',
      folder: { projectId: 'proj-1' },
    });
    prisma.noteStructureJob.findFirst.mockResolvedValue({ id: 'job-active' });

    const service = makeService();
    await expect(
      service.createJob('res-1', 'user-1', {}),
    ).rejects.toMatchObject({
      code: 'STRUCTURE_JOB_IN_PROGRESS',
      details: { jobId: 'job-active' },
    });
  });

  it('rejects non-markdown resources', async () => {
    prisma.resource.findUnique.mockResolvedValue({
      id: 'res-1',
      name: 'foto.png',
      kind: 'IMAGE',
      checksum: 'abc',
      folder: { projectId: 'proj-1' },
    });

    const service = makeService();
    await expect(
      service.createJob('res-1', 'user-1', {}),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_SOURCE_TYPE' });
  });

  it('applies a done job as a new note', async () => {
    prisma.noteStructureJob.findUnique.mockResolvedValue({
      id: 'job-1',
      resourceId: 'res-1',
      status: 'DONE',
      resultMarkdown: '# Tema',
      resultResourceId: null,
    });
    prisma.resource.findUnique.mockResolvedValue({
      id: 'res-1',
      name: 'tema.md',
      folderId: 'folder-1',
    });
    resources.createNote.mockResolvedValue({ id: 'new-resource' });
    prisma.noteStructureJob.update.mockResolvedValue({});

    const service = makeService();
    const created = await service.apply('job-1', 'user-1', {});

    expect(resources.createNote).toHaveBeenCalledWith('folder-1', 'user-1', {
      name: 'tema-estructurado.md',
      content: '# Tema',
    });
    expect(created).toEqual({ id: 'new-resource' });
  });
});
