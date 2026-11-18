import { createHash, randomUUID } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Readable } from 'node:stream';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import type { UploadedFileData } from '../../common/types/uploaded-file.js';
import type { ListResourcesDto } from './dto/list-resources.dto.js';
import type { Prisma, Resource } from '../../generated/prisma/client.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import { SearchService } from '../search/search.service.js';
import { isMarkdown, resolveKind } from './resource-kind.util.js';
import type { CreateNoteDto } from './dto/create-note.dto.js';
import type { RenameResourceDto } from './dto/rename-resource.dto.js';

const AUTHOR_SELECT = {
  select: { id: true, username: true, displayName: true, avatarUrl: true },
} as const;

@Injectable()
export class ResourcesService {
  private readonly maxUploadBytes: number;
  private readonly avisoFilename: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly permissions: PermissionsService,
    private readonly searchQueue: SearchService,
    config: ConfigService,
  ) {
    const maxMb = config.get<number>('MAX_UPLOAD_SIZE_MB') ?? 50;
    this.maxUploadBytes = maxMb * 1024 * 1024;
    this.avisoFilename = config.get<string>('AVISO_FILENAME') ?? 'aviso.md';
  }

  async listByFolder(folderId: string, dto: ListResourcesDto, userId?: string) {
    const limit = dto.limit ?? 50;
    const folder = await this.getFolderOrFail(folderId);
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: folder.projectId },
    });
    const role = await this.permissions.resolveRole(userId ?? null, project);

    const where: Prisma.ResourceWhereInput = {
      folderId,
      ...(dto.origin ? { origin: dto.origin } : {}),
      ...(dto.validationStatus ? { validationStatus: dto.validationStatus } : {}),
    };
    if (role !== 'owner' && role !== 'editor') {
      where.OR = [
        { kind: { not: 'QUIZ' } },
        {
          quiz: {
            assignments: {
              some: {
                status: { in: ['PUBLISHED', 'CLOSED'] },
                students: { some: { studentId: userId ?? '__none__' } },
              },
            },
          },
        },
      ];
    }

    const resources = await this.prisma.resource.findMany({
      where,
      include: {
        author: AUTHOR_SELECT,
        validatedBy: AUTHOR_SELECT,
        quiz: { select: { id: true, status: true, title: true } },
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
              },
            },
          },
        },
      },
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
      take: limit + 1,
      ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
    });

    const hasMore = resources.length > limit;
    const items = hasMore ? resources.slice(0, limit) : resources;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async getById(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        author: AUTHOR_SELECT,
        validatedBy: AUTHOR_SELECT,
        quiz: { select: { id: true, status: true, title: true } },
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
              },
            },
          },
        },
      },
    });
    if (!resource) {
      throw this.notFound();
    }
    return resource;
  }

  async createFromUpload(
    folderId: string,
    authorId: string,
    file: UploadedFileData,
  ) {
    const folder = await this.getFolderOrFail(folderId);

    if (file.size > this.maxUploadBytes) {
      throw new AppException(
        'FILE_TOO_LARGE',
        `El archivo supera el límite de ${this.maxUploadBytes / 1024 / 1024} MB`,
        HttpStatus.PAYLOAD_TOO_LARGE,
        { maxUploadSizeMb: this.maxUploadBytes / 1024 / 1024 },
      );
    }

    const info = resolveKind(file.originalname);
    if (!info) {
      throw new AppException(
        'FILE_UNSUPPORTED_TYPE',
        'Formato de archivo no admitido',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const name = await this.ensureNameAvailable(
      folderId,
      file.originalname,
    );
    const s3Key = `projects/${folder.projectId}/folders/${folderId}/${randomUUID()}/${name}`;

    await this.storage.put(s3Key, file.buffer, info.mimeType);

    const created = await this.prisma.resource.create({
      data: {
        folderId,
        authorId,
        name,
        kind: info.kind,
        origin: 'UPLOAD',
        mimeType: info.mimeType,
        size: file.size,
        s3Key,
        checksum: this.checksum(file.buffer),
      },
      include: { author: AUTHOR_SELECT },
    });
    void this.searchQueue.enqueueResource(created.id);
    return created;
  }

  async createNote(folderId: string, authorId: string, dto: CreateNoteDto) {
    const name = dto.name.toLowerCase().endsWith('.md')
      ? dto.name
      : `${dto.name}.md`;
    return this.createMarkdown(folderId, authorId, name, dto.content);
  }

  async createNotice(folderId: string, authorId: string, content: string) {
    return this.createMarkdown(
      folderId,
      authorId,
      this.avisoFilename,
      content,
    );
  }

  async createGenerated(
    folderId: string,
    authorId: string,
    input: {
      name: string;
      kind: 'MINDMAP' | 'QUIZ';
      mimeType: string;
      content: Buffer;
      origin: 'AI_MINDMAP' | 'AI_QUIZ' | 'QUIZ';
    },
  ) {
    const folder = await this.getFolderOrFail(folderId);
    const finalName = await this.ensureNameAvailable(folderId, input.name);
    const s3Key = `projects/${folder.projectId}/folders/${folderId}/${randomUUID()}/${finalName}`;
    await this.storage.put(s3Key, input.content, input.mimeType);
    const created = await this.prisma.resource.create({
      data: {
        folderId,
        authorId,
        name: finalName,
        kind: input.kind,
        origin: input.origin,
        validationStatus: 'UNVERIFIED',
        mimeType: input.mimeType,
        size: input.content.length,
        s3Key,
        checksum: this.checksum(input.content),
      },
      include: { author: AUTHOR_SELECT },
    });
    void this.searchQueue.enqueueResource(created.id);
    return created;
  }

  async readText(id: string): Promise<{ content: string }> {
    const resource = await this.getMarkdownOrFail(id);
    const object = await this.storage.get(resource.s3Key);
    const buffer = await this.streamToBuffer(object.body);
    return { content: buffer.toString('utf8') };
  }

  async updateContent(id: string, content: string) {
    const resource = await this.getMarkdownOrFail(id);
    const buffer = Buffer.from(content, 'utf8');
    await this.storage.put(resource.s3Key, buffer, resource.mimeType);
    const updated = await this.prisma.resource.update({
      where: { id },
      data: { size: buffer.length, checksum: this.checksum(buffer) },
      include: { author: AUTHOR_SELECT },
    });
    void this.searchQueue.enqueueResource(id);
    return updated;
  }

  async getContent(
    id: string,
    range?: string,
    userId?: string,
  ): Promise<{ object: Awaited<ReturnType<StorageService['get']>> }> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      select: {
        s3Key: true,
        kind: true,
        folder: { select: { project: true } },
      },
    });
    if (!resource) {
      throw this.notFound();
    }
    if (resource.kind === 'QUIZ') {
      const role = await this.permissions.resolveRole(
        userId ?? null,
        resource.folder.project,
      );
      if (role !== 'owner' && role !== 'editor') {
        throw new AppException(
          'QUIZ_CONTENT_FORBIDDEN',
          'El contenido del cuestionario no está disponible como archivo',
          HttpStatus.FORBIDDEN,
        );
      }
    }
    return { object: await this.storage.get(resource.s3Key, range) };
  }

  async rename(id: string, dto: RenameResourceDto) {
    const resource = await this.getOrFail(id);
    const info = resolveKind(dto.name);
    if (!info) {
      throw new AppException(
        'FILE_UNSUPPORTED_TYPE',
        'Formato de archivo no admitido',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }
    await this.ensureNameAvailable(resource.folderId, dto.name, id);
    return this.prisma.resource.update({
      where: { id },
      data: {
        name: dto.name,
        kind: info.kind,
        mimeType: info.mimeType,
      },
      include: { author: AUTHOR_SELECT },
    });
  }

  async remove(id: string): Promise<void> {
    const resource = await this.getOrFail(id);
    if (resource.kind === 'QUIZ') {
      const attempts = await this.prisma.quizAttempt.count({
        where: { assignment: { quiz: { resourceId: id } } },
      });
      if (attempts > 0) {
        throw new AppException(
          'QUIZ_HAS_ATTEMPTS',
          'El cuestionario tiene intentos y no se puede eliminar',
          HttpStatus.CONFLICT,
        );
      }
    }
    await this.prisma.resource.delete({ where: { id } });
    await this.storage.delete(resource.s3Key);
  }

  // ---------------------------------------------------------------

  private async createMarkdown(
    folderId: string,
    authorId: string,
    name: string,
    content: string,
  ) {
    const folder = await this.getFolderOrFail(folderId);
    const finalName = await this.ensureNameAvailable(folderId, name);
    const buffer = Buffer.from(content, 'utf8');
    const s3Key = `projects/${folder.projectId}/folders/${folderId}/${randomUUID()}/${finalName}`;

    await this.storage.put(s3Key, buffer, 'text/markdown');

    const created = await this.prisma.resource.create({
      data: {
        folderId,
        authorId,
        name: finalName,
        kind: 'MARKDOWN',
        origin: 'NOTE',
        mimeType: 'text/markdown',
        size: buffer.length,
        s3Key,
        checksum: this.checksum(buffer),
      },
      include: { author: AUTHOR_SELECT },
    });
    void this.searchQueue.enqueueResource(created.id);
    return created;
  }

  private async getFolderOrFail(folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, projectId: true },
    });
    if (!folder) {
      throw new AppException(
        'FOLDER_NOT_FOUND',
        'Carpeta no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    return folder;
  }

  private async getOrFail(id: string): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      throw this.notFound();
    }
    return resource;
  }

  private async getMarkdownOrFail(id: string): Promise<Resource> {
    const resource = await this.getOrFail(id);
    if (resource.kind !== 'MARKDOWN' && !isMarkdown(resource.name)) {
      throw new AppException(
        'FILE_UNSUPPORTED_TYPE',
        'El recurso no es un archivo Markdown',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }
    return resource;
  }

  private async ensureNameAvailable(
    folderId: string,
    name: string,
    ignoreId?: string,
  ): Promise<string> {
    const duplicate = await this.prisma.resource.findFirst({
      where: {
        folderId,
        name: { equals: name, mode: 'insensitive' },
        ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
      },
      select: { id: true },
    });
    if (!duplicate) {
      return name;
    }

    const suggested = this.suggestName(name);
    throw new AppException(
      'FILE_NAME_TAKEN',
      'Ya existe un archivo con ese nombre en la carpeta',
      HttpStatus.CONFLICT,
      { suggestedName: suggested },
    );
  }

  private suggestName(name: string): string {
    const dot = name.lastIndexOf('.');
    if (dot <= 0) {
      return `${name} (1)`;
    }
    return `${name.slice(0, dot)} (1)${name.slice(dot)}`;
  }

  private checksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }

  private notFound(): AppException {
    return new AppException(
      'FILE_NOT_FOUND',
      'Recurso no encontrado',
      HttpStatus.NOT_FOUND,
    );
  }
}
