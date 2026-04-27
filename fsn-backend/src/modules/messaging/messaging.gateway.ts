import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, ConnectedSocket,
  MessageBody, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';

/**
 * Socket.io gateway — TDP §4.6
 * Namespaces: /messaging, /notifications, /cocreation
 */
@WebSocketGateway({
  namespace: '/messaging',
  cors: { origin: '*' },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessagingGateway.name);
  private userSockets = new Map<string, string>(); // userId → socketId

  constructor(
    private messagingService: MessagingService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token
        ?? client.handshake.headers?.authorization?.replace('Bearer ', '');

      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.publicKey'),
        algorithms: ['RS256'],
      });

      client.data.userId = payload.sub;
      this.userSockets.set(payload.sub, client.id);
      client.join(`user:${payload.sub}`);
      this.logger.debug(`Client connected: ${payload.sub} (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) this.userSockets.delete(userId);
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; content: string },
  ) {
    const { conversationId, content } = payload;
    const senderId = client.data.userId;

    const message = await this.messagingService.sendMessage(
      conversationId, senderId, { content },
    );

    // Broadcast to all participants in the conversation room
    this.server.to(`conv:${conversationId}`).emit('message:new', {
      conversationId, message,
    });

    return message;
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    client.join(`conv:${payload.conversationId}`);
    return { joined: payload.conversationId };
  }

  @SubscribeMessage('message:read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string },
  ) {
    return this.messagingService.markRead(payload.messageId, client.data.userId);
  }

  /** Emit a real-time notification to a specific user — called from NotificationsService */
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}