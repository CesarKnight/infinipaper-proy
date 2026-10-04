import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequireProjectRole } from '../../common/decorators/require-project-role.decorator.js';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { MembersService } from './members.service.js';

@ApiTags('members')
@Controller('projects/:projectId/members')
@UseGuards(ProjectAccessGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @RequireProjectRole('viewer')
  list(@Param('projectId') projectId: string) {
    return this.members.list(projectId);
  }

  @Post()
  @RequireProjectRole('owner')
  add(@Param('projectId') projectId: string, @Body() dto: AddMemberDto) {
    return this.members.add(projectId, dto);
  }

  @Patch(':userId')
  @RequireProjectRole('owner')
  updateRole(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.members.updateRole(projectId, userId, dto);
  }

  @Delete(':userId')
  @RequireProjectRole('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.members.remove(projectId, userId);
  }
}
