import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'UUID of the other participant' })
  @IsUUID() participantId: string;
  @ApiPropertyOptional({ description: 'Link to a co-creation' })
  @IsOptional() @IsUUID() coCreationId?: string;
}

export class SendMessageDto {
  @ApiProperty() @IsString() @MaxLength(4000) content: string;
}