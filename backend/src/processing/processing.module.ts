import { Module } from '@nestjs/common';
import { QueueModule } from '../infrastructure/queue/queue.module';
import { StorageModule } from '../infrastructure/storage/storage.module';
import { PdfParsingModule } from '../pdf-parsing/pdf-parsing.module';
import { PdfProcessingProcessor } from './pdf-processing.processor';
import { ProcessingController } from './processing.controller';
import { ProcessingService } from './processing.service';

@Module({
  imports: [QueueModule, StorageModule, PdfParsingModule],
  controllers: [ProcessingController],
  providers: [ProcessingService, PdfProcessingProcessor],
  exports: [ProcessingService],
})
export class ProcessingModule {}
