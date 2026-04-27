import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { ProblemsService } from './problems.service';
import { PrismaService } from '../../database/prisma.service';
import { QueueName } from '../../common/enums';

describe('ProblemsService', () => {
  let service: ProblemsService;

  const mockProblem = {
    id: 'prob-1',
    title: 'Water contamination in Rajouri',
    description: 'Detailed desc',
    category: 'water',
    urgency: 'critical',
    status: 'open',
    visibility: 'public',
    tags: ['water', 'rural'],
    postedBy: 'user-1',
    upvoteCount: 5,
    solutionCount: 2,
    location: { village: 'Rajouri', state: 'J&K', country: 'India' },
    isDeleted: false,
    createdAt: new Date(),
    poster: { id: 'user-1', fullName: 'Priya', role: 'ngo', avatarUrl: null, isVerified: true },
  };

  const mockPrisma = {
    problem: {
      create:     jest.fn().mockResolvedValue(mockProblem),
      findMany:   jest.fn().mockResolvedValue([mockProblem]),
      findFirst:  jest.fn().mockResolvedValue(mockProblem),
      findUnique: jest.fn().mockResolvedValue(mockProblem),
      update:     jest.fn().mockResolvedValue(mockProblem),
      count:      jest.fn().mockResolvedValue(1),
    },
    vote: {
      findUnique: jest.fn().mockResolvedValue(null),
      create:     jest.fn().mockResolvedValue({}),
      delete:     jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((ops) =>
      Array.isArray(ops) ? Promise.all(ops) : ops(mockPrisma),
    ),
  };

  const mockQueue = { add: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(QueueName.SEARCH), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ProblemsService>(ProblemsService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('creates a problem and queues ES indexing', async () => {
      mockPrisma.problem.create.mockResolvedValue(mockProblem);

      const result = await service.create('user-1', {
        title: 'Water contamination in Rajouri',
        description: 'Detailed desc',
        category: 'water' as any,
        location: { state: 'J&K', country: 'India' },
      });

      expect(result.title).toBe('Water contamination in Rajouri');
      expect(mockQueue.add).toHaveBeenCalledWith('indexProblem', { problemId: mockProblem.id });
    });
  });

  describe('findOne()', () => {
    it('returns problem when found', async () => {
      mockPrisma.problem.findFirst.mockResolvedValue({
        ...mockProblem,
        _count: { solutions: 2, votes: 5 },
      });
      const result = await service.findOne('prob-1');
      expect(result.id).toBe('prob-1');
    });

    it('throws NotFoundException when problem not found', async () => {
      mockPrisma.problem.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('throws ForbiddenException when non-owner tries to delete', async () => {
      mockPrisma.problem.findUnique.mockResolvedValue(mockProblem);
      await expect(service.remove('prob-1', 'other-user', 'bop_user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('allows owner to soft-delete', async () => {
      mockPrisma.problem.findUnique.mockResolvedValue(mockProblem);
      mockPrisma.problem.update.mockResolvedValue({ ...mockProblem, isDeleted: true });

      const result = await service.remove('prob-1', 'user-1', 'bop_user');
      expect(result.message).toContain('deleted');
      expect(mockPrisma.problem.update).toHaveBeenCalledWith({
        where: { id: 'prob-1' },
        data: { isDeleted: true },
      });
    });

    it('allows admin to delete any problem', async () => {
      mockPrisma.problem.findUnique.mockResolvedValue(mockProblem);
      const result = await service.remove('prob-1', 'admin-user', 'admin');
      expect(result.message).toBeDefined();
    });
  });

  describe('toggleUpvote()', () => {
    it('adds upvote when none exists', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation((ops: any[]) => Promise.all(ops));

      const result = await service.toggleUpvote('prob-1', 'user-1');
      expect(result.upvoted).toBe(true);
    });

    it('removes upvote when already exists', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue({ id: 'vote-1' });
      mockPrisma.vote.delete.mockResolvedValue({});
      mockPrisma.problem.update.mockResolvedValue({});

      const result = await service.toggleUpvote('prob-1', 'user-1');
      expect(result.upvoted).toBe(false);
    });
  });
});