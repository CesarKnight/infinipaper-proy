import { Module } from '@nestjs/common';
import { QuizAssignmentsController } from './quiz-assignments.controller.js';
import { QuizAssignmentsService } from './quiz-assignments.service.js';

@Module({
  controllers: [QuizAssignmentsController],
  providers: [QuizAssignmentsService],
  exports: [QuizAssignmentsService],
})
export class QuizAssignmentsModule {}
