import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SearchService } from './search.service.js';

@ApiTags('search')
@Controller('projects/:projectId/search')
@UseGuards(ProjectAccessGuard)
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @RequireProjectRole('viewer')
  query(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query() dto: SearchQueryDto,
  ) {
    return this.search.search(projectId, user.id, dto);
  }

  @Post('reindex')
  @RequireProjectRole('editor')
  @HttpCode(HttpStatus.ACCEPTED)
  reindex(@Param('projectId') projectId: string, @CurrentUser() user: User) {
    return this.search.reindexProject(projectId, user.id);
  }

  @Get('status')
  @RequireProjectRole('editor')
  status(@Param('projectId') projectId: string, @CurrentUser() user: User) {
    return this.search.status(projectId, user.id);
  }
}
