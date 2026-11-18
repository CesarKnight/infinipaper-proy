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
import { UsageQueryDto } from './dto/usage-query.dto.js';
import { UsageService } from './usage.service.js';

@ApiTags('usage')
@Controller()
@UseGuards(ProjectAccessGuard)
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get('projects/:projectId/usage')
  @RequireProjectRole('editor')
  projectUsage(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query() dto: UsageQueryDto,
  ) {
    return this.usage.getProjectUsage(projectId, user.id, dto);
  }

  @Get('projects/:projectId/usage/export')
  @RequireProjectRole('editor')
  async export(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query() dto: UsageQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.usage.exportCsv(projectId, user.id, dto);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="uso-${projectId}.csv"`,
    );
    res.send(csv);
  }

  @Get('files/:fileId/usage')
  @RequireProjectRole('editor')
  fileUsage(@Param('fileId') fileId: string, @CurrentUser() user: User) {
    return this.usage.getFileUsage(fileId, user.id);
  }
}
