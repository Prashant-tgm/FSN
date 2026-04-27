import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEnum, IsOptional, IsArray,
  IsBoolean, MaxLength,
} from 'class-validator';
import { BlogCategory } from '../../../database/mongoose/blog.schema';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateBlogDto {
  @ApiProperty() @IsString() @MaxLength(400) title: string;
  @ApiProperty({ enum: BlogCategory }) @IsEnum(BlogCategory) category: BlogCategory;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() content?: any[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class UpdateBlogDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(400) title?: string;
  @ApiPropertyOptional({ enum: BlogCategory }) @IsOptional() @IsEnum(BlogCategory) category?: BlogCategory;
  @ApiPropertyOptional() @IsOptional() @IsString() coverImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() content?: any[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class QueryBlogsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BlogCategory })
  @IsOptional()
  @IsEnum(BlogCategory)
  category?: BlogCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorId?: string;
}