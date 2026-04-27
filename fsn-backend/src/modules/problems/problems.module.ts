import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { QueueName } from '../../common/enums';

@Module({
  imports: [
    BullModule.registerQueue({ name: QueueName.SEARCH }),
  ],
  providers: [ProblemsService],
  controllers: [ProblemsController],
  exports: [ProblemsService],
})
export class ProblemsModule {}
