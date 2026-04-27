import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto, QueryProblemsDto } from './dto/query-problem.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Problems')
@Controller('problems')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProblemsController {
  constructor(private problemsService: ProblemsService) {}

  // GET /problems — public feed
  @Public()
  @Get()
  @ApiOperation({ summary: 'Paginated problem feed with filters and search' })
  findAll(@Query() query: QueryProblemsDto) {
    return this.problemsService.findAll(query);
  }

  // GET /problems/map — GeoJSON for map view
  @Public()
  @Get('map')
  @ApiOperation({ summary: 'GeoJSON of all public problems for map view' })
  getMap() {
    return this.problemsService.getMapGeoJson();
  }

  // POST /problems — create
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new problem listing (auth required)' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProblemDto,
  ) {
    return this.problemsService.create(user.sub, dto);
  }

  // GET /problems/:id — detail
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get problem detail with solution count' })
  @ApiParam({ name: 'id', description: 'Problem UUID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.problemsService.findOne(id, user?.sub);
  }

  // PATCH /problems/:id — update
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update problem details or status (owner / admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProblemDto,
  ) {
    return this.problemsService.update(id, user.sub, user.role, dto);
  }

  // DELETE /problems/:id — soft delete
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft-delete a problem (owner / admin)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.problemsService.remove(id, user.sub, user.role);
  }

  // POST /problems/:id/upvote — toggle upvote
  @Post(':id/upvote')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upvote / toggle upvote on a problem' })
  upvote(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.problemsService.toggleUpvote(id, user.sub);
  }

  // GET /problems/:id/solutions — listed in SolutionsController but also here
  @Public()
  @Get(':id/solutions')
  @ApiOperation({ summary: 'List solutions for a specific problem (delegates to SolutionsService)' })
  getSolutions(@Param('id', ParseUUIDPipe) _id: string) {
    // Delegated — ProblemsController just documents the route.
    // Actual logic handled by SolutionsController at GET /solutions?problemId=
    return { message: 'Use GET /solutions?problemId=:id for this endpoint' };
  }
}
