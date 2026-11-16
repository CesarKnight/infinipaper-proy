import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import {
  CreateAssignmentDto,
  GradeAnswerDto,
  SaveAnswerDto,
} from './dto/assignment.dto.js';
import { QuizAssignmentsService } from './quiz-assignments.service.js';

@ApiTags('quiz-assignments')
@Controller()
@UseGuards(ProjectAccessGuard)
export class QuizAssignmentsController {
  constructor(private readonly assignments: QuizAssignmentsService) {}

  @Post('quizzes/:quizId/assignments')
  @RequireProjectRole('editor')
  create(
    @Param('quizId') quizId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignments.create(quizId, user.id, dto);
  }

  @Get('assignments/mine')
  mine(@CurrentUser() user: User) {
    return this.assignments.listMine(user.id);
  }

  @Get('assignments/:assignmentId')
  @RequireProjectRole('viewer')
  getForStudent(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignments.getForStudent(assignmentId, user.id);
  }

  @Get('projects/:projectId/assignments')
  @RequireProjectRole('editor')
  listByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignments.listByProject(projectId, user.id);
  }

  @Post('assignments/:assignmentId/publish')
  @RequireProjectRole('editor')
  publish(@Param('assignmentId') assignmentId: string, @CurrentUser() user: User) {
    return this.assignments.publish(assignmentId, user.id);
  }

  @Post('assignments/:assignmentId/close')
  @RequireProjectRole('editor')
  close(@Param('assignmentId') assignmentId: string, @CurrentUser() user: User) {
    return this.assignments.close(assignmentId, user.id);
  }

  @Post('assignments/:assignmentId/attempts')
  @RequireProjectRole('viewer')
  startAttempt(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignments.startAttempt(assignmentId, user.id);
  }

  @Get('assignments/:assignmentId/results')
  @RequireProjectRole('editor')
  results(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignments.results(assignmentId, user.id);
  }

  @Post('assignments/:assignmentId/publish-results')
  @RequireProjectRole('editor')
  publishResults(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignments.publishResults(assignmentId, user.id);
  }

  @Get('attempts/:attemptId')
  @RequireProjectRole('viewer')
  getAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: User,
  ) {
    return this.assignments.getAttempt(attemptId, user.id);
  }

  @Patch('attempts/:attemptId/answers')
  @RequireProjectRole('viewer')
  saveAnswer(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: User,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.assignments.saveAnswer(attemptId, user.id, dto);
  }

  @Post('attempts/:attemptId/submit')
  @RequireProjectRole('viewer')
  submit(@Param('attemptId') attemptId: string, @CurrentUser() user: User) {
    return this.assignments.submit(attemptId, user.id);
  }

  @Patch('attempts/:attemptId/answers/:answerId/grade')
  @RequireProjectRole('editor')
  gradeAnswer(
    @Param('attemptId') attemptId: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: User,
    @Body() dto: GradeAnswerDto,
  ) {
    return this.assignments.gradeAnswer(attemptId, answerId, user.id, dto);
  }
}
