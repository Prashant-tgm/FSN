import { Global, Module } from '@nestjs/common';
import { ImpactScoreEngine } from './impact-score.engine';

@Global()
@Module({
  providers: [ImpactScoreEngine],
  exports: [ImpactScoreEngine],
})
export class ImpactModule {}
