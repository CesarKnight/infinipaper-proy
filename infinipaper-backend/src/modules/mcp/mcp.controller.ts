import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { CreateMcpTokenDto } from './dto/mcp-token.dto.js';
import { McpService } from './mcp.service.js';

@ApiTags('mcp')
@Controller('projects/:projectId/mcp-tokens')
@UseGuards(ProjectAccessGuard)
export class McpTokenController {
  constructor(private readonly mcp: McpService) {}

  @Post()
  @RequireProjectRole('editor')
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateMcpTokenDto,
  ) {
    return this.mcp.createToken(projectId, user.id, dto);
  }

  @Get()
  @RequireProjectRole('editor')
  list(@Param('projectId') projectId: string, @CurrentUser() user: User) {
    return this.mcp.listTokens(projectId, user.id);
  }
}

@ApiTags('mcp')
@Controller('mcp-tokens')
@UseGuards(ProjectAccessGuard)
export class McpRevokeController {
  constructor(private readonly mcp: McpService) {}

  @Delete(':mcpTokenId')
  @RequireProjectRole('editor')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @Param('mcpTokenId') mcpTokenId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.mcp.revokeToken(mcpTokenId, user.id);
  }
}

@ApiTags('mcp-tools')
@Controller('mcp-tools')
export class McpToolsController {
  constructor(private readonly mcp: McpService) {}

  @Public()
  @Get('projects')
  async projects(@Headers('authorization') authorization?: string) {
    return this.mcp.listProjects(
      await this.mcp.authorize(authorization, 'list_projects'),
    );
  }

  @Public()
  @Get('projects/:projectId/summary')
  async summary(
    @Param('projectId') projectId: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.mcp.projectSummary(
      await this.mcp.authorize(authorization, 'get_project_summary'),
      projectId,
    );
  }

  @Public()
  @Get('projects/:projectId/tasks')
  async tasks(
    @Param('projectId') projectId: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.mcp.listTasks(
      await this.mcp.authorize(authorization, 'list_quiz_tasks'),
      projectId,
    );
  }

  @Public()
  @Get('projects/:projectId/tasks/:assignmentId/results')
  async results(
    @Param('projectId') projectId: string,
    @Param('assignmentId') assignmentId: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.mcp.taskResults(
      await this.mcp.authorize(authorization, 'get_task_results'),
      projectId,
      assignmentId,
    );
  }

  @Public()
  @Get('projects/:projectId/students/:studentId/performance')
  async performance(
    @Param('projectId') projectId: string,
    @Param('studentId') studentId: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.mcp.studentPerformance(
      await this.mcp.authorize(authorization, 'get_student_performance'),
      projectId,
      studentId,
    );
  }
}
