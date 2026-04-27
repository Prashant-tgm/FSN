import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private prisma: PrismaService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Public platform statistics for the landing page' })
  async getPlatformStats() {
    const [
      problemsCount,
      solutionsCount,
      innovatorsCount,
      avgFeedbackRating,
      communitiesCount,
    ] = await Promise.all([
      this.prisma.problem.count({ where: { isDeleted: false } }),
      this.prisma.solution.count({ where: { isDeleted: false } }),
      this.prisma.user.count({
        where: {
          isDeleted: false,
          role: { in: ['innovator', 'ngo'] },
        },
      }),
      this.prisma.feedback.aggregate({ _avg: { rating: true } }),
      this.prisma.problem.findMany({
        where: { isDeleted: false },
        select: { location: true },
        distinct: ['location'],
      }),
    ]);

    // Satisfaction rate: avg feedback rating / 5 * 100, fallback to 0
    const avgRating = avgFeedbackRating._avg.rating ?? 0;
    const satisfactionRate = Math.round((avgRating / 5) * 100);

    return {
      problemsCount,
      solutionsCount,
      innovatorsCount,
      satisfactionRate,
      communitiesCount: communitiesCount.length,
    };
  }
}
