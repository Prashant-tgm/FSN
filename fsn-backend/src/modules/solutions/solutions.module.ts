import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SolutionsService } from './solutions.service';
import { SolutionsController } from './solutions.controller';
import { QueueName } from '../../common/enums';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueName.SEARCH },
      { name: QueueName.REPUTATION },
    ),
  ],
  providers: [SolutionsService],
  controllers: [SolutionsController],
  exports: [SolutionsService],
})
export class SolutionsModule {}
