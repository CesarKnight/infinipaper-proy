import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';

export const TRANSCRIPTION_QUEUE = 'transcription';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly boss: PgBoss;

  constructor(config: ConfigService) {
    this.boss = new PgBoss({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async onModuleInit(): Promise<void> {
    this.boss.on('error', (error: Error) =>
      this.logger.error(`pg-boss error: ${error.message}`),
    );
    await this.boss.start();
    await this.boss.createQueue(TRANSCRIPTION_QUEUE);
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop({ graceful: true });
  }

  async enqueue(jobId: string): Promise<void> {
    await this.boss.send(TRANSCRIPTION_QUEUE, { jobId });
  }

  async registerWorker(
    handler: (data: { jobId: string }) => Promise<void>,
  ): Promise<string> {
    return this.boss.work<{ jobId: string }>(TRANSCRIPTION_QUEUE, async ([job]) => {
      await handler(job.data);
    });
  }
}
