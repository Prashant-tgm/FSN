import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { QueueName, EmailJobName, FeedbackCheckpoint } from '../common/enums';

/**
 * Runs nightly — finds solutions in under_trial / implemented state
 * and dispatches feedback-prompt emails at the correct checkpoints.
 */
@Injectable()
export class FeedbackSchedulerService {
  private readonly logger = new Logger(FeedbackSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QueueName.EMAIL) private emailQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleFeedbackPrompts() {
    this.logger.log('Running feedback prompt scheduler...');

    const checkpoints: Array<{ key: FeedbackCheckpoint; daysAfter: number }> = [
      { key: FeedbackCheckpoint.WEEK1,  daysAfter: 7   },
      { key: FeedbackCheckpoint.MONTH1, daysAfter: 30  },
      { key: FeedbackCheckpoint.MONTH3, daysAfter: 90  },
      { key: FeedbackCheckpoint.MONTH6, daysAfter: 180 },
    ];

    for (const { key, daysAfter } of checkpoints) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAfter);
      const windowStart = new Date(targetDate);
      windowStart.setHours(0, 0, 0, 0);
      const windowEnd = new Date(targetDate);
      windowEnd.setHours(23, 59, 59, 999);

      // Find solutions that transitioned to under_trial/implemented ~daysAfter ago
      const solutions = await this.prisma.solution.findMany({
        where: {
          status: { in: ['under_trial', 'implemented'] },
          updatedAt: { gte: windowStart, lte: windowEnd },
          isDeleted: false,
          feedbacks: { none: { checkpoint: key as any } },
        },
        include: {
          problem: {
            include: {
              poster: { select: { id: true, email: true, fullName: true } },
            },
          },
        },
      });

      this.logger.log(`Checkpoint ${key}: dispatching ${solutions.length} prompts`);

      for (const sol of solutions) {
        const poster = sol.problem.poster;
        if (!poster.email) continue;

        await this.emailQueue.add(EmailJobName.SEND_FEEDBACK_PROMPT, {
          to: poster.email,
          fullName: poster.fullName,
          solutionTitle: sol.title,
          solutionId: sol.id,
          checkpoint: key,
          feedbackUrl: `https://fsnplatform.org/feedback?solutionId=${sol.id}&checkpoint=${key}`,
        });
      }
    }

    this.logger.log('Feedback prompt scheduler complete');
  }
}