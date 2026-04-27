import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService) {}

  // ── Users ──────────────────────────────────────────────────────────────────

  async listUsers(page = 1, limit = 20, role?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = { isDeleted: false };
    if (role) where.role = role;
    if (search) where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, role: true, isVerified: true, reputationScore: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async verifyUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id: userId }, data: { isVerified: true },
      select: { id: true, fullName: true, isVerified: true },
    });
  }

  async updateUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id: userId }, data: { role: role as any },
      select: { id: true, fullName: true, role: true },
    });
  }

  // ── Content Moderation ─────────────────────────────────────────────────────

  async getModerationQueue(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [problems, solutions] = await Promise.all([
      this.prisma.problem.findMany({
        where: { isDeleted: false, createdAt: { gte: new Date(Date.now() - 48*3600*1000) } },
        skip, take: Math.floor(limit / 2),
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, category: true, status: true, createdAt: true,
          poster: { select: { fullName: true, role: true } } },
      }),
      this.prisma.solution.findMany({
        where: { isDeleted: false, status: 'submitted', createdAt: { gte: new Date(Date.now() - 48*3600*1000) } },
        skip, take: Math.floor(limit / 2),
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, createdAt: true,
          innovator: { select: { fullName: true } } },
      }),
    ]);
    return { problems, solutions };
  }

  // ── Platform Analytics ─────────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers, totalProblems, totalSolutions,
      openProblems, solvedProblems, totalFeedback,
      wofEntries, recentUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isDeleted: false } }),
      this.prisma.problem.count({ where: { isDeleted: false } }),
      this.prisma.solution.count({ where: { isDeleted: false } }),
      this.prisma.problem.count({ where: { status: 'open', isDeleted: false } }),
      this.prisma.problem.count({ where: { status: 'solved', isDeleted: false } }),
      this.prisma.feedback.count(),
      this.prisma.wallOfFame.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7*24*3600*1000) }, isDeleted: false },
      }),
    ]);

    const roleBreakdown = await this.prisma.user.groupBy({
      by: ['role'], _count: { _all: true },
      where: { isDeleted: false },
    });

    const categoryBreakdown = await this.prisma.problem.groupBy({
      by: ['category'], _count: { _all: true },
      where: { isDeleted: false },
    });

    return {
      totals: { users: totalUsers, problems: totalProblems, solutions: totalSolutions, feedback: totalFeedback },
      problems: { open: openProblems, solved: solvedProblems },
      wallOfFame: wofEntries,
      recentUsers7d: recentUsers,
      roleBreakdown: roleBreakdown.map(r => ({ role: r.role, count: r._count._all })),
      categoryBreakdown: categoryBreakdown.map(c => ({ category: c.category, count: c._count._all })),
    };
  }
}