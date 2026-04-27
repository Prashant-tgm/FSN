import {
  Controller, Get, Post, Patch,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Feedback')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit feedback on a deployed solution' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(user.sub, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List public feedback for a solution' })
  findBySolution(
    @Query('solutionId', ParseUUIDPipe) solutionId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.feedbackService.findBySolution(solutionId, pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single feedback record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.feedbackService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update own feedback' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.update(id, user.sub, dto);
  }
}
