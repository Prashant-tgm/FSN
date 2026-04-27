import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { QueueName } from '../../common/enums';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueName.IMPACT },
      { name: QueueName.WOF },
      { name: QueueName.REPUTATION },
    ),
  ],
  providers: [FeedbackService],
  controllers: [FeedbackController],
  exports: [FeedbackService],
})
export class FeedbackModule {}
