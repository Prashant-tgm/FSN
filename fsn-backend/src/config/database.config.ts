import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  postgresUrl: process.env.DATABASE_URL,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fsn_blog',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD || '',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  elasticsearchApiKey: process.env.ELASTICSEARCH_API_KEY || '',
}));
