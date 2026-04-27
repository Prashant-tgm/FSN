import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { Blog, BlogSchema } from '../../database/mongoose/blog.schema';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { QueueName } from '../../common/enums';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    BullModule.registerQueue({ name: QueueName.SEARCH }),
  ],
  providers: [BlogService],
  controllers: [BlogController],
  exports: [BlogService],
})
export class BlogModule {}