import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateConversationDto, SendMessageDto } from './dto/messaging.dto';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(requesterId: string, dto: CreateConversationDto) {
    // Check if conversation between these two users already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: { userId: { in: [requesterId, dto.participantId] } },
        },
        ...(dto.coCreationId ? { coCreationId: dto.coCreationId } : {}),
      },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        _count: { select: { messages: true } },
      },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        coCreationId: dto.coCreationId,
        participants: {
          create: [
            { userId: requesterId },
            { userId: dto.participantId },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
      },
    });
  }

  async listConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { participants: { some: { userId } } },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          participants: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.conversation.count({ where: { participants: { some: { userId } } } }),
    ]);
    return paginate(data, total, page, limit);
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 30) {
    await this.assertParticipant(conversationId, userId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, isDeleted: false },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      this.prisma.message.count({ where: { conversationId, isDeleted: false } }),
    ]);
    return paginate(data, total, page, limit);
  }

  async sendMessage(conversationId: string, senderId: string, dto: SendMessageDto) {
    await this.assertParticipant(conversationId, senderId);
    return this.prisma.message.create({
      data: { conversationId, senderId, content: dto.content },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  async markRead(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    await this.assertParticipant(msg.conversationId, userId);
    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const p = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!p) throw new ForbiddenException('You are not part of this conversation');
  }
}