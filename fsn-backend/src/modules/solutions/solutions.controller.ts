import {
  Controller, Get, Post, Patch,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SolutionsService } from './solutions.service';
import {
  CreateSolutionDto, UpdateSolutionDto,
  UpdateSolutionStatusDto,
} from './dto/create-solution.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/enums';

@ApiTags('Solutions')
@Controller('solutions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolutionsController {
  constructor(private solutionsService: SolutionsService) {}

  // POST /solutions — submit solution (innovator / ngo / admin)
  @Post()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.INNOVATOR, UserRole.NGO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit a solution to a problem' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSolutionDto,
  ) {
    return this.solutionsService.create(user.sub, dto);
  }

  // GET /solutions?problemId= — list solutions for a problem
  @Public()
  @Get()
  @ApiOperation({ summary: 'List solutions (filter by problemId)' })
  findByProblem(
    @Query('problemId', ParseUUIDPipe) problemId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.solutionsService.findByProblem(problemId, pagination);
  }

  // GET /solutions/:id — solution detail
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get solution detail with feedback preview' })
  @ApiParam({ name: 'id', description: 'Solution UUID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.solutionsService.findOne(id);
  }

  // PATCH /solutions/:id — update solution (author only, creates new version)
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update solution (increments version)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSolutionDto,
  ) {
    return this.solutionsService.update(id, user.sub, dto);
  }

  // PATCH /solutions/:id/status — accept / under_trial / implement (problem owner)
  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update solution status (problem owner only)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSolutionStatusDto,
  ) {
    return this.solutionsService.updateStatus(id, user.sub, dto);
  }

  // POST /solutions/:id/upvote — toggle
  @Post(':id/upvote')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upvote / toggle upvote on a solution' })
  upvote(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.solutionsService.toggleUpvote(id, user.sub);
  }
}
