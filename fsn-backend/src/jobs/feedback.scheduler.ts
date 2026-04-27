import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { QueueName, EmailJobName, FeedbackCheckpoint } from '../common/enums';

// Days after solution acceptance to send each feedback prompt
const CHECKPOINT_DAYS: Record<FeedbackCheckpoint, number> = {
  [FeedbackCheckpoint.WEEK1]:  7,
  [FeedbackCheckpoint.MONTH1]: 30,
  [FeedbackCheckpoint.MONTH3]: 90,
  [FeedbackCheckpoint.MONTH6]: 180,
};

@Injectable()
export class FeedbackScheduler {
  private readonly logger = new Logger(FeedbackScheduler.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QueueName.EMAIL) private emailQueue: Queue,
  ) {}

  // Run every day at 08:00 UTC — check which solutions need feedback prompts
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendScheduledFeedbackPrompts() {
    this.logger.log('Running daily feedback prompt check...');

    const trialsAndImplemented = await this.prisma.solution.findMany({
      where: {
        status: { in: ['under_trial', 'implemented'] },
        isDeleted: false,
      },
      include: {
        problem: {
          include: {
            poster: { select: { id: true, email: true, fullName: true } },
          },
        },
        feedbacks: { select: { checkpoint: true } },
      },
    });

    let queued = 0;

    for (const solution of trialsAndImplemented) {
      const poster = solution.problem.poster;
      if (!poster.email) continue;

      const completedCheckpoints = new Set(solution.feedbacks.map((f) => f.checkpoint));
      const daysSinceAccepted = this.daysDiff(new Date(), solution.updatedAt);

      for (const [checkpoint, days] of Object.entries(CHECKPOINT_DAYS)) {
        // Due: within ±1 day of target, and not yet submitted
        if (
          Math.abs(daysSinceAccepted - days) <= 1 &&
          !completedCheckpoints.has(checkpoint as FeedbackCheckpoint)
        ) {
          await this.emailQueue.add(EmailJobName.SEND_FEEDBACK_PROMPT, {
            to:            poster.email,
            fullName:      poster.fullName,
            solutionTitle: solution.title,
            solutionId:    solution.id,
            checkpoint,
            feedbackUrl:   `https://fsnplatform.org/solutions/${solution.id}/feedback?checkpoint=${checkpoint}`,
          });
          queued++;
        }
      }
    }

    this.logger.log(`Feedback prompt check complete — ${queued} emails queued`);
  }

  private daysDiff(a: Date, b: Date): number {
    return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
  }
}
