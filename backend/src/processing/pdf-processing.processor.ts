import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GA_EXPORT_QUEUE } from '../infrastructure/queue/queue.constants';
import { SupabaseStorageService } from '../infrastructure/storage/storage.service';
import { PdfParserService } from '../pdf-parsing/pdf-parser.service';
import { PdfProcessingJobData, PdfProcessingResult, ProcessingProgress } from './processing.types';

@Processor(GA_EXPORT_QUEUE, { concurrency: 1 })
export class PdfProcessingProcessor extends WorkerHost {
  constructor(
    private readonly storage: SupabaseStorageService,
    private readonly parser: PdfParserService,
  ) {
    super();
  }

  async process(job: Job<PdfProcessingJobData>): Promise<PdfProcessingResult> {
    try {
      await this.setProgress(job, { status: 'scanning', progress: 5, message: 'Loading PDF from storage.' });
      const pdf = await this.storage.download(job.data.pdfStoragePath);

      await this.setProgress(job, { status: 'extracting', progress: 20, message: 'Extracting text and tables.' });
      const markdown = await this.parser.extractToMarkdown(pdf);
      const markdownStoragePath = `${job.data.requestId}/intermediate/grant-agreement.md`;
      await this.storage.upload(markdownStoragePath, Buffer.from(markdown, 'utf8'), 'text/markdown; charset=utf-8');

      const result: PdfProcessingResult = {
        markdownStoragePath,
        pageCount: (markdown.match(/^## Page\b/gm) ?? []).length,
        tableCount: (markdown.match(/^### Table\b/gm) ?? []).length,
        characterCount: markdown.length,
      };
      await this.setProgress(job, {
        status: 'done',
        progress: 100,
        message: 'PDF extraction completed.',
        markdownStoragePath,
      });
      return result;
    } catch (error) {
      await this.setProgress(job, { status: 'error', progress: 100, message: 'PDF processing failed.' });
      throw error;
    }
  }

  private async setProgress(job: Job, progress: ProcessingProgress): Promise<void> {
    await job.updateProgress(progress);
  }
}
