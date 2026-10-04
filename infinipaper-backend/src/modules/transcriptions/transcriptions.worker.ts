import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueService } from './queue.service.js';
import { TranscriptionsService } from './transcriptions.service.js';

@Injectable()
export class TranscriptionsWorker implements OnModuleInit {
  private readonly logger = new Logger(TranscriptionsWorker.name);

  constructor(
    private readonly queue: QueueService,
    private readonly transcriptions: TranscriptionsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.registerWorker(async ({ jobId }) => {
      this.logger.log(`Processing transcription job ${jobId}`);
      await this.transcriptions.process(jobId);
    });
  }
}
