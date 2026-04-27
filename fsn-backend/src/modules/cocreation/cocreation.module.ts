import { Module } from '@nestjs/common';
import { CoCreationService } from './cocreation.service';
import { CoCreationController } from './cocreation.controller';

@Module({
  providers: [CoCreationService],
  controllers: [CoCreationController],
  exports: [CoCreationService],
})
export class CoCreationModule {}