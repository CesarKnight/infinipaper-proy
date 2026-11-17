import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { ContentGenerationService } from './content-generation.service.js';
import {
  CreateMindmapDto,
  CreateQuizGenerationDto,
} from './dto/content-generation.dto.js';

@ApiTags('content-generation')
@Controller()
@UseGuards(ProjectAccessGuard)
export class ContentGenerationController {
  constructor(private readonly generation: ContentGenerationService) {}

  @Post('folders/:folderId/mindmaps')
  @RequireProjectRole('editor')
  createMindmap(
    @Param('folderId') folderId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateMindmapDto,
  ) {
    return this.generation.createMindmap(folderId, user.id, dto);
  }

  @Post('folders/:folderId/quizzes/generate')
  @RequireProjectRole('editor')
  createQuiz(
    @Param('folderId') folderId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateQuizGenerationDto,
  ) {
    return this.generation.createQuiz(folderId, user.id, dto);
  }

  @Get('generation-jobs/:generationJobId')
  @RequireProjectRole('editor')
  getJob(
    @Param('generationJobId') generationJobId: string,
    @CurrentUser() user: User,
  ) {
    return this.generation.getJob(generationJobId, user.id);
  }

  @Post('generation-jobs/:generationJobId/retry')
  @RequireProjectRole('editor')
  retry(
    @Param('generationJobId') generationJobId: string,
    @CurrentUser() user: User,
  ) {
    return this.generation.retry(generationJobId, user.id);
  }
}
