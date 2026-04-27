import {
  Controller, Get, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { UserRole } from '../../common/enums';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '[Admin] Platform dashboard statistics' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: '[Admin] List all users with filters' })
  listUsers(
    @Query('page') page = 1, @Query('limit') limit = 20,
    @Query('role') role?: string, @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(+page, +limit, role, search);
  }

  @Patch('users/:id/verify')
  @ApiOperation({ summary: '[Admin] Verify a user (NGO badge)' })
  verifyUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.verifyUser(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: '[Admin] Change user role' })
  updateRole(@Param('id', ParseUUIDPipe) id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Get('moderation')
  @ApiOperation({ summary: '[Admin] Content moderation queue' })
  getModerationQueue(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getModerationQueue(+page, +limit);
  }
}