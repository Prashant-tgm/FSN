import {
  Controller, Get, Post, Patch,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WallOfFameService } from './wall-of-fame.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { UserRole } from '../../common/enums';
import { IsString, IsOptional, IsUUID } from 'class-validator';

class AdminCreateWoFDto {
  @IsUUID() solutionId: string;
  @IsString() tier: string;
  @IsOptional() @IsString() description?: string;
}

@ApiTags('Wall of Fame')
@Controller('wall-of-fame')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WallOfFameController {
  constructor(private wofService: WallOfFameService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List Wall of Fame entries (filter by tier, year)' })
  findAll(
    @Query('tier') tier?: string,
    @Query('year') year?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.wofService.findAll(tier, year ? +year : undefined, +page, +limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get Wall of Fame entry detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.wofService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Add solution to Wall of Fame' })
  adminCreate(@Body() dto: AdminCreateWoFDto) {
    return this.wofService.adminCreate(dto.solutionId, dto.tier, dto.description);
  }

  @Patch(':id/tier')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[Admin] Upgrade / downgrade tier' })
  adminUpdateTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('tier') tier: string,
  ) {
    return this.wofService.adminUpdateTier(id, tier);
  }
}