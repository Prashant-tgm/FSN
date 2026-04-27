import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { ImpactScoreEngine } from '../impact/impact-score.engine';
import { QueueName } from '../common/enums';

// ── Impact Score Processor ────────────────────────────────────────────────────

@Processor(QueueName.IMPACT)
export class ImpactProcessor {
  private readonly logger = new Logger(ImpactProcessor.name);

  constructor(
    private prisma: PrismaService,
    private engine: ImpactScoreEngine,
  ) {}

  @Process('computeScore')
  async handleComputeScore(job: Job<{ solutionId: string }>) {
    const { solutionId } = job.data;
    this.logger.debug(`Computing impact score for solution: ${solutionId}`);

    try {
      const components = await this.engine.compute(solutionId);
      this.logger.log(
        `Impact score updated: ${solutionId} → ${components.total}`,
      );
      return components;
    } catch (err) {
      this.logger.error(
        `Failed to compute impact score for ${solutionId}`,
        err,
      );
      throw err; // BullMQ will retry with exponential backoff
    }
  }
}

// ── Wall-of-Fame Tier Processor ───────────────────────────────────────────────

@Processor(QueueName.WOF)
export class WofProcessor {
  private readonly logger = new Logger(WofProcessor.name);

  constructor(
    private prisma: PrismaService,
    private engine: ImpactScoreEngine,
  ) {}

  @Process('evaluateTier')
  async handleEvaluateTier(job: Job<{ solutionId: string }>) {
    const { solutionId } = job.data;
    this.logger.debug(`Evaluating WoF tier for solution: ${solutionId}`);

    try {
      const tier = await this.engine.evaluateTier(solutionId);
      if (!tier) {
        this.logger.debug(`Solution ${solutionId} does not qualify for WoF yet`);
        return;
      }

      // Upsert WallOfFame entry
      const existing = await this.prisma.wallOfFame.findUnique({
        where: { solutionId },
      });

      const tierRank = { bronze: 1, silver: 2, gold: 3 };
      const shouldUpgrade =
        !existing || tierRank[tier] > tierRank[existing.tier];

      if (shouldUpgrade) {
        await this.prisma.wallOfFame.upsert({
          where: { solutionId },
          create: {
            solutionId,
            tier: tier as any,
            awardYear: new Date().getFullYear(),
          },
          update: { tier: tier as any },
        });

        // Notify the innovator of tier upgrade
        const solution = await this.prisma.solution.findUnique({
          where: { id: solutionId },
          select: { submittedBy: true, title: true },
        });

        if (solution) {
          await this.prisma.notification.create({
            data: {
              userId: solution.submittedBy,
              type: 'wof_tier_upgrade',
              title: `🏆 Wall of Fame — ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
              body: `Your solution "${solution.title}" has earned ${tier} recognition on the Wall of Fame.`,
              metadata: { solutionId, tier },
            },
          });
        }

        this.logger.log(`WoF tier set to ${tier} for solution ${solutionId}`);
      }
    } catch (err) {
      this.logger.error(`Failed to evaluate WoF tier for ${solutionId}`, err);
      throw err;
    }
  }
}
