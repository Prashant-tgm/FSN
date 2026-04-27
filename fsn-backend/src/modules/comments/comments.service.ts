import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { UserRole } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        userId,
        entityType: dto.entityType as any,
        entityId: dto.entityId,
        parentId: dto.parentId,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        replies: {
          take: 0,
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
      },
    });
  }

  async findByEntity(entityType: string, entityId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { entityType: entityType as any, entityId, parentId: null, isDeleted: false },
        skip, take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          replies: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
          },
        },
      }),
      this.prisma.comment.count({
        where: { entityType: entityType as any, entityId, parentId: null, isDeleted: false },
      }),
    ]);
    return paginate(data, total, page, limit);
  }

  async update(id: string, requesterId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.isDeleted) throw new NotFoundException('Comment not found');
    if (comment.userId !== requesterId) throw new ForbiddenException('You can only edit your own comments');
    return this.prisma.comment.update({ where: { id }, data: { content: dto.content } });
  }

  async remove(id: string, requesterId: string, requesterRole: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.isDeleted) throw new NotFoundException('Comment not found');
    if (comment.userId !== requesterId && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only the author or admin can delete this comment');
    }
    return this.prisma.comment.update({ where: { id }, data: { isDeleted: true } });
  }
}