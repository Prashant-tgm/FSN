import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { QueueName } from '../common/enums';

// Reputation point deltas per event
const REPUTATION_EVENTS: Record<string, number> = {
  problem_posted:         5,
  solution_submitted:     10,
  solution_accepted:      25,
  solution_under_trial:   15,
  solution_implemented:   50,
  solution_rejected:      -5,
  feedback_given:         8,
  upvote_received:        2,
  wof_bronze:             30,
  wof_silver:             60,
  wof_gold:               100,
};

@Processor(QueueName.REPUTATION)
export class ReputationProcessor {
  private readonly logger = new Logger(ReputationProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('updateScore')
  async handleUpdateScore(job: Job<{ userId: string; event: string }>) {
    const { userId, event } = job.data;
    const delta = REPUTATION_EVENTS[event];

    if (delta === undefined) {
      this.logger.warn(`Unknown reputation event: ${event}`);
      return;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { reputationScore: { increment: delta } },
      select: { id: true, reputationScore: true },
    });

    this.logger.debug(
      `Reputation updated: user=${userId} event=${event} delta=${delta > 0 ? '+' : ''}${delta} → ${updated.reputationScore}`,
    );

    // Award badges at milestone thresholds
    await this.evaluateBadges(userId, updated.reputationScore);
    return updated;
  }

  private async evaluateBadges(userId: string, score: number) {
    const milestones = [
      { threshold: 50,   badge: 'rising_star' },
      { threshold: 200,  badge: 'impact_maker' },
      { threshold: 500,  badge: 'community_champion' },
      { threshold: 1000, badge: 'fsn_legend' },
    ];

    for (const { threshold, badge } of milestones) {
      if (score >= threshold) {
        await this.prisma.userBadge.upsert({
          where: { userId_badgeType: { userId, badgeType: badge } },
          create: { userId, badgeType: badge },
          update: {},
        });
      }
    }
  }
}
