import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

// Fields returned on public profile — never expose passwordHash
const PUBLIC_USER_SELECT = {
  id: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  bio: true,
  location: true,
  isVerified: true,
  reputationScore: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: {
        ...PUBLIC_USER_SELECT,
        email: true,
        phone: true,
        oauthProvider: true,
        badges: {
          select: { badgeType: true, awardedAt: true, metadata: true },
          orderBy: { awardedAt: 'desc' },
        },
        _count: {
          select: { problems: true, solutions: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: {
        ...PUBLIC_USER_SELECT,
        badges: {
          select: { badgeType: true, awardedAt: true },
        },
        _count: {
          select: { problems: true, solutions: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, requesterId: string, dto: UpdateUserDto) {
    if (id !== requesterId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.location && { location: dto.location as any }),
        ...(dto.avatarUrl && { avatarUrl: dto.avatarUrl }),
      },
      select: PUBLIC_USER_SELECT,
    });
  }

  async getUserProblems(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.problem.findMany({
        where: { postedBy: userId, isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, category: true, urgency: true,
          status: true, upvoteCount: true, solutionCount: true, createdAt: true,
        },
      }),
      this.prisma.problem.count({ where: { postedBy: userId, isDeleted: false } }),
    ]);

    return paginate(data, total, page, limit);
  }

  async getUserSolutions(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.solution.findMany({
        where: { submittedBy: userId, isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, status: true, impactScore: true,
          upvoteCount: true, createdAt: true,
          problem: { select: { id: true, title: true, category: true } },
        },
      }),
      this.prisma.solution.count({ where: { submittedBy: userId, isDeleted: false } }),
    ]);

    return paginate(data, total, page, limit);
  }

  async deleteAccount(userId: string) {
    // Anonymise rather than hard-delete (PDPB / GDPR compliance)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        email: null,
        phone: null,
        passwordHash: null,
        fullName: '[Deleted User]',
        avatarUrl: null,
        bio: null,
        oauthId: null,
      },
    });
    return { message: 'Account anonymised and scheduled for deletion' };
  }
}
