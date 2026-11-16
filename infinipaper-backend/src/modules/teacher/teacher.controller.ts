import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { User } from '../../generated/prisma/client.js';
import { TeacherRequestDto } from './dto/teacher-request.dto.js';
import { TeacherService } from './teacher.service.js';

@ApiTags('teacher')
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacher: TeacherService) {}

  @Get('verification')
  getMine(@CurrentUser() user: User) {
    return this.teacher.getMine(user.id);
  }

  @Post('verification')
  request(@CurrentUser() user: User, @Body() dto: TeacherRequestDto) {
    return this.teacher.request(user.id, dto);
  }
}
