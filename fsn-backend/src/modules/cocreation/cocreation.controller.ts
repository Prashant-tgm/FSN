import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoCreationService } from './cocreation.service';
import {
  RequestCoCreationDto, UpdateCoCreationStatusDto,
  AddNgoFacilitatorDto, WorkspaceTaskDto,
} from './dto/cocreation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Co-Creation')
@Controller('cocreations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CoCreationController {
  constructor(private service: CoCreationService) {}

  @Post()
  @ApiOperation({ summary: 'Request co-creation with problem poster' })
  request(@CurrentUser() user: JwtPayload, @Body() dto: RequestCoCreationDto) {
    return this.service.request(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get co-creation detail + workspace' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.sub);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Accept / decline / close co-creation' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCoCreationStatusDto,
  ) {
    return this.service.updateStatus(id, user.sub, dto);
  }

  @Get(':id/workspace')
  @ApiOperation({ summary: 'Get shared workspace' })
  getWorkspace(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.service.getWorkspace(id, user.sub);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Add a task to workspace' })
  addTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: WorkspaceTaskDto,
  ) {
    return this.service.addTask(id, user.sub, dto);
  }

  @Patch(':id/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update workspace notes' })
  updateNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body('notes') notes: string,
  ) {
    return this.service.updateWorkspaceNotes(id, user.sub, notes);
  }
}