import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { GA_EXPORT_QUEUE } from '../infrastructure/queue/queue.constants';
import { PdfProcessingJobData } from './processing.types';

export const ORPHANED_JOB_REASON =
  'The server restarted while this file was being processed (most likely it ran out of memory). Please upload it again.';

/**
 * A job still `active` when the process boots belongs to a previous process that
 * crashed or was killed (e.g. out of memory). BullMQ would hand it back to the worker,
 * which can crash the host again in a loop. Fail it instead, so the user sees an error.
 */
@Injectable()
export class OrphanedJobsRecovery implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrphanedJobsRecovery.name);
  private readonly bootedAt = Date.now();

  constructor(@InjectQueue(GA_EXPORT_QUEUE) private readonly queue: Queue<PdfProcessingJobData>) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const active = await this.queue.getJobs(['active']);
      for (const job of active) {
        // Skip anything this process started itself.
        if ((job.processedOn ?? 0) >= this.bootedAt) continue;
        // Token "0" bypasses the lock check; the old process's lock is gone or about to expire.
        await job.moveToFailed(new Error(ORPHANED_JOB_REASON), '0', false);
        this.logger.warn(`Marked orphaned job ${job.id} as failed after a restart.`);
      }
    } catch (error) {
      this.logger.error(`Orphaned-job recovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
