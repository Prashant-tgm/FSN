import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { BullModule } from '@nestjs/bull';
import { QueueName } from '../../common/enums';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('database.elasticsearchApiKey');
        return {
          node: config.get<string>('database.elasticsearchUrl', 'http://localhost:9200'),
          ...(apiKey ? { auth: { apiKey } } : {}),
        };
      },
    }),
    BullModule.registerQueue({ name: QueueName.SEARCH }),
  ],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService, ElasticsearchModule],
})
export class SearchModule {}