import { Module } from '@nestjs/common';
import { WallOfFameService } from './wall-of-fame.service';
import { WallOfFameController } from './wall-of-fame.controller';

@Module({
  providers: [WallOfFameService],
  controllers: [WallOfFameController],
  exports: [WallOfFameService],
})
export class WallOfFameModule {}