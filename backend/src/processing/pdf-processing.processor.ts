import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GA_EXPORT_QUEUE } from '../infrastructure/queue/queue.constants';
import { SupabaseStorageService } from '../infrastructure/storage/storage.service';
import { PdfParserService } from '../pdf-parsing/pdf-parser.service';
import { LlmService } from '../llm/llm.service';
import { PdfProcessingJobData, PdfProcessingResult, ProcessingProgress } from './processing.types';

@Processor(GA_EXPORT_QUEUE, { concurrency: 1 })
export class PdfProcessingProcessor extends WorkerHost {
  constructor(
    private readonly storage: SupabaseStorageService,
    private readonly parser: PdfParserService,
    private readonly llm: LlmService,
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
        progress: 45,
        message: 'Extracting structured data with the LLM.',
        markdownStoragePath,
      });
      const extraction = await this.llm.generateAll(markdown);

      const [infoStoragePath, ganttStoragePath, kpiStoragePath] = await Promise.all([
        this.storeJson(job.data.requestId, 'info', extraction.info),
        this.storeJson(job.data.requestId, 'gantt', extraction.gantt),
        this.storeJson(job.data.requestId, 'kpi', extraction.kpi),
      ]);

      const result: PdfProcessingResult = {
        markdownStoragePath,
        pageCount: (markdown.match(/^## Page\b/gm) ?? []).length,
        tableCount: (markdown.match(/^### Table\b/gm) ?? []).length,
        characterCount: markdown.length,
        infoStoragePath,
        ganttStoragePath,
        kpiStoragePath,
      };
      await this.setProgress(job, {
        status: 'generating',
        progress: 70,
        message: 'LLM extraction is complete; document generation is pending.',
        markdownStoragePath,
      });
      return result;
    } catch (error) {
      await this.setProgress(job, { status: 'error', progress: 100, message: 'PDF processing failed.' });
      throw error;
    }
  }

  private async storeJson(requestId: string, name: 'info' | 'gantt' | 'kpi', data: unknown): Promise<string> {
    const path = `${requestId}/intermediate/${name}.json`;
    await this.storage.upload(path, Buffer.from(JSON.stringify(data), 'utf8'), 'application/json');
    return path;
  }

  private async setProgress(job: Job, progress: ProcessingProgress): Promise<void> {
    await job.updateProgress(progress);
  }
}
