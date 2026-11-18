import { Module } from '@nestjs/common';
import { ProvenanceModule } from '../provenance/provenance.module.js';
import { QuizzesModule } from '../quizzes/quizzes.module.js';
import { ResourcesModule } from '../resources/resources.module.js';
import { ContentAgentClient } from './content-agent.client.js';
import { ContentGenerationController } from './content-generation.controller.js';
import { ContentGenerationQueueService } from './content-generation.queue.js';
import { ContentGenerationService } from './content-generation.service.js';
import { ContentGenerationWorker } from './content-generation.worker.js';
import { ResourceExtractionService } from './extraction.service.js';

@Module({
  imports: [ProvenanceModule, QuizzesModule, ResourcesModule],
  controllers: [ContentGenerationController],
  providers: [
    ContentAgentClient,
    ContentGenerationQueueService,
    ContentGenerationService,
    ContentGenerationWorker,
    ResourceExtractionService,
  ],
  exports: [ContentGenerationService],
})
export class ContentGenerationModule {}
