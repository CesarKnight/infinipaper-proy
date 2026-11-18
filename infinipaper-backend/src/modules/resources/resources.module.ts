import { Module } from '@nestjs/common';
import { QuizzesModule } from '../quizzes/quizzes.module.js';
import { SearchModule } from '../search/search.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { ResourcesController } from './resources.controller.js';
import { ResourcesService } from './resources.service.js';

@Module({
  imports: [UsageModule, SearchModule, QuizzesModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
