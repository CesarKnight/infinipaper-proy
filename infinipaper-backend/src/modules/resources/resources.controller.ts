import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import { AppException } from '../../common/errors/app.exception.js';
import type { User } from '../../generated/prisma/client.js';
import type { UploadedFileData } from '../../common/types/uploaded-file.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { RenameResourceDto } from './dto/rename-resource.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';
import { ResourcesService } from './resources.service.js';

const ABSOLUTE_MAX_BYTES = 200 * 1024 * 1024;

@ApiTags('files')
@Controller()
@UseGuards(ProjectAccessGuard)
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get('folders/:folderId/files')
  @RequireProjectRole('viewer')
  list(@Param('folderId') folderId: string, @Query() dto: PaginationDto) {
    return this.resources.listByFolder(folderId, dto);
  }

  @Post('folders/:folderId/files')
  @RequireProjectRole('editor')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: ABSOLUTE_MAX_BYTES } }),
  )
  upload(
    @Param('folderId') folderId: string,
    @CurrentUser() user: User,
    @UploadedFile() file?: UploadedFileData,
  ) {
    if (!file) {
      throw new AppException(
        'FILE_REQUIRED',
        'Debes adjuntar un archivo',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return this.resources.createFromUpload(folderId, user.id, file);
  }

  @Post('folders/:folderId/notes')
  @RequireProjectRole('editor')
  createNote(
    @Param('folderId') folderId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateNoteDto,
  ) {
    return this.resources.createNote(folderId, user.id, dto);
  }

  @Post('folders/:folderId/notice')
  @RequireProjectRole('editor')
  createNotice(
    @Param('folderId') folderId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateNoticeDto,
  ) {
    return this.resources.createNotice(folderId, user.id, dto.content);
  }

  @Get('files/:fileId')
  @RequireProjectRole('viewer')
  getOne(@Param('fileId') fileId: string) {
    return this.resources.getById(fileId);
  }

  @Get('files/:fileId/text')
  @RequireProjectRole('viewer')
  readText(@Param('fileId') fileId: string) {
    return this.resources.readText(fileId);
  }

  @Get('files/:fileId/content')
  @RequireProjectRole('viewer')
  async content(
    @Param('fileId') fileId: string,
    @Res() res: Response,
    @Headers('range') range?: string,
  ): Promise<void> {
    const { object } = await this.resources.getContent(fileId, range);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader(
      'Content-Type',
      object.contentType ?? 'application/octet-stream',
    );
    if (object.contentRange) {
      res.status(HttpStatus.PARTIAL_CONTENT);
      res.setHeader('Content-Range', object.contentRange);
    }
    if (object.contentLength) {
      res.setHeader('Content-Length', object.contentLength);
    }
    object.body.pipe(res);
  }

  @Put('files/:fileId/content')
  @RequireProjectRole('editor')
  updateContent(
    @Param('fileId') fileId: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.resources.updateContent(fileId, dto.content);
  }

  @Patch('files/:fileId')
  @RequireProjectRole('editor')
  rename(@Param('fileId') fileId: string, @Body() dto: RenameResourceDto) {
    return this.resources.rename(fileId, dto);
  }

  @Delete('files/:fileId')
  @RequireProjectRole('editor')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('fileId') fileId: string): Promise<void> {
    await this.resources.remove(fileId);
  }
}
