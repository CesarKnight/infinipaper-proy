import { Module } from '@nestjs/common';
import { ResourcesModule } from '../resources/resources.module.js';
import { AgentClientService } from './agent-client.service.js';
import { NoteStructureController } from './note-structure.controller.js';
import { NoteStructureQueueService } from './note-structure.queue.js';
import { NoteStructureService } from './note-structure.service.js';
import { NoteStructureWorker } from './note-structure.worker.js';

@Module({
  imports: [ResourcesModule],
  controllers: [NoteStructureController],
  providers: [
    AgentClientService,
    NoteStructureQueueService,
    NoteStructureService,
    NoteStructureWorker,
  ],
})
export class NoteStructureModule {}
