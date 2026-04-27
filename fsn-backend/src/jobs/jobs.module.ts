import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ImpactProcessor, WofProcessor } from './impact.processor';
import { SearchProcessor } from './search.processor';
import { EmailProcessor } from './email.processor';
import { ReputationProcessor } from './reputation.processor';
import { FeedbackSchedulerService } from './feedback-scheduler.service';
import { ImpactModule } from '../impact/impact.module';
import { SearchModule } from '../modules/search/search.module';
import {
  QueueName,
} from '../common/enums';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ImpactModule,
    SearchModule,
    BullModule.registerQueue(
      { name: QueueName.EMAIL },
      { name: QueueName.SMS },
      { name: QueueName.SEARCH },
      { name: QueueName.IMPACT },
      { name: QueueName.REPUTATION },
      { name: QueueName.WOF },
    ),
  ],
  providers: [
    ImpactProcessor,
    WofProcessor,
    SearchProcessor,
    EmailProcessor,
    ReputationProcessor,
    FeedbackSchedulerService,
  ],
  exports: [FeedbackSchedulerService],
})
export class JobsModule {}