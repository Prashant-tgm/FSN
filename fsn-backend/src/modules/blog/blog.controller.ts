import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDto, UpdateBlogDto, QueryBlogsDto } from './dto/blog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Blog')
@Controller('blogs')
@UseGuards(JwtAuthGuard)
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a blog post' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBlogDto) {
    return this.blogService.create(user.sub, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published blogs' })
  findAll(@Query() query: QueryBlogsDto) {
    return this.blogService.findAll(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get blog post by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update blog post (author / admin)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBlogDto,
  ) {
    return this.blogService.update(id, user.sub, user.role, dto);
  }

  @Post(':id/clap')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clap / appreciate a blog post' })
  clap(@Param('id') id: string) {
    return this.blogService.clap(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete blog post (author / admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.blogService.remove(id, user.sub, user.role);
  }
}