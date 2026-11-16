import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';
import { ProjectsService } from './projects.service.js';

export const PROJECT_PURGE_QUEUE = 'project-purge';

@Injectable()
export class ProjectPurgeQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ProjectPurgeQueueService.name);
  private readonly boss: PgBoss;
  private readonly cron: string;

  constructor(
    config: ConfigService,
    private readonly projects: ProjectsService,
  ) {
    this.boss = new PgBoss({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    this.cron = config.get<string>('PROJECT_PURGE_CRON') ?? '0 * * * *';
  }

  async onModuleInit(): Promise<void> {
    this.boss.on('error', (error: Error) =>
      this.logger.error(`pg-boss project purge: ${error.message}`),
    );
    await this.boss.start();
    await this.boss.createQueue(PROJECT_PURGE_QUEUE);
    await this.boss.schedule(PROJECT_PURGE_QUEUE, this.cron, {});
    await this.boss.work(PROJECT_PURGE_QUEUE, async () => {
      const purged = await this.projects.purgeExpired();
      if (purged > 0) {
        this.logger.log(`Proyectos purgados: ${purged}`);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.boss.stop({ graceful: true });
  }
}
