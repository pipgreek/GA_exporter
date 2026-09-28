import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import archiver = require('archiver');
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { GA_EXPORT_QUEUE } from '../infrastructure/queue/queue.constants';
import { SupabaseStorageService } from '../infrastructure/storage/storage.service';
import { PreviewResponse } from '../document-generation/preview.types';
import { DownloadFileType, OUTPUT_FILES, isDownloadFileType, outputStoragePath, previewStoragePath } from './output-files';
import { PROCESSING_STATUSES, PdfProcessingJobData, ProcessingStatus } from './processing.types';

@Injectable()
export class ProcessingService {
  constructor(
    @InjectQueue(GA_EXPORT_QUEUE) private readonly queue: Queue<PdfProcessingJobData>,
    private readonly config: ConfigService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async submitPdf(pdf: Buffer): Promise<{ requestId: string }> {
    if (pdf.length < 5 || pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new BadRequestException('The uploaded file is not a valid PDF.');
    }
    const requestId = randomUUID();
    const pdfStoragePath = await this.storageUpload(requestId, pdf);
    await this.enqueuePdf(pdfStoragePath, requestId);
    return { requestId };
  }

  async enqueuePdf(pdfStoragePath: string, requestId = randomUUID()): Promise<{ requestId: string }> {
    const retentionSeconds = this.config.getOrThrow<number>('JOB_RETENTION_SECONDS');
    await this.queue.add('extract-pdf', { requestId, pdfStoragePath }, {
      jobId: requestId,
      removeOnComplete: { age: retentionSeconds, count: 1000 },
      removeOnFail: { age: retentionSeconds, count: 1000 },
    });
    return { requestId };
  }

  async getStatus(requestId: string): Promise<{ status: ProcessingStatus; progress: number; message: string }> {
    const job = await this.queue.getJob(requestId);
    if (!job) throw new NotFoundException('Processing request was not found or has expired.');

    const state = await job.getState();
    const progress = job.progress;
    if (state === 'completed') {
      const completed = typeof progress === 'object' && progress !== null ? progress as Record<string, unknown> : {};
      const completedStatus = this.isProcessingStatus(completed.status) ? completed.status : 'done';
      return {
        status: completedStatus,
        progress: completedStatus === 'done' ? 100 : this.normalizeProgress(completed.progress),
        message: typeof completed.message === 'string' ? completed.message : 'Processing completed.',
      };
    }
    if (state === 'failed') {
      return { status: 'error', progress: 100, message: 'PDF processing failed.' };
    }
    if (typeof progress === 'object' && progress !== null) {
      const current = progress as Record<string, unknown>;
      return {
        status: this.isProcessingStatus(current.status) ? current.status : 'scanning',
        progress: this.normalizeProgress(current.progress),
        message: typeof current.message === 'string' ? current.message : 'Queued for processing.',
      };
    }
    return { status: 'scanning', progress: 0, message: 'Queued for processing.' };
  }

  private async storageUpload(requestId: string, pdf: Buffer): Promise<string> {
    return this.storage.upload(`${requestId}/input/original.pdf`, pdf, 'application/pdf');
  }

  /** GET /preview/{requestId} (docs/api-contract.md) — 200 only once status is `done`. */
  async getPreview(requestId: string): Promise<PreviewResponse> {
    await this.assertDone(requestId);
    const buffer = await this.storage.download(previewStoragePath(requestId));
    return JSON.parse(buffer.toString('utf8')) as PreviewResponse;
  }

  /** GET /download/{requestId}/{fileType} — 404 for an unsupported fileType, 409 if not ready yet. */
  async getDownloadFile(
    requestId: string,
    fileType: string,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    if (!isDownloadFileType(fileType)) {
      throw new NotFoundException('Unsupported file type.');
    }
    await this.assertDone(requestId);
    const buffer = await this.storage.download(outputStoragePath(requestId, fileType));
    return { buffer, filename: OUTPUT_FILES[fileType].storageFilename, contentType: OUTPUT_FILES[fileType].contentType };
  }

  /** GET /download-all/{requestId} — zips the same three files download/{type} would each serve. */
  async getDownloadAllZip(requestId: string): Promise<Buffer> {
    await this.assertDone(requestId);
    const fileTypes: DownloadFileType[] = ['info', 'gantt', 'kpi'];
    const buffers = await Promise.all(
      fileTypes.map((type) => this.storage.download(outputStoragePath(requestId, type))),
    );
    return this.zipFiles(fileTypes.map((type, i) => ({ name: OUTPUT_FILES[type].storageFilename, buffer: buffers[i] })));
  }

  private async assertDone(requestId: string): Promise<void> {
    const status = await this.getStatus(requestId); // throws NotFoundException if the job is unknown/expired
    if (status.status !== 'done') {
      throw new ConflictException('Processing is not done yet.');
    }
  }

  private zipFiles(files: { name: string; buffer: Buffer }[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];
      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('warning', (warning) => {
        if (warning.code !== 'ENOENT') reject(warning);
      });
      archive.on('error', reject);
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      for (const file of files) archive.append(file.buffer, { name: file.name });
      void archive.finalize();
    });
  }

  private isProcessingStatus(value: unknown): value is ProcessingStatus {
    return typeof value === 'string' && PROCESSING_STATUSES.includes(value as ProcessingStatus);
  }

  private normalizeProgress(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.min(100, Math.round(value)))
      : 0;
  }
}
