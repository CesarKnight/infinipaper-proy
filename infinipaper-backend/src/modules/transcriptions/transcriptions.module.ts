import { Module } from '@nestjs/common';
import { ProvenanceModule } from '../provenance/provenance.module.js';
import { ResourcesModule } from '../resources/resources.module.js';
import { SearchModule } from '../search/search.module.js';
import { AsrService } from './asr.service.js';
import { QueueService } from './queue.service.js';
import { TranscriptionsController } from './transcriptions.controller.js';
import { TranscriptionsService } from './transcriptions.service.js';
import { TranscriptionsWorker } from './transcriptions.worker.js';

@Module({
  imports: [ResourcesModule, ProvenanceModule, SearchModule],
  controllers: [TranscriptionsController],
  providers: [
    QueueService,
    AsrService,
    TranscriptionsService,
    TranscriptionsWorker,
  ],
})
export class TranscriptionsModule {}
