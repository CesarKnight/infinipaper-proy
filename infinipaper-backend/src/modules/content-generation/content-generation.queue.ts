import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';

export const CONTENT_GENERATION_QUEUE = 'content-generation';

@Injectable()
export class ContentGenerationQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ContentGenerationQueueService.name);
  private readonly boss: PgBoss;

  constructor(config: ConfigService) {
    this.boss = new PgBoss({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async onModuleInit(): Promise<void> {
    this.boss.on('error', (error: Error) =>
      this.logger.error(`pg-boss content queue: ${error.message}`),
    );
    await this.boss.start();
    await this.boss.createQueue(CONTENT_GENERATION_QUEUE);
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop({ graceful: true });
  }

  async enqueue(jobId: string): Promise<void> {
    await this.boss.send(CONTENT_GENERATION_QUEUE, { jobId });
  }

  async registerWorker(
    handler: (data: { jobId: string }) => Promise<void>,
  ): Promise<string> {
    return this.boss.work<{ jobId: string }>(
      CONTENT_GENERATION_QUEUE,
      async ([job]) => {
        await handler(job.data);
      },
    );
  }
}
