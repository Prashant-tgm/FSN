import {
  Injectable, NotFoundException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import slugify from 'slugify';
import { Blog, BlogDocument } from '../../database/mongoose/blog.schema';
import { CreateBlogDto, UpdateBlogDto, QueryBlogsDto } from './dto/blog.dto';
import { PrismaService } from '../../database/prisma.service';
import { QueueName, SearchJobName, UserRole } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectQueue(QueueName.SEARCH) private searchQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async create(authorId: string, dto: CreateBlogDto) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { fullName: true, avatarUrl: true, role: true },
    });
    if (!author) throw new NotFoundException('Author not found');

    const baseSlug = slugify(dto.title, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    const blog = await this.blogModel.create({
      author_id: authorId,
      title: dto.title,
      slug,
      category: dto.category,
      content: dto.content ?? [],
      cover_image: dto.coverImage ?? '',
      tags: dto.tags ?? [],
      is_published: dto.isPublished ?? false,
      published_at: dto.isPublished ? new Date() : null,
      author_snapshot: {
        full_name: author.fullName,
        avatar_url: author.avatarUrl ?? '',
        role: author.role,
      },
    });

    if (blog.is_published) {
      await this.queueBlogIndex(blog);
    }

    return blog;
  }

  async findAll(query: QueryBlogsDto) {
    const { page = 1, limit = 20, search, category, authorId, sort, order } = query;
    const skip = (page - 1) * limit;

    const filter: any = { is_published: true };
    if (category) filter.category = category;
    if (authorId)  filter.author_id = authorId;
    if (search)    filter.$text = { $search: search };

    const sortField = sort || 'published_at';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-content')  // omit heavy content field from list view
        .lean(),
      this.blogModel.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  }

  async findBySlug(slug: string) {
    const blog = await this.blogModel.findOne({ slug, is_published: true });
    if (!blog) throw new NotFoundException('Blog post not found');

    // Increment view count
    await this.blogModel.updateOne({ _id: blog._id }, { $inc: { view_count: 1 } });
    return blog;
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid blog ID');
    const blog = await this.blogModel.findById(id);
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async update(id: string, requesterId: string, requesterRole: string, dto: UpdateBlogDto) {
    const blog = await this.findById(id);
    if (blog.author_id !== requesterId && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the author or admin can update this post');
    }

    const wasPublished = blog.is_published;

    Object.assign(blog, {
      ...(dto.title       && { title: dto.title }),
      ...(dto.category    && { category: dto.category }),
      ...(dto.coverImage  !== undefined && { cover_image: dto.coverImage }),
      ...(dto.content     && { content: dto.content }),
      ...(dto.tags        && { tags: dto.tags }),
      ...(dto.isPublished !== undefined && { is_published: dto.isPublished }),
    });

    if (dto.isPublished && !wasPublished) {
      blog.published_at = new Date();
    }

    await blog.save();

    if (blog.is_published) await this.queueBlogIndex(blog);
    return blog;
  }

  async clap(id: string) {
    const blog = await this.blogModel.findByIdAndUpdate(
      id,
      { $inc: { clap_count: 1 } },
      { new: true, select: 'clap_count' },
    );
    if (!blog) throw new NotFoundException('Blog post not found');
    return { clapCount: blog.clap_count };
  }

  async remove(id: string, requesterId: string, requesterRole: string) {
    const blog = await this.findById(id);
    if (blog.author_id !== requesterId && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the author or admin can delete this post');
    }
    await this.blogModel.findByIdAndDelete(id);
    return { message: 'Blog post deleted' };
  }

  private async queueBlogIndex(blog: BlogDocument) {
    const plainText = blog.content
      .filter((b: any) => b.type === 'paragraph' || b.type === 'heading')
      .map((b: any) => b.data?.text ?? '')
      .join(' ');

    await this.searchQueue.add(SearchJobName.INDEX_BLOG, {
      blogId: blog._id.toString(),
      title: blog.title,
      tags: blog.tags,
      authorName: blog.author_snapshot?.full_name ?? '',
      category: blog.category,
      plainText,
    });
  }
}