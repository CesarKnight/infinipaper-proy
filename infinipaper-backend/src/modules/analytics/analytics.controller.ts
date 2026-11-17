import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { AnalyticsQueryDto } from './dto/analytics-query.dto.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('analytics')
@Controller('projects/:projectId')
@UseGuards(ProjectAccessGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('analytics')
  @RequireProjectRole('editor')
  getPanel(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query() dto: AnalyticsQueryDto,
  ) {
    return this.analytics.getPanel(projectId, user.id, dto);
  }

  @Get('analytics/tasks')
  @RequireProjectRole('editor')
  getTasks(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query() dto: AnalyticsQueryDto,
  ) {
    return this.analytics.getTasks(projectId, user.id, dto);
  }

  @Get('analytics/students')
  @RequireProjectRole('editor')
  getStudents(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query() dto: AnalyticsQueryDto,
  ) {
    return this.analytics.getStudents(projectId, user.id, dto);
  }

  @Get('analytics/export')
  @RequireProjectRole('editor')
  async exportCsv(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query() dto: AnalyticsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.analytics.exportCsv(projectId, user.id, dto);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="panel-${projectId}.csv"`,
    );
    res.send(csv);
  }

  @Get('my-progress')
  @RequireProjectRole('viewer')
  myProgress(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    return this.analytics.myProgress(projectId, user.id);
  }
}
