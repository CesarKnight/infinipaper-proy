import { Injectable, OnModuleInit } from '@nestjs/common';
import { ContentGenerationQueueService } from './content-generation.queue.js';
import { ContentGenerationService } from './content-generation.service.js';

@Injectable()
export class ContentGenerationWorker implements OnModuleInit {
  constructor(
    private readonly queue: ContentGenerationQueueService,
    private readonly generation: ContentGenerationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.registerWorker(({ jobId }) =>
      this.generation.process(jobId),
    );
  }
}
