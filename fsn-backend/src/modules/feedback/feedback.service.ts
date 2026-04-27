import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/create-feedback.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { QueueName } from '../../common/enums';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QueueName.IMPACT)     private impactQueue: Queue,
    @InjectQueue(QueueName.WOF)        private wofQueue: Queue,
    @InjectQueue(QueueName.REPUTATION) private reputationQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    // Verify the solution exists and is in a state that accepts feedback
    const solution = await this.prisma.solution.findFirst({
      where: {
        id: dto.solutionId,
        isDeleted: false,
        status: { in: ['accepted', 'under_trial', 'implemented'] },
      },
      include: { problem: { select: { postedBy: true } } },
    });

    if (!solution) {
      throw new NotFoundException(
        'Solution not found or not yet in a state that accepts feedback',
      );
    }

    // Only the problem poster (or NGO facilitator) can submit feedback
    if (solution.problem.postedBy !== userId) {
      throw new ForbiddenException(
        'Only the problem poster can submit feedback on a solution',
      );
    }

    // Enforce one feedback per checkpoint per solution
    const existing = await this.prisma.feedback.findUnique({
      where: {
        solutionId_submittedBy_checkpoint: {
          solutionId: dto.solutionId,
          submittedBy: userId,
          checkpoint: dto.checkpoint as any,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Feedback for checkpoint "${dto.checkpoint}" has already been submitted`,
      );
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        solutionId: dto.solutionId,
        submittedBy: userId,
        rating: dto.rating,
        whatWorked: dto.whatWorked,
        whatFailed: dto.whatFailed,
        suggestions: dto.suggestions,
        checkpoint: dto.checkpoint as any,
        isPublic: dto.isPublic ?? true,
        media: dto.mediaUrls ? dto.mediaUrls.map((url) => ({ url })) : undefined,
      },
    });

    // Trigger async impact score re-computation and WoF tier evaluation
    await Promise.all([
      this.impactQueue.add('computeScore', { solutionId: dto.solutionId }),
      this.wofQueue.add('evaluateTier', { solutionId: dto.solutionId }),
      this.reputationQueue.add('updateScore', {
        userId,
        event: 'feedback_given',
      }),
    ]);

    // Notify the innovator
    await this.prisma.notification.create({
      data: {
        userId: solution.submittedBy,
        type: 'feedback_received',
        title: 'New feedback on your solution',
        body: `A ${dto.checkpoint} feedback was submitted. Rating: ${dto.rating}/5`,
        metadata: { feedbackId: feedback.id, solutionId: dto.solutionId },
      },
    });

    this.logger.log(
      `Feedback submitted: solution=${dto.solutionId} checkpoint=${dto.checkpoint} rating=${dto.rating}`,
    );
    return feedback;
  }

  async findBySolution(solutionId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where: { solutionId, isPublic: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: {
            select: { id: true, fullName: true, avatarUrl: true, role: true },
          },
        },
      }),
      this.prisma.feedback.count({ where: { solutionId, isPublic: true } }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const fb = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        submitter: { select: { id: true, fullName: true, role: true } },
        solution: { select: { id: true, title: true } },
      },
    });
    if (!fb) throw new NotFoundException('Feedback not found');
    return fb;
  }

  async update(id: string, requesterId: string, dto: UpdateFeedbackDto) {
    const fb = await this.prisma.feedback.findUnique({ where: { id } });
    if (!fb) throw new NotFoundException('Feedback not found');
    if (fb.submittedBy !== requesterId) {
      throw new ForbiddenException('You can only edit your own feedback');
    }

    const updated = await this.prisma.feedback.update({
      where: { id },
      data: {
        ...(dto.rating    !== undefined && { rating: dto.rating }),
        ...(dto.whatWorked  !== undefined && { whatWorked: dto.whatWorked }),
        ...(dto.whatFailed  !== undefined && { whatFailed: dto.whatFailed }),
        ...(dto.suggestions !== undefined && { suggestions: dto.suggestions }),
      },
    });

    // Re-compute score after edit
    await this.impactQueue.add('computeScore', { solutionId: fb.solutionId });
    return updated;
  }
}
