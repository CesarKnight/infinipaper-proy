import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module.js';
import { QuizAssignmentsController } from './quiz-assignments.controller.js';
import { QuizAssignmentsService } from './quiz-assignments.service.js';

@Module({
  imports: [UsageModule],
  controllers: [QuizAssignmentsController],
  providers: [QuizAssignmentsService],
  exports: [QuizAssignmentsService],
})
export class QuizAssignmentsModule {}
