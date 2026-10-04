import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { User } from '../../generated/prisma/client.js';
import { DashboardQueryDto } from './dto/dashboard-query.dto.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  summary(@CurrentUser() user: User, @Query() dto: DashboardQueryDto) {
    return this.dashboard.summary(user.id, dto.limit ?? 12);
  }
}
