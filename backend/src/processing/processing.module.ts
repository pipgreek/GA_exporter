import { Module } from '@nestjs/common';
import { QueueModule } from '../infrastructure/queue/queue.module';
import { StorageModule } from '../infrastructure/storage/storage.module';
import { PdfParsingModule } from '../pdf-parsing/pdf-parsing.module';
import { LlmModule } from '../llm/llm.module';
import { DocumentGenerationModule } from '../document-generation/document-generation.module';
import { PdfProcessingProcessor } from './pdf-processing.processor';
import { ProcessingController } from './processing.controller';
import { OrphanedJobsRecovery } from './orphaned-jobs.recovery';
import { ProcessingService } from './processing.service';

@Module({
  imports: [QueueModule, StorageModule, PdfParsingModule, LlmModule, DocumentGenerationModule],
  controllers: [ProcessingController],
  providers: [ProcessingService, PdfProcessingProcessor, OrphanedJobsRecovery],
  exports: [ProcessingService],
})
export class ProcessingModule {}
