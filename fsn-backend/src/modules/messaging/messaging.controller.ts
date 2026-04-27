import {
  Controller, Get, Post, Patch,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { CreateConversationDto, SendMessageDto } from './dto/messaging.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Messaging')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Post()
  @ApiOperation({ summary: 'Get or create a conversation with another user' })
  createConversation(@CurrentUser() user: JwtPayload, @Body() dto: CreateConversationDto) {
    return this.messagingService.getOrCreateConversation(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all conversations for current user' })
  listConversations(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.messagingService.listConversations(user.sub, +page, +limit);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Paginated messages in a conversation' })
  getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.messagingService.getMessages(id, user.sub, +page, +limit);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message (REST fallback; prefer Socket.io)' })
  sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(id, user.sub, dto);
  }

  @Patch('messages/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  markRead(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagingService.markRead(messageId, user.sub);
  }
}