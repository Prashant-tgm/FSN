import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSolutionDto,
  UpdateSolutionDto,
  UpdateSolutionStatusDto,
} from './dto/create-solution.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import {
  QueueName, SearchJobName, UserRole,
  SolutionStatus, NotificationType,
} from '../../common/enums';

@Injectable()
export class SolutionsService {
  private readonly logger = new Logger(SolutionsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QueueName.SEARCH)    private searchQueue: Queue,
    @InjectQueue(QueueName.REPUTATION) private reputationQueue: Queue,
  ) {}

  // ── Create ───────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateSolutionDto) {
    // Validate problem exists and is open
    const problem = await this.prisma.problem.findFirst({
      where: { id: dto.problemId, isDeleted: false },
      select: { id: true, status: true, postedBy: true, title: true },
    });

    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.status === 'closed' || problem.status === 'solved') {
      throw new BadRequestException('This problem is no longer accepting solutions');
    }

    const solution = await this.prisma.$transaction(async (tx) => {
      const sol = await tx.solution.create({
        data: {
          problemId: dto.problemId,
          submittedBy: userId,
          title: dto.title,
          description: dto.description,
          techTags: dto.techTags ?? [],
          costEstimate: dto.costEstimate as any,
          timeline: dto.timeline as any,
          coCreationOpen: dto.coCreationOpen ?? false,
          media: dto.media as any,
        },
        include: {
          innovator: {
            select: { id: true, fullName: true, role: true, avatarUrl: true },
          },
          problem: { select: { id: true, title: true } },
        },
      });

      // Increment cached solution count on problem
      await tx.problem.update({
        where: { id: dto.problemId },
        data: { solutionCount: { increment: 1 } },
      });

      return sol;
    });

    // Queue search indexing and notify problem poster
    await Promise.all([
      this.searchQueue.add(SearchJobName.INDEX_SOLUTION, { solutionId: solution.id }),
      this.notifyProblemPoster(problem.postedBy, solution.id, problem.title, userId),
    ]);

    this.logger.log(`Solution ${solution.id} created for problem ${dto.problemId}`);
    return solution;
  }

  // ── Find All for a Problem ───────────────────────────────────────────────────

  async findByProblem(problemId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.solution.findMany({
        where: { problemId, isDeleted: false },
        skip,
        take: limit,
        orderBy: [{ impactScore: 'desc' }, { upvoteCount: 'desc' }],
        include: {
          innovator: {
            select: { id: true, fullName: true, role: true, avatarUrl: true, isVerified: true },
          },
          _count: { select: { feedbacks: true } },
        },
      }),
      this.prisma.solution.count({ where: { problemId, isDeleted: false } }),
    ]);

    return paginate(data, total, page, limit);
  }

  // ── Find One ─────────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const solution = await this.prisma.solution.findFirst({
      where: { id, isDeleted: false },
      include: {
        innovator: {
          select: {
            id: true, fullName: true, role: true,
            avatarUrl: true, isVerified: true, reputationScore: true,
          },
        },
        problem: {
          select: { id: true, title: true, category: true, status: true },
        },
        feedbacks: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true, rating: true, whatWorked: true,
            checkpoint: true, createdAt: true,
          },
        },
        wallOfFame: { select: { tier: true, awardYear: true } },
        _count: { select: { feedbacks: true, votes: true } },
      },
    });

    if (!solution) throw new NotFoundException('Solution not found');
    return solution;
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, requesterId: string, dto: UpdateSolutionDto) {
    const solution = await this.prisma.solution.findUnique({ where: { id } });
    if (!solution || solution.isDeleted) throw new NotFoundException('Solution not found');
    if (solution.submittedBy !== requesterId) {
      throw new ForbiddenException('Only the solution author can update this');
    }

    const updated = await this.prisma.solution.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.techTags && { techTags: dto.techTags }),
        ...(dto.coCreationOpen !== undefined && { coCreationOpen: dto.coCreationOpen }),
        ...(dto.media && { media: dto.media as any }),
        version: { increment: 1 },
      },
    });

    await this.searchQueue.add(SearchJobName.INDEX_SOLUTION, { solutionId: id });
    return updated;
  }

  // ── Update Status (problem owner only) ───────────────────────────────────────

  async updateStatus(
    solutionId: string,
    requesterId: string,
    dto: UpdateSolutionStatusDto,
  ) {
    const solution = await this.prisma.solution.findUnique({
      where: { id: solutionId },
      include: { problem: { select: { postedBy: true } } },
    });

    if (!solution || solution.isDeleted) throw new NotFoundException('Solution not found');
    if (solution.problem.postedBy !== requesterId) {
      throw new ForbiddenException('Only the problem owner can change solution status');
    }

    const updated = await this.prisma.solution.update({
      where: { id: solutionId },
      data: { status: dto.status as any },
    });

    // If marking as accepted, update problem status to in_progress
    if (dto.status === SolutionStatus.ACCEPTED) {
      await this.prisma.problem.update({
        where: { id: solution.problemId },
        data: { status: 'in_progress' },
      });
    }

    // Requeue reputation update for the innovator
    await this.reputationQueue.add('updateScore', {
      userId: solution.submittedBy,
      event: `solution_${dto.status}`,
    });

    return updated;
  }

  // ── Toggle Upvote ─────────────────────────────────────────────────────────────

  async toggleUpvote(solutionId: string, userId: string) {
    const existing = await this.prisma.vote.findUnique({
      where: {
        userId_entityType_entityId: {
          userId, entityType: 'solution', entityId: solutionId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.vote.delete({ where: { id: existing.id } }),
        this.prisma.solution.update({
          where: { id: solutionId },
          data: { upvoteCount: { decrement: 1 } },
        }),
      ]);
      return { upvoted: false };
    }

    await this.prisma.$transaction([
      this.prisma.vote.create({
        data: { userId, entityType: 'solution', entityId: solutionId, value: 1 },
      }),
      this.prisma.solution.update({
        where: { id: solutionId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ]);

    return { upvoted: true };
  }

  // ── Private: notify problem poster ───────────────────────────────────────────

  private async notifyProblemPoster(
    posterId: string, solutionId: string,
    problemTitle: string, innovatorId: string,
  ) {
    if (posterId === innovatorId) return; // Don't self-notify
    await this.prisma.notification.create({
      data: {
        userId: posterId,
        type: NotificationType.SOLUTION_SUBMITTED,
        title: 'New solution submitted',
        body: `A solution was submitted for your problem: "${problemTitle}"`,
        metadata: { solutionId },
      },
    });
  }
}
