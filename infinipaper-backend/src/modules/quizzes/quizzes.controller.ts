import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { QuizzesService } from './quizzes.service.js';

@ApiTags('quizzes')
@Controller('projects/:projectId/quizzes')
@UseGuards(ProjectAccessGuard)
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Post()
  @RequireProjectRole('editor')
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizzes.create(projectId, user, dto);
  }

  @Get()
  @RequireProjectRole('viewer')
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: User) {
    return this.quizzes.findAll(projectId, user);
  }

  @Get(':quizId')
  @RequireProjectRole('viewer')
  findOne(
    @Param('projectId') projectId: string,
    @Param('quizId') quizId: string,
    @CurrentUser() user: User,
  ) {
    return this.quizzes.findOne(projectId, quizId, user);
  }

  @Post(':quizId/submit')
  @RequireProjectRole('viewer')
  submit(
    @Param('projectId') projectId: string,
    @Param('quizId') quizId: string,
    @CurrentUser() user: User,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizzes.submit(projectId, quizId, user, dto);
  }

  @Get(':quizId/my-submission')
  @RequireProjectRole('viewer')
  getMySubmission(
    @Param('projectId') projectId: string,
    @Param('quizId') quizId: string,
    @CurrentUser() user: User,
  ) {
    return this.quizzes.getMySubmission(projectId, quizId, user.id);
  }
}
