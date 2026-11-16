import { Module } from '@nestjs/common';
import { AdminProjectsController } from './admin-projects.controller.js';
import { ProjectPurgeQueueService } from './project-purge.queue.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

@Module({
  controllers: [ProjectsController, AdminProjectsController],
  providers: [ProjectsService, ProjectPurgeQueueService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
