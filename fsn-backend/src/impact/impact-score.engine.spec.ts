import { Test, TestingModule } from '@nestjs/testing';
import { ImpactScoreEngine } from './impact-score.engine';
import { PrismaService } from '../database/prisma.service';

/**
 * Unit tests for FSN Impact Score Algorithm (TDP §10)
 * Uses a fully-mocked PrismaService so no DB connection needed.
 */
describe('ImpactScoreEngine', () => {
  let engine: ImpactScoreEngine;
  let prisma: jest.Mocked<PrismaService>;

  const mockSolution = {
    id: 'sol-1',
    problemId: 'prob-1',
    status: 'under_trial',
    createdAt: new Date('2026-01-01'),
  };

  const buildMockPrisma = (overrides: Partial<any> = {}) => ({
    solution: {
      findUnique: jest.fn().mockResolvedValue(mockSolution),
      update: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(1),
    },
    feedback: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    vote: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    wallOfFame: { findUnique: jest.fn().mockResolvedValue(null) },
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpactScoreEngine,
        { provide: PrismaService, useValue: buildMockPrisma() },
      ],
    }).compile();

    engine = module.get<ImpactScoreEngine>(ImpactScoreEngine);
    prisma = module.get(PrismaService) as any;
  });

  describe('compute()', () => {
    it('returns zeros when no feedback exists', async () => {
      (prisma.feedback.findMany as jest.Mock).mockResolvedValue([]);
      const result = await engine.compute('sol-1');

      expect(result.total).toBe(0);
      expect(result.feedbackRating).toBe(0);
      expect(result.adoptionRate).toBe(0);
    });

    it('scores max feedback rating (40pts) when all ratings are 5', async () => {
      const feedbacks = [
        { rating: 5, checkpoint: 'week1', createdAt: new Date() },
        { rating: 5, checkpoint: 'month1', createdAt: new Date() },
      ];
      (prisma.feedback.findMany as jest.Mock).mockResolvedValue(feedbacks);
      (prisma.vote.count as jest.Mock).mockResolvedValue(0);
      (prisma.solution.count as jest.Mock).mockResolvedValue(0);

      const result = await engine.compute('sol-1');

      // avg = 5/5 = 1.0 * 40 = 40
      expect(result.feedbackRating).toBe(40);
    });

    it('scores 20pts for feedback rating when avg is 2.5/5', async () => {
      const feedbacks = [
        { rating: 2, checkpoint: 'week1', createdAt: new Date() },
        { rating: 3, checkpoint: 'month1', createdAt: new Date() },
      ];
      (prisma.feedback.findMany as jest.Mock).mockResolvedValue(feedbacks);
      (prisma.vote.count as jest.Mock).mockResolvedValue(0);
      (prisma.solution.count as jest.Mock).mockResolvedValue(0);

      const result = await engine.compute('sol-1');

      // avg = 2.5, normalised = 2.5/5 = 0.5, * 40 = 20
      expect(result.feedbackRating).toBe(20);
    });

    it('scores full adoption (30pts) when solution is implemented', async () => {
      const implemented = { ...mockSolution, status: 'implemented' };
      (prisma.solution.findUnique as jest.Mock).mockResolvedValue(implemented);
      (prisma.feedback.findMany as jest.Mock).mockResolvedValue([
        { rating: 4, checkpoint: 'week1', createdAt: new Date() },
      ]);
      (prisma.vote.count as jest.Mock).mockResolvedValue(0);
      (prisma.solution.count as jest.Mock).mockResolvedValue(1);

      const result = await engine.compute('sol-1');

      // Implemented solutions get full adoption credit
      expect(result.adoptionRate).toBe(30);
    });

    it('scores max endorsements (20pts) when 10+ verified votes', async () => {
      (prisma.feedback.findMany as jest.Mock).mockResolvedValue([
        { rating: 4, checkpoint: 'month1', createdAt: new Date() },
      ]);
      (prisma.vote.count as jest.Mock).mockResolvedValue(15); // capped at 10
      (prisma.solution.count as jest.Mock).mockResolvedValue(0);

      const result = await engine.compute('sol-1');

      // min(15,10)/10 * 20 = 20
      expect(result.endorsements).toBe(20);
    });

    it('applies recency decay for feedback older than 180 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 200);

      (prisma.feedback.findMany as jest.Mock).mockResolvedValue([
        { rating: 5, checkpoint: 'week1', createdAt: oldDate },
      ]);
      (prisma.vote.count as jest.Mock).mockResolvedValue(0);
      (prisma.solution.count as jest.Mock).mockResolvedValue(0);

      const result = await engine.compute('sol-1');

      // Recency factor = 0.5, max = 10 * 0.5 = 5
      expect(result.recency).toBe(5);
    });

    it('applies full recency for feedback within 30 days', async () => {
      (prisma.feedback.findMany as jest.Mock).mockResolvedValue([
        { rating: 5, checkpoint: 'week1', createdAt: new Date() },
      ]);
      (prisma.vote.count as jest.Mock).mockResolvedValue(0);
      (prisma.solution.count as jest.Mock).mockResolvedValue(0);

      const result = await engine.compute('sol-1');

      expect(result.recency).toBe(10);
    });

    it('total never exceeds 100', async () => {
      const implemented = { ...mockSolution, status: 'implemented' };
      (prisma.solution.findUnique as jest.Mock).mockResolvedValue(implemented);
      (prisma.feedback.findMany as jest.Mock).mockResolvedValue([
        { rating: 5, checkpoint: 'week1', createdAt: new Date() },
        { rating: 5, checkpoint: 'month1', createdAt: new Date() },
        { rating: 5, checkpoint: 'month3', createdAt: new Date() },
        { rating: 5, checkpoint: 'month6', createdAt: new Date() },
      ]);
      (prisma.vote.count as jest.Mock).mockResolvedValue(10);
      (prisma.solution.count as jest.Mock).mockResolvedValue(1);

      const result = await engine.compute('sol-1');

      expect(result.total).toBeLessThanOrEqual(100);
    });

    it('persists computed score to the database', async () => {
      (prisma.feedback.findMany as jest.Mock).mockResolvedValue([
        { rating: 4, checkpoint: 'week1', createdAt: new Date() },
      ]);
      (prisma.vote.count as jest.Mock).mockResolvedValue(3);
      (prisma.solution.count as jest.Mock).mockResolvedValue(0);

      await engine.compute('sol-1');

      expect(prisma.solution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sol-1' },
          data: expect.objectContaining({ impactScore: expect.any(Number) }),
        }),
      );
    });
  });

  describe('evaluateTier()', () => {
    it('returns null when score is below 40', async () => {
      (prisma.solution.findUnique as jest.Mock).mockResolvedValue({
        ...mockSolution,
        impactScore: 35,
        feedbacks: [],
      });
      (prisma.feedback.count as jest.Mock).mockResolvedValue(0);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);

      const tier = await engine.evaluateTier('sol-1');
      expect(tier).toBeNull();
    });

    it('returns bronze when score >= 40 with endorsement', async () => {
      (prisma.solution.findUnique as jest.Mock).mockResolvedValue({
        ...mockSolution,
        impactScore: 45,
        status: 'accepted',
        feedbacks: [{ checkpoint: 'week1' }],
      });
      (prisma.feedback.count as jest.Mock).mockResolvedValue(1);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue({ id: 'vote-1' });

      const tier = await engine.evaluateTier('sol-1');
      expect(tier).toBe('bronze');
    });

    it('returns silver when score >= 60, 2+ checkpoints, under_trial', async () => {
      (prisma.solution.findUnique as jest.Mock).mockResolvedValue({
        ...mockSolution,
        impactScore: 65,
        status: 'under_trial',
        feedbacks: [{ checkpoint: 'week1' }, { checkpoint: 'month1' }],
      });
      (prisma.feedback.count as jest.Mock).mockResolvedValue(2);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);

      const tier = await engine.evaluateTier('sol-1');
      expect(tier).toBe('silver');
    });

    it('returns gold when score >= 80, 4 checkpoints, implemented', async () => {
      (prisma.solution.findUnique as jest.Mock).mockResolvedValue({
        ...mockSolution,
        impactScore: 85,
        status: 'implemented',
        feedbacks: [
          { checkpoint: 'week1' }, { checkpoint: 'month1' },
          { checkpoint: 'month3' }, { checkpoint: 'month6' },
        ],
      });
      (prisma.feedback.count as jest.Mock).mockResolvedValue(4);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue(null);

      const tier = await engine.evaluateTier('sol-1');
      expect(tier).toBe('gold');
    });
  });
});