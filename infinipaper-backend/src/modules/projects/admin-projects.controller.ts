import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('admin')
@Controller('admin/projects')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post('purge-expired')
  purgeExpired() {
    return this.projects.purgeExpired();
  }
}
