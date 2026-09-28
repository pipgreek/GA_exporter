import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GA_EXPORT_QUEUE } from '../infrastructure/queue/queue.constants';
import { SupabaseStorageService } from '../infrastructure/storage/storage.service';
import { PdfParserService } from '../pdf-parsing/pdf-parser.service';
import { LlmService } from '../llm/llm.service';
import { DocumentGenerationService } from '../document-generation/document-generation.service';
import { OUTPUT_FILES, outputStoragePath, previewStoragePath as previewPath } from './output-files';
import { PdfProcessingJobData, PdfProcessingResult, ProcessingProgress } from './processing.types';

@Processor(GA_EXPORT_QUEUE, { concurrency: 1 })
export class PdfProcessingProcessor extends WorkerHost {
  constructor(
    private readonly storage: SupabaseStorageService,
    private readonly parser: PdfParserService,
    private readonly llm: LlmService,
    private readonly documentGeneration: DocumentGenerationService,
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

      await this.setProgress(job, {
        status: 'analyzing',
        progress: 40,
        message: 'Extracting structured data with the LLM.',
        markdownStoragePath,
      });
      const extraction = await this.llm.generateAll(markdown);

      await this.setProgress(job, {
        status: 'generating',
        progress: 75,
        message: 'Generating Word and Excel files.',
        markdownStoragePath,
      });
      const generated = await this.documentGeneration.generateAll(extraction);

      const [infoStoragePath, ganttStoragePath, kpiStoragePath, previewStoragePath] = await Promise.all([
        this.storage.upload(
          outputStoragePath(job.data.requestId, 'info'),
          generated.infoDocx,
          OUTPUT_FILES.info.contentType,
        ),
        this.storage.upload(
          outputStoragePath(job.data.requestId, 'gantt'),
          generated.ganttXlsx,
          OUTPUT_FILES.gantt.contentType,
        ),
        this.storage.upload(
          outputStoragePath(job.data.requestId, 'kpi'),
          generated.kpiXlsx,
          OUTPUT_FILES.kpi.contentType,
        ),
        this.storage.upload(
          previewPath(job.data.requestId),
          Buffer.from(JSON.stringify(generated.preview), 'utf8'),
          'application/json',
        ),
      ]);

      const result: PdfProcessingResult = {
        markdownStoragePath,
        pageCount: (markdown.match(/^## Page\b/gm) ?? []).length,
        tableCount: (markdown.match(/^### Table\b/gm) ?? []).length,
        characterCount: markdown.length,
        infoStoragePath,
        ganttStoragePath,
        kpiStoragePath,
        previewStoragePath,
      };
      // Terminal progress write before returning: getStatus() reads the last
      // job.progress payload for a completed job (processing.service.ts), so
      // this is what makes `done` mean "all three files + preview are ready"
      // (docs/api-contract.md), not just "the worker function returned".
      await this.setProgress(job, {
        status: 'done',
        progress: 100,
        message: 'All files are ready.',
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
