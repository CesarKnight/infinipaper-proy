import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module.js';
import { QuizzesController } from './quizzes.controller.js';
import { QuizzesService } from './quizzes.service.js';

@Module({
  imports: [SearchModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
