import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { MoveFolderDto } from './dto/move-folder.dto.js';
import { UpdateFolderDto } from './dto/update-folder.dto.js';
import { FoldersService } from './folders.service.js';

@ApiTags('folders')
@Controller()
@UseGuards(ProjectAccessGuard)
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Get('projects/:projectId/folders')
  @RequireProjectRole('viewer')
  list(
    @Param('projectId') projectId: string,
    @Query('sort') sort?: 'name' | 'createdAt',
  ) {
    return this.folders.listTree(projectId, sort ?? 'name');
  }

  @Post('projects/:projectId/folders')
  @RequireProjectRole('editor')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateFolderDto,
  ) {
    return this.folders.create(projectId, dto);
  }

  @Get('folders/:folderId')
  @RequireProjectRole('viewer')
  getOne(@Param('folderId') folderId: string) {
    return this.folders.getFolder(folderId);
  }

  @Patch('folders/:folderId')
  @RequireProjectRole('editor')
  rename(
    @Param('folderId') folderId: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folders.rename(folderId, dto);
  }

  @Patch('folders/:folderId/move')
  @RequireProjectRole('editor')
  move(@Param('folderId') folderId: string, @Body() dto: MoveFolderDto) {
    return this.folders.move(folderId, dto);
  }

  @Delete('folders/:folderId')
  @RequireProjectRole('editor')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('folderId') folderId: string): Promise<void> {
    await this.folders.remove(folderId);
  }
}
