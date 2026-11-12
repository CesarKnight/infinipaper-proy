import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';

export const NOTE_STRUCTURE_QUEUE = 'note-structure';

@Injectable()
export class NoteStructureQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NoteStructureQueueService.name);
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
    await this.boss.createQueue(NOTE_STRUCTURE_QUEUE);
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop({ graceful: true });
  }

  async enqueue(jobId: string): Promise<void> {
    await this.boss.send(NOTE_STRUCTURE_QUEUE, { jobId });
  }

  async registerWorker(
    handler: (data: { jobId: string }) => Promise<void>,
  ): Promise<string> {
    return this.boss.work<{ jobId: string }>(
      NOTE_STRUCTURE_QUEUE,
      async ([job]) => {
        await handler(job.data);
      },
    );
  }
}
