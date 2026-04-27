import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID, IsInt, Min, Max, IsEnum,
  IsOptional, IsString, IsBoolean, IsArray,
} from 'class-validator';
import { FeedbackCheckpoint } from '../../../common/enums';

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Solution UUID' })
  @IsUUID()
  solutionId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt() @Min(1) @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  whatWorked?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  whatFailed?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  suggestions?: string;

  @ApiProperty({ enum: FeedbackCheckpoint })
  @IsEnum(FeedbackCheckpoint)
  checkpoint: FeedbackCheckpoint;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  isPublic?: boolean = true;

  @ApiPropertyOptional({ type: [String], description: 'S3 media URLs' })
  @IsOptional() @IsArray() @IsString({ each: true })
  mediaUrls?: string[];
}

export class UpdateFeedbackDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() whatWorked?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatFailed?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() suggestions?: string;
}
