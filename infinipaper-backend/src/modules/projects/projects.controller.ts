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
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { ListProjectsDto } from './dto/list-projects.dto.js';
import type { User } from '../../generated/prisma/client.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('projects')
@Controller('projects')
@UseGuards(ProjectAccessGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User, @Query() dto: ListProjectsDto) {
    return this.projects.findAccessible(user.id, dto);
  }

  @Public()
  @Get('public')
  findPublic(@Query() dto: PaginationDto) {
    return this.projects.findPublic(dto);
  }

  @Public()
  @Get(':projectId')
  @RequireProjectRole('viewer')
  findOne(
    @Param('projectId') projectId: string,
    @CurrentUser() user?: User,
  ) {
    return this.projects.findOne(projectId, user?.id ?? null);
  }

  @Patch(':projectId')
  @RequireProjectRole('owner')
  update(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(projectId, dto);
  }

  @Delete(':projectId')
  @RequireProjectRole('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('projectId') projectId: string): Promise<void> {
    await this.projects.remove(projectId);
  }
}
