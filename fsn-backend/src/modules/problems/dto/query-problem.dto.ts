import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProblemCategory, ProblemUrgency,
  ProblemStatus, ProblemVisibility,
} from '../../../common/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum ProblemSortBy {
  NEWEST       = 'newest',
  MOST_UPVOTED = 'most_upvoted',
  MOST_SOLUTIONS = 'most_solutions',
  MOST_URGENT  = 'most_urgent',
}

export class QueryProblemsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProblemCategory })
  @IsOptional() @IsEnum(ProblemCategory)
  category?: ProblemCategory;

  @ApiPropertyOptional({ enum: ProblemUrgency })
  @IsOptional() @IsEnum(ProblemUrgency)
  urgency?: ProblemUrgency;

  @ApiPropertyOptional({ enum: ProblemStatus })
  @IsOptional() @IsEnum(ProblemStatus)
  status?: ProblemStatus;

  @ApiPropertyOptional({ description: 'State filter' })
  @IsOptional() @IsString()
  state?: string;

  @ApiPropertyOptional({ enum: ProblemSortBy, default: ProblemSortBy.NEWEST })
  @IsOptional() @IsEnum(ProblemSortBy)
  sortBy?: ProblemSortBy = ProblemSortBy.NEWEST;

  @ApiPropertyOptional({ description: 'Latitude for geo-proximity sort' })
  @IsOptional() @IsNumber() @Type(() => Number)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for geo-proximity sort' })
  @IsOptional() @IsNumber() @Type(() => Number)
  lng?: number;
}

export class UpdateProblemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ProblemUrgency }) @IsOptional() @IsEnum(ProblemUrgency) urgency?: ProblemUrgency;
  @ApiPropertyOptional({ enum: ProblemStatus }) @IsOptional() @IsEnum(ProblemStatus) status?: ProblemStatus;
  @ApiPropertyOptional({ enum: ProblemVisibility }) @IsOptional() @IsEnum(ProblemVisibility) visibility?: ProblemVisibility;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) peopleAffected?: number;
}
