import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module.js';
import { EmbeddingsService } from './embeddings.service.js';
import { SearchController } from './search.controller.js';
import { SearchIndexQueueService } from './search.queue.js';
import { SearchService } from './search.service.js';
import { SearchWorker } from './search.worker.js';

@Module({
  imports: [UsageModule],
  controllers: [SearchController],
  providers: [
    EmbeddingsService,
    SearchIndexQueueService,
    SearchService,
    SearchWorker,
  ],
  exports: [SearchIndexQueueService, SearchService],
})
export class SearchModule {}
