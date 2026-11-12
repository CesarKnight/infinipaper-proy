import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NoteStructureQueueService } from './note-structure.queue.js';
import { NoteStructureService } from './note-structure.service.js';

@Injectable()
export class NoteStructureWorker implements OnModuleInit {
  private readonly logger = new Logger(NoteStructureWorker.name);

  constructor(
    private readonly queue: NoteStructureQueueService,
    private readonly noteStructure: NoteStructureService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.registerWorker(async ({ jobId }) => {
      this.logger.log(`Processing note structure job ${jobId}`);
      await this.noteStructure.process(jobId);
    });
  }
}
