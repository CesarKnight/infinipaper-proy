import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';

export const CONTENT_INDEX_QUEUE = 'content-index';

@Injectable()
export class SearchIndexQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SearchIndexQueueService.name);
  private readonly boss: PgBoss;

  constructor(config: ConfigService) {
    this.boss = new PgBoss({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async onModuleInit(): Promise<void> {
    this.boss.on('error', (error: Error) =>
      this.logger.error(`pg-boss search queue: ${error.message}`),
    );
    await this.boss.start();
    await this.boss.createQueue(CONTENT_INDEX_QUEUE);
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop({ graceful: true });
  }

  async enqueue(jobId: string): Promise<void> {
    await this.boss.send(CONTENT_INDEX_QUEUE, { jobId });
  }

  async registerWorker(
    handler: (data: { jobId: string }) => Promise<void>,
  ): Promise<string> {
    return this.boss.work<{ jobId: string }>(
      CONTENT_INDEX_QUEUE,
      async ([job]) => {
        await handler(job.data);
      },
    );
  }
}
