import { Injectable, OnModuleInit } from '@nestjs/common';
import { SearchIndexQueueService } from './search.queue.js';
import { SearchService } from './search.service.js';

@Injectable()
export class SearchWorker implements OnModuleInit {
  constructor(
    private readonly queue: SearchIndexQueueService,
    private readonly search: SearchService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.registerWorker(({ jobId }) => this.search.process(jobId));
  }
}
