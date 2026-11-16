import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import type { User } from '../../generated/prisma/client.js';
import { TeacherReviewDto } from './dto/teacher-review.dto.js';
import { TeacherService } from './teacher.service.js';

@ApiTags('admin')
@Controller('admin/teacher-verifications')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminTeacherController {
  constructor(private readonly teacher: TeacherService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.teacher.list(status);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: TeacherReviewDto,
  ) {
    return this.teacher.approve(id, user.id, dto.reason);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: TeacherReviewDto,
  ) {
    return this.teacher.reject(id, user.id, dto.reason ?? 'Sin motivo indicado');
  }
}

@ApiTags('admin')
@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly teacher: TeacherService) {}

  @Post(':id/revoke-teacher')
  revoke(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: TeacherReviewDto,
  ) {
    return this.teacher.revoke(id, user.id, dto.reason ?? 'Sin motivo indicado');
  }
}
