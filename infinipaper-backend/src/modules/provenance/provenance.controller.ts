import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { ValidateResourceDto } from './dto/provenance.dto.js';
import { ProvenanceService } from './provenance.service.js';

@ApiTags('provenance')
@Controller()
@UseGuards(ProjectAccessGuard)
export class ProvenanceController {
  constructor(private readonly provenance: ProvenanceService) {}

  @Get('files/:fileId/provenance')
  @RequireProjectRole('viewer')
  get(@Param('fileId') fileId: string) {
    return this.provenance.get(fileId);
  }

  @Post('files/:fileId/validate')
  @RequireProjectRole('editor')
  validate(
    @Param('fileId') fileId: string,
    @CurrentUser() user: User,
    @Body() dto: ValidateResourceDto,
  ) {
    return this.provenance.validate(fileId, user.id, dto);
  }
}
