import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import {
  UpdateProblemDto,
  QueryProblemsDto,
  ProblemSortBy,
} from './dto/query-problem.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { QueueName, SearchJobName, UserRole } from '../../common/enums';

@Injectable()
export class ProblemsService {
  private readonly logger = new Logger(ProblemsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QueueName.SEARCH) private searchQueue: Queue,
  ) {}

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateProblemDto) {
    const problem = await this.prisma.problem.create({
      data: {
        postedBy: userId,
        title: dto.title,
        description: dto.description,
        category: dto.category as any,
        location: dto.location as any,
        urgency: (dto.urgency ?? 'medium') as any,
        peopleAffected: dto.peopleAffected,
        visibility: (dto.visibility ?? 'public') as any,
        tags: dto.tags ?? [],
      },
      include: {
        poster: {
          select: { id: true, fullName: true, role: true, avatarUrl: true, isVerified: true },
        },
      },
    });

    // Queue Elasticsearch indexing
    await this.searchQueue.add(SearchJobName.INDEX_PROBLEM, { problemId: problem.id });

    this.logger.log(`Problem created: ${problem.id} by user ${userId}`);
    return problem;
  }

  // ── Find Many (feed) ─────────────────────────────────────────────────────────

  async findAll(query: QueryProblemsDto) {
    const { page = 1, limit = 20, search, category, urgency, status, state } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      visibility: 'public',
      ...(category && { category }),
      ...(urgency && { urgency }),
      ...(status && { status }),
      ...(state && {
        location: { path: ['state'], string_contains: state },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search.toLowerCase() } },
        ],
      }),
    };

    const sortField = query.sort || query.sortBy || 'createdAt';
    const sortOrder = (query.order || 'desc').toLowerCase() as 'asc' | 'desc';
    const orderBy = this.buildOrderBy(sortField as any, sortOrder);

    const [data, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          poster: {
            select: { id: true, fullName: true, role: true, avatarUrl: true, isVerified: true },
          },
          _count: { select: { solutions: true } },
        },
      }),
      this.prisma.problem.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  // ── Find One ─────────────────────────────────────────────────────────────────

  async findOne(id: string, requesterId?: string) {
    const problem = await this.prisma.problem.findFirst({
      where: {
        id,
        isDeleted: false,
        OR: [
          { visibility: 'public' },
          ...(requesterId ? [{ postedBy: requesterId }] : []),
        ],
      },
      include: {
        poster: {
          select: {
            id: true, fullName: true, role: true,
            avatarUrl: true, isVerified: true, bio: true,
          },
        },
        _count: { select: { solutions: true, votes: true } },
      },
    });

    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, requesterId: string, requesterRole: string, dto: UpdateProblemDto) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.isDeleted) throw new NotFoundException('Problem not found');

    if (problem.postedBy !== requesterId && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the problem owner or an admin can update this problem');
    }

    const updated = await this.prisma.problem.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.urgency && { urgency: dto.urgency as any }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.visibility && { visibility: dto.visibility as any }),
        ...(dto.peopleAffected !== undefined && { peopleAffected: dto.peopleAffected }),
      },
    });

    await this.searchQueue.add(SearchJobName.INDEX_PROBLEM, { problemId: id });
    return updated;
  }

  // ── Soft Delete ──────────────────────────────────────────────────────────────

  async remove(id: string, requesterId: string, requesterRole: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem || problem.isDeleted) throw new NotFoundException('Problem not found');

    if (problem.postedBy !== requesterId && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the problem owner or an admin can delete this problem');
    }

    await this.prisma.problem.update({
      where: { id },
      data: { isDeleted: true },
    });

    await this.searchQueue.add(SearchJobName.DELETE_PROBLEM, { problemId: id });
    return { message: 'Problem deleted successfully' };
  }

  // ── Upvote / Toggle ──────────────────────────────────────────────────────────

  async toggleUpvote(problemId: string, userId: string) {
    const existing = await this.prisma.vote.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType: 'problem',
          entityId: problemId,
        },
      },
    });

    if (existing) {
      // Remove upvote
      await this.prisma.vote.delete({ where: { id: existing.id } });
      await this.prisma.problem.update({
        where: { id: problemId },
        data: { upvoteCount: { decrement: 1 } },
      });
      return { upvoted: false };
    }

    // Add upvote
    await this.prisma.$transaction([
      this.prisma.vote.create({
        data: { userId, entityType: 'problem', entityId: problemId, value: 1 },
      }),
      this.prisma.problem.update({
        where: { id: problemId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ]);

    return { upvoted: true };
  }

  // ── GeoJSON Map View ─────────────────────────────────────────────────────────

  async getMapGeoJson() {
    const problems = await this.prisma.problem.findMany({
      where: { isDeleted: false, visibility: 'public', status: { not: 'closed' } },
      select: {
        id: true, title: true, category: true,
        urgency: true, status: true, location: true,
        upvoteCount: true, solutionCount: true,
      },
    });

    const features = problems
      .map((p) => {
        const loc = p.location as any;
        if (!loc?.lat || !loc?.lng) return null;
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] },
          properties: {
            id: p.id,
            title: p.title,
            category: p.category,
            urgency: p.urgency,
            status: p.status,
            upvoteCount: p.upvoteCount,
            solutionCount: p.solutionCount,
            location: `${loc.village ?? ''} ${loc.state ?? ''}`.trim(),
          },
        };
      })
      .filter(Boolean);

    return { type: 'FeatureCollection', features };
  }

  // ── Attach Media ──────────────────────────────────────────────────────────────

  async attachMedia(
    problemId: string,
    requesterId: string,
    mediaItems: { type: string; url: string; thumbnailUrl?: string }[],
  ) {
    const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.postedBy !== requesterId) throw new ForbiddenException('Not the problem owner');

    const existing = (problem.media as any[]) ?? [];
    return this.prisma.problem.update({
      where: { id: problemId },
      data: { media: [...existing, ...mediaItems] as any },
    });
  }

  // ── Private Helpers ───────────────────────────────────────────────────────────

  private buildOrderBy(sortBy: string, order: 'asc' | 'desc' = 'desc') {
    switch (sortBy) {
      case 'upvoteCount':
      case ProblemSortBy.MOST_UPVOTED:
        return { upvoteCount: order };
      case 'solutionCount':
      case ProblemSortBy.MOST_SOLUTIONS:
        return { solutionCount: order };
      case 'urgency':
      case ProblemSortBy.MOST_URGENT:
        return { createdAt: order }; // Fallback for urgency enum
      case 'createdAt':
      case ProblemSortBy.NEWEST:
        return { createdAt: order };
      default:
        // Safely check if the field exists on the model if needed, 
        // but for now allow direct field mapping if it matches DTO sort options
        return { [sortBy]: order };
    }
  }
}
