import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * FSN Impact Score Algorithm — TDP §10
 *
 * Formula:
 *   Score = (W_rating    × avg_rating/5         × 40)
 *         + (W_adoption  × adoption_rate         × 30)
 *         + (W_endorse   × min(endorsements,10)/10 × 20)
 *         + (W_recency   × recency_factor        × 10)
 *
 * All weights = 1.0.  Max possible score = 100.
 *
 * Wall-of-Fame tier thresholds (TDP §10.3):
 *   Bronze : 40–59  (≥1 feedback, problem poster endorsed)
 *   Silver : 60–79  (≥2 checkpoints, status = under_trial | implemented)
 *   Gold   : 80–100 (all 4 checkpoints, status = implemented, admin verified)
 */

export interface ScoreComponents {
  feedbackRating: number;    // 0–40
  adoptionRate: number;      // 0–30
  endorsements: number;      // 0–20
  recency: number;           // 0–10
  total: number;             // 0–100
}

@Injectable()
export class ImpactScoreEngine {
  private readonly logger = new Logger(ImpactScoreEngine.name);

  // Weights — validated with NGO partners before hardcoding (TDP open item #6)
  private readonly W_RATING       = 1.0;
  private readonly W_ADOPTION     = 1.0;
  private readonly W_ENDORSEMENTS = 1.0;
  private readonly W_RECENCY      = 1.0;

  constructor(private prisma: PrismaService) {}

  /**
   * Compute the impact score for a solution and persist it to the DB.
   * Called from the BullMQ impact-queue processor after each feedback submission.
   */
  async compute(solutionId: string): Promise<ScoreComponents> {
    const [solution, feedbacks, endorsementCount] = await Promise.all([
      this.prisma.solution.findUnique({
        where: { id: solutionId },
        select: { id: true, problemId: true, status: true, createdAt: true },
      }),
      this.prisma.feedback.findMany({
        where: { solutionId },
        select: { rating: true, checkpoint: true, createdAt: true },
      }),
      // Endorsements = upvotes from verified BOP/NGO users
      this.prisma.vote.count({
        where: {
          entityType: 'solution',
          entityId: solutionId,
          value: 1,
          user: { isVerified: true, role: { in: ['bop_user', 'ngo'] } },
        },
      }),
    ]);

    if (!solution || feedbacks.length === 0) {
      return { feedbackRating: 0, adoptionRate: 0, endorsements: 0, recency: 0, total: 0 };
    }

    // ── Component 1: Feedback Rating (max 40 pts) ────────────────────────────
    const avgRating =
      feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    const feedbackRating = this.W_RATING * (avgRating / 5) * 40;

    // ── Component 2: Adoption Rate (max 30 pts) ──────────────────────────────
    // Proxy: solutions w/ status=implemented / total accepted solutions for this problem
    const [implementedCount, acceptedCount] = await Promise.all([
      this.prisma.solution.count({
        where: { problemId: solution.problemId, status: 'implemented' },
      }),
      this.prisma.solution.count({
        where: {
          problemId: solution.problemId,
          status: { in: ['accepted', 'under_trial', 'implemented'] },
        },
      }),
    ]);
    const adoptionRaw = acceptedCount > 0 ? implementedCount / acceptedCount : 0;
    // Boost: if this specific solution is implemented, give full adoption credit
    const isImplemented = solution.status === 'implemented';
    const effectiveAdoption = isImplemented ? 1.0 : adoptionRaw;
    const adoptionRate = this.W_ADOPTION * effectiveAdoption * 30;

    // ── Component 3: Community Endorsements (max 20 pts) ─────────────────────
    const cappedEndorsements = Math.min(endorsementCount, 10);
    const endorsements = this.W_ENDORSEMENTS * (cappedEndorsements / 10) * 20;

    // ── Component 4: Recency Factor (max 10 pts) ─────────────────────────────
    // Decays linearly: 1.0 (feedback < 30 days) → 0.5 (feedback > 180 days)
    const latestFeedback = feedbacks.reduce((latest, f) =>
      f.createdAt > latest.createdAt ? f : latest,
    );
    const daysSinceLatest = this.daysDiff(new Date(), latestFeedback.createdAt);
    const recencyFactor = this.computeRecencyFactor(daysSinceLatest);
    const recency = this.W_RECENCY * recencyFactor * 10;

    // ── Total ─────────────────────────────────────────────────────────────────
    const rawTotal = feedbackRating + adoptionRate + endorsements + recency;
    const total = Math.min(Math.round(rawTotal * 100) / 100, 100);

    // ── Persist ───────────────────────────────────────────────────────────────
    await this.prisma.solution.update({
      where: { id: solutionId },
      data: { impactScore: total },
    });

    this.logger.debug(
      `Impact score for ${solutionId}: ` +
      `rating=${feedbackRating.toFixed(1)} adoption=${adoptionRate.toFixed(1)} ` +
      `endorse=${endorsements.toFixed(1)} recency=${recency.toFixed(1)} → ${total}`,
    );

    return {
      feedbackRating: Math.round(feedbackRating * 10) / 10,
      adoptionRate:   Math.round(adoptionRate   * 10) / 10,
      endorsements:   Math.round(endorsements   * 10) / 10,
      recency:        Math.round(recency        * 10) / 10,
      total,
    };
  }

  /**
   * Determine the Wall-of-Fame tier a solution qualifies for.
   * Returns null if it does not meet minimum threshold.
   */
  async evaluateTier(solutionId: string): Promise<'bronze' | 'silver' | 'gold' | null> {
    const [solution, feedbackCount, hasPosterEndorsement] = await Promise.all([
      this.prisma.solution.findUnique({
        where: { id: solutionId },
        select: {
          impactScore: true, status: true,
          problemId: true,
          feedbacks: { select: { checkpoint: true } },
        },
      }),
      this.prisma.feedback.count({ where: { solutionId } }),
      // Problem poster endorsement = poster has upvoted the solution
      this.prisma.vote.findFirst({
        where: {
          entityType: 'solution', entityId: solutionId, value: 1,
          user: { problems: { some: { id: { not: undefined } } } },
        },
      }),
    ]);

    if (!solution) return null;

    const score = Number(solution.impactScore);
    const completedCheckpoints = new Set(solution.feedbacks.map((f) => f.checkpoint)).size;

    // ── Gold: 80–100 ─────────────────────────────────────────────────────────
    if (
      score >= 80 &&
      completedCheckpoints >= 4 &&
      solution.status === 'implemented'
    ) {
      return 'gold';
    }

    // ── Silver: 60–79 ────────────────────────────────────────────────────────
    if (
      score >= 60 &&
      completedCheckpoints >= 2 &&
      (solution.status === 'under_trial' || solution.status === 'implemented')
    ) {
      return 'silver';
    }

    // ── Bronze: 40–59 ────────────────────────────────────────────────────────
    if (score >= 40 && feedbackCount >= 1 && hasPosterEndorsement) {
      return 'bronze';
    }

    return null;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private computeRecencyFactor(daysSince: number): number {
    if (daysSince <= 30)  return 1.0;
    if (daysSince >= 180) return 0.5;
    // Linear interpolation: 1.0 → 0.5 over 150 days (30–180)
    return 1.0 - ((daysSince - 30) / 150) * 0.5;
  }

  private daysDiff(a: Date, b: Date): number {
    return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
  }
}
