import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import type { Folder } from '../../generated/prisma/client.js';
import type { CreateFolderDto } from './dto/create-folder.dto.js';
import type { MoveFolderDto } from './dto/move-folder.dto.js';
import type { UpdateFolderDto } from './dto/update-folder.dto.js';

export interface FolderNode extends Folder {
  children: FolderNode[];
}

@Injectable()
export class FoldersService {
  private readonly avisoFilename: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    config: ConfigService,
  ) {
    this.avisoFilename =
      config.get<string>('AVISO_FILENAME') ?? 'aviso.md';
  }

  async listTree(projectId: string, sort: 'name' | 'createdAt' = 'name') {
    const folders = await this.prisma.folder.findMany({
      where: { projectId },
      orderBy: sort === 'name' ? { name: 'asc' } : { createdAt: 'asc' },
    });

    const root = folders.find((folder) => folder.isRoot);
    const nodes = new Map<string, FolderNode>();
    for (const folder of folders) {
      nodes.set(folder.id, { ...folder, children: [] });
    }
    for (const folder of folders) {
      if (folder.parentId) {
        nodes.get(folder.parentId)?.children.push(nodes.get(folder.id)!);
      }
    }

    return {
      rootId: root?.id ?? null,
      tree: root ? (nodes.get(root.id)?.children ?? []) : [],
    };
  }

  async getFolder(folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        resources: {
          select: { id: true, name: true, kind: true },
          where: { name: this.avisoFilename },
        },
      },
    });
    if (!folder) {
      throw new AppException(
        'FOLDER_NOT_FOUND',
        'Carpeta no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    const { resources, ...rest } = folder;
    return { ...rest, noticeResourceId: resources[0]?.id ?? null };
  }

  async create(projectId: string, dto: CreateFolderDto) {
    const parent = await this.resolveParent(projectId, dto.parentId);
    await this.ensureNameAvailable(projectId, parent.id, dto.name.trim());

    return this.prisma.folder.create({
      data: {
        projectId,
        parentId: parent.id,
        name: dto.name.trim(),
      },
    });
  }

  async rename(folderId: string, dto: UpdateFolderDto) {
    const folder = await this.getOrFail(folderId);
    if (folder.isRoot) {
      throw new AppException(
        'FOLDER_ROOT_IMMUTABLE',
        'La carpeta raíz no se puede renombrar',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    await this.ensureNameAvailable(
      folder.projectId,
      folder.parentId,
      dto.name.trim(),
      folder.id,
    );
    return this.prisma.folder.update({
      where: { id: folderId },
      data: { name: dto.name.trim() },
    });
  }

  async move(folderId: string, dto: MoveFolderDto) {
    const folder = await this.getOrFail(folderId);
    if (folder.isRoot) {
      throw new AppException(
        'FOLDER_ROOT_IMMUTABLE',
        'La carpeta raíz no se puede mover',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const target = await this.getOrFail(dto.parentId);
    if (target.projectId !== folder.projectId) {
      throw new AppException(
        'FOLDER_NOT_FOUND',
        'Carpeta destino inválida',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (await this.isDescendant(target.id, folder.id)) {
      throw new AppException(
        'FOLDER_CYCLE',
        'No se puede mover una carpeta dentro de su propia jerarquía',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    await this.ensureNameAvailable(
      folder.projectId,
      target.id,
      folder.name,
      folder.id,
    );

    return this.prisma.folder.update({
      where: { id: folderId },
      data: { parentId: target.id },
    });
  }

  async remove(folderId: string): Promise<void> {
    const folder = await this.getOrFail(folderId);
    if (folder.isRoot) {
      throw new AppException(
        'FOLDER_ROOT_IMMUTABLE',
        'La carpeta raíz no se puede eliminar',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const keys = await this.collectKeys(folderId);
    await this.prisma.folder.delete({ where: { id: folderId } });
    await Promise.allSettled(keys.map((key) => this.storage.delete(key)));
  }

  // ---------------------------------------------------------------

  private async getOrFail(folderId: string): Promise<Folder> {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
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

  private async resolveParent(
    projectId: string,
    parentId?: string,
  ): Promise<Folder> {
    if (parentId) {
      const parent = await this.getOrFail(parentId);
      if (parent.projectId !== projectId) {
        throw new AppException(
          'FOLDER_NOT_FOUND',
          'Carpeta padre inválida',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      return parent;
    }

    const root = await this.prisma.folder.findFirst({
      where: { projectId, isRoot: true },
    });
    if (!root) {
      throw new AppException(
        'FOLDER_NOT_FOUND',
        'Carpeta raíz no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    return root;
  }

  private async ensureNameAvailable(
    projectId: string,
    parentId: string | null,
    name: string,
    ignoreId?: string,
  ): Promise<void> {
    const duplicate = await this.prisma.folder.findFirst({
      where: {
        projectId,
        parentId,
        name: { equals: name, mode: 'insensitive' },
        ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppException(
        'FOLDER_NAME_TAKEN',
        'Ya existe una carpeta con ese nombre',
        HttpStatus.CONFLICT,
      );
    }
  }

  /** ¿`candidateId` es descendiente de `ancestorId`? */
  private async isDescendant(
    candidateId: string,
    ancestorId: string,
  ): Promise<boolean> {
    let current: string | null = candidateId;
    const visited = new Set<string>();
    while (current) {
      if (current === ancestorId) {
        return true;
      }
      if (visited.has(current)) {
        break;
      }
      visited.add(current);
      const node: { parentId: string | null } | null =
        await this.prisma.folder.findUnique({
          where: { id: current },
          select: { parentId: true },
        });
      current = node?.parentId ?? null;
    }
    return false;
  }

  private async collectKeys(folderId: string): Promise<string[]> {
    const ids = await this.descendantIds(folderId);
    ids.add(folderId);

    const resources = await this.prisma.resource.findMany({
      where: { folderId: { in: [...ids] } },
      select: { s3Key: true },
    });
    return resources.map((resource) => resource.s3Key);
  }

  private async descendantIds(folderId: string): Promise<Set<string>> {
    const result = new Set<string>();
    const queue = [folderId];
    while (queue.length) {
      const current = queue.shift()!;
      const children = await this.prisma.folder.findMany({
        where: { parentId: current },
        select: { id: true },
      });
      for (const child of children) {
        if (!result.has(child.id)) {
          result.add(child.id);
          queue.push(child.id);
        }
      }
    }
    return result;
  }
}
