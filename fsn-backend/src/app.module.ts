import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '@nestjs-modules/ioredis';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import awsConfig from './config/aws.config';

import { PrismaModule } from './database/prisma.module';
import { ImpactModule } from './impact/impact.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { SolutionsModule } from './modules/solutions/solutions.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { CoCreationModule } from './modules/cocreation/cocreation.module';
import { BlogModule } from './modules/blog/blog.module';
import { CommentsModule } from './modules/comments/comments.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { MediaModule } from './modules/media/media.module';
import { WallOfFameModule } from './modules/wall-of-fame/wall-of-fame.module';
import { AdminModule } from './modules/admin/admin.module';
import { StatsModule } from './modules/stats/stats.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, databaseConfig, jwtConfig, awsConfig],
      cache: true,
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single' as const,
        url: config.get<string>('database.redisUrl', 'redis://localhost:6379'),
        options: {
          password: config.get<string>('database.redisPassword') || undefined,
        },
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.mongoUri'),
        dbName: 'fsn_blog',
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('database.redisHost', 'localhost'),
          port: config.get<number>('database.redisPort', 6379),
          password: config.get<string>('database.redisPassword', '') || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 500,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl:   config.get<number>('app.throttleTtl', 60),
          limit: config.get<number>('app.throttleLimit', 100),
        }],
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ImpactModule,
    AuthModule,
    UsersModule,
    ProblemsModule,
    SolutionsModule,
    FeedbackModule,
    CoCreationModule,
    BlogModule,
    CommentsModule,
    MessagingModule,
    NotificationsModule,
    SearchModule,
    MediaModule,
    WallOfFameModule,
    AdminModule,
    StatsModule,
    JobsModule,
  ],
})
export class AppModule {}
