import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { GA_EXPORT_QUEUE } from './queue.constants';

@Module({
  imports: [BullModule.registerQueue({ name: GA_EXPORT_QUEUE })],
  exports: [BullModule],
})
export class QueueModule {}
