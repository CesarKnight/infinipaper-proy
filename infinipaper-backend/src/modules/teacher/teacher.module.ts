import { Module } from '@nestjs/common';
import {
  AdminTeacherController,
  AdminUsersController,
} from './admin-teacher.controller.js';
import { TeacherController } from './teacher.controller.js';
import { TeacherService } from './teacher.service.js';

@Module({
  controllers: [
    TeacherController,
    AdminTeacherController,
    AdminUsersController,
  ],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
