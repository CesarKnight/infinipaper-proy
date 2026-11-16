import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import {
  CreateQuizDto,
  SetQuizQuestionsDto,
  UpdateQuizDto,
} from './dto/quiz.dto.js';
import { QuizzesService } from './quizzes.service.js';

@ApiTags('quizzes')
@Controller()
@UseGuards(ProjectAccessGuard)
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Post('folders/:folderId/quizzes')
  @RequireProjectRole('editor')
  create(
    @Param('folderId') folderId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizzes.create(folderId, user.id, dto);
  }

  @Get('quizzes/:quizId')
  @RequireProjectRole('viewer')
  get(@Param('quizId') quizId: string, @CurrentUser() user: User) {
    return this.quizzes.get(quizId, user.id);
  }

  @Patch('quizzes/:quizId')
  @RequireProjectRole('editor')
  update(
    @Param('quizId') quizId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzes.update(quizId, user.id, dto);
  }

  @Put('quizzes/:quizId/questions')
  @RequireProjectRole('editor')
  setQuestions(
    @Param('quizId') quizId: string,
    @CurrentUser() user: User,
    @Body() dto: SetQuizQuestionsDto,
  ) {
    return this.quizzes.setQuestions(quizId, user.id, dto.questions);
  }

  @Post('quizzes/:quizId/publish')
  @RequireProjectRole('editor')
  publish(@Param('quizId') quizId: string, @CurrentUser() user: User) {
    return this.quizzes.publish(quizId, user.id);
  }

  @Post('quizzes/:quizId/archive')
  @RequireProjectRole('editor')
  archive(@Param('quizId') quizId: string, @CurrentUser() user: User) {
    return this.quizzes.archive(quizId, user.id);
  }

  @Post('quizzes/:quizId/duplicate')
  @RequireProjectRole('editor')
  duplicate(@Param('quizId') quizId: string, @CurrentUser() user: User) {
    return this.quizzes.duplicate(quizId, user.id);
  }
}
