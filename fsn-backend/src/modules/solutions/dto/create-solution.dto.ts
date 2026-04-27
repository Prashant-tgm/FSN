import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsUUID, IsOptional, IsArray,
  IsBoolean, IsNumber, MaxLength, IsObject, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SolutionStatus } from '../../../common/enums';

export class CostItemDto {
  @IsString() item: string;
  @IsNumber() @Min(0) qty: number;
  @IsNumber() @Min(0) unitCost: number;
  @IsNumber() @Min(0) total: number;
}

export class TimelinePhaseDto {
  @IsString() phase: string;
  @IsNumber() @Min(1) durationDays: number;
}

export class CreateSolutionDto {
  @ApiProperty({ description: 'UUID of the problem being addressed' })
  @IsUUID()
  problemId: string;

  @ApiProperty({ example: 'Low-Cost Bio-Sand Filtration System' })
  @IsString()
  @MaxLength(300)
  title: string;

  @ApiProperty({ example: 'A community-scale bio-sand filter...' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: ['IoT', 'Biogas', 'Mobile App'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techTags?: string[] = [];

  @ApiPropertyOptional({ type: [CostItemDto] })
  @IsOptional()
  @IsArray()
  @Type(() => CostItemDto)
  costEstimate?: CostItemDto[];

  @ApiPropertyOptional({ type: [TimelinePhaseDto] })
  @IsOptional()
  @IsArray()
  @Type(() => TimelinePhaseDto)
  timeline?: TimelinePhaseDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  coCreationOpen?: boolean = false;

  @ApiPropertyOptional({ description: 'GitHub URL, demo URL, attachment URLs' })
  @IsOptional()
  @IsObject()
  media?: { githubUrl?: string; demoUrl?: string; attachments?: string[] };
}

export class UpdateSolutionStatusDto {
  @ApiProperty({ enum: SolutionStatus })
  @IsString()
  status: SolutionStatus;
}

export class UpdateSolutionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) techTags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() coCreationOpen?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() media?: Record<string, any>;
}
