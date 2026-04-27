import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEnum, IsOptional, IsInt, IsArray,
  MaxLength, Min, IsObject, IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProblemCategory, ProblemUrgency,
  ProblemStatus, ProblemVisibility,
} from '../../../common/enums';

export class ProblemLocationDto {
  @IsOptional() @IsString() village?: string;
  @IsOptional() @IsString() district?: string;
  @IsString() state: string;
  @IsString() country: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}

export class CreateProblemDto {
  @ApiProperty({ example: 'Contaminated Drinking Water in Rajouri Villages' })
  @IsString()
  @MaxLength(300)
  title: string;

  @ApiProperty({ example: 'Detailed rich-text description of the problem...' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ProblemCategory })
  @IsEnum(ProblemCategory)
  category: ProblemCategory;

  @ApiProperty({ type: ProblemLocationDto })
  @IsObject()
  @Type(() => ProblemLocationDto)
  location: ProblemLocationDto;

  @ApiPropertyOptional({ enum: ProblemUrgency, default: ProblemUrgency.MEDIUM })
  @IsOptional()
  @IsEnum(ProblemUrgency)
  urgency?: ProblemUrgency = ProblemUrgency.MEDIUM;

  @ApiPropertyOptional({ example: 3200 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  peopleAffected?: number;

  @ApiPropertyOptional({ enum: ProblemVisibility, default: ProblemVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(ProblemVisibility)
  visibility?: ProblemVisibility = ProblemVisibility.PUBLIC;

  @ApiPropertyOptional({ example: ['water', 'contamination', 'rural'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];
}
