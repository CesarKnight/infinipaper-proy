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
import {
  CreateTranscriptionDto,
  SaveNoteDto,
} from './dto/transcription.dto.js';
import { TranscriptionsService } from './transcriptions.service.js';

@ApiTags('transcriptions')
@Controller()
@UseGuards(ProjectAccessGuard)
export class TranscriptionsController {
  constructor(private readonly transcriptions: TranscriptionsService) {}

  @Post('files/:fileId/transcriptions')
  @RequireProjectRole('editor')
  create(
    @Param('fileId') fileId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateTranscriptionDto,
  ) {
    return this.transcriptions.create(fileId, user.id, dto);
  }

  @Get('projects/:projectId/transcriptions')
  @RequireProjectRole('editor')
  listByProject(@Param('projectId') projectId: string) {
    return this.transcriptions.listByProject(projectId);
  }

  @Get('transcriptions/:transcriptionId')
  @RequireProjectRole('editor')
  get(@Param('transcriptionId') id: string) {
    return this.transcriptions.get(id);
  }

  @Post('transcriptions/:transcriptionId/note')
  @RequireProjectRole('editor')
  saveAsNote(
    @Param('transcriptionId') id: string,
    @CurrentUser() user: User,
    @Body() dto: SaveNoteDto,
  ) {
    return this.transcriptions.saveAsNote(id, user.id, dto);
  }
}
