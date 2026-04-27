import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';

export enum CommentEntityType { SOLUTION = 'solution', BLOG = 'blog' }

export class CreateCommentDto {
  @ApiProperty({ enum: CommentEntityType }) @IsEnum(CommentEntityType) entityType: CommentEntityType;
  @ApiProperty({ description: 'Solution UUID or Blog ObjectId' }) @IsString() entityId: string;
  @ApiPropertyOptional({ description: 'Parent comment UUID for replies' }) @IsOptional() @IsUUID() parentId?: string;
  @ApiProperty() @IsString() @MaxLength(2000) content: string;
}

export class UpdateCommentDto {
  @ApiProperty() @IsString() @MaxLength(2000) content: string;
}