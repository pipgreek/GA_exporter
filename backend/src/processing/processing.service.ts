import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { GA_EXPORT_QUEUE } from '../infrastructure/queue/queue.constants';
import { SupabaseStorageService } from '../infrastructure/storage/storage.service';
import { PdfProcessingJobData } from './processing.types';

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

  async getStatus(requestId: string): Promise<{ status: string; progress: number; message: string }> {
    const job = await this.queue.getJob(requestId);
    if (!job) throw new NotFoundException('Processing request was not found or has expired.');

    const state = await job.getState();
    const progress = job.progress;
    if (state === 'completed') {
      const completed = typeof progress === 'object' && progress !== null ? progress as Record<string, unknown> : {};
      return {
        status: 'done',
        progress: typeof completed.progress === 'number' ? completed.progress : 100,
        message: typeof completed.message === 'string' ? completed.message : 'PDF extraction completed.',
      };
    }
    if (state === 'failed') {
      return { status: 'error', progress: 100, message: 'PDF processing failed.' };
    }
    if (typeof progress === 'object' && progress !== null) {
      const current = progress as Record<string, unknown>;
      return {
        status: typeof current.status === 'string' ? current.status : 'scanning',
        progress: typeof current.progress === 'number' ? current.progress : 0,
        message: typeof current.message === 'string' ? current.message : 'Queued for processing.',
      };
    }
    return { status: 'scanning', progress: 0, message: 'Queued for processing.' };
  }

  private async storageUpload(requestId: string, pdf: Buffer): Promise<string> {
    return this.storage.upload(`${requestId}/input/original.pdf`, pdf, 'application/pdf');
  }
}
