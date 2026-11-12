import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { ApplyStructureJobDto } from './dto/apply-structure-job.dto.js';
import { CreateStructureJobDto } from './dto/create-structure-job.dto.js';
import { NoteStructureService } from './note-structure.service.js';

@ApiTags('note-structure')
@Controller()
@UseGuards(ProjectAccessGuard)
export class NoteStructureController {
  constructor(private readonly noteStructure: NoteStructureService) {}

  @Post('files/:fileId/structure')
  @RequireProjectRole('editor')
  create(
    @Param('fileId') fileId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateStructureJobDto,
  ) {
    return this.noteStructure.createJob(fileId, user.id, dto);
  }

  @Get('structure-jobs/:jobId')
  @RequireProjectRole('editor')
  get(@Param('jobId') jobId: string) {
    return this.noteStructure.getJob(jobId);
  }

  @Post('structure-jobs/:jobId/apply')
  @RequireProjectRole('editor')
  apply(
    @Param('jobId') jobId: string,
    @CurrentUser() user: User,
    @Body() dto: ApplyStructureJobDto,
  ) {
    return this.noteStructure.apply(jobId, user.id, dto);
  }
}
