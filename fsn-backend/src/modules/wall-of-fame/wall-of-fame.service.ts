import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class WallOfFameService {
  constructor(private prisma: PrismaService) {}

  async findAll(tier?: string, year?: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (tier) where.tier = tier;
    if (year) where.awardYear = year;

    const [data, total] = await Promise.all([
      this.prisma.wallOfFame.findMany({
        where, skip, take: limit,
        orderBy: [{ tier: 'desc' }, { featuredAt: 'desc' }],
        include: {
          solution: {
            include: {
              innovator: {
                select: { id: true, fullName: true, avatarUrl: true, reputationScore: true },
              },
              problem: {
                select: { id: true, title: true, category: true, location: true },
              },
              feedbacks: {
                select: { rating: true, checkpoint: true },
                where: { isPublic: true },
              },
            },
          },
        },
      }),
      this.prisma.wallOfFame.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const entry = await this.prisma.wallOfFame.findUnique({
      where: { id },
      include: {
        solution: {
          include: {
            innovator: { select: { id: true, fullName: true, avatarUrl: true, bio: true } },
            problem: { select: { id: true, title: true, category: true, location: true } },
            feedbacks: { where: { isPublic: true }, orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    if (!entry) throw new NotFoundException('Wall of Fame entry not found');
    return entry;
  }

  async adminCreate(solutionId: string, tier: string, description?: string) {
    return this.prisma.wallOfFame.upsert({
      where: { solutionId },
      create: {
        solutionId,
        tier: tier as any,
        awardYear: new Date().getFullYear(),
        description,
      },
      update: { tier: tier as any, description },
    });
  }

  async adminUpdateTier(id: string, tier: string) {
    const entry = await this.prisma.wallOfFame.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    return this.prisma.wallOfFame.update({ where: { id }, data: { tier: tier as any } });
  }
}