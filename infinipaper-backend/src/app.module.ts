import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './common/config/env.validation.js';
import { EmailModule } from './common/email/email.module.js';
import { AuthGuard } from './common/guards/auth.guard.js';
import { ProjectAccessGuard } from './common/guards/project-access.guard.js';
import { PermissionsModule } from './common/permissions/permissions.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { StorageModule } from './common/storage/storage.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ContentGenerationModule } from './modules/content-generation/content-generation.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { FoldersModule } from './modules/folders/folders.module.js';
import { MembersModule } from './modules/members/members.module.js';
import { NoteStructureModule } from './modules/note-structure/note-structure.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { ProvenanceModule } from './modules/provenance/provenance.module.js';
import { QuizAssignmentsModule } from './modules/quiz-assignments/quiz-assignments.module.js';
import { QuizzesModule } from './modules/quizzes/quizzes.module.js';
import { ResourcesModule } from './modules/resources/resources.module.js';
import { SystemModule } from './modules/system/system.module.js';
import { TeacherModule } from './modules/teacher/teacher.module.js';
import { TranscriptionsModule } from './modules/transcriptions/transcriptions.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    StorageModule,
    PermissionsModule,
    EmailModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    AnalyticsModule,
    ProjectsModule,
    FoldersModule,
    ResourcesModule,
    ProvenanceModule,
    MembersModule,
    NoteStructureModule,
    QuizzesModule,
    QuizAssignmentsModule,
    ContentGenerationModule,
    TeacherModule,
    TranscriptionsModule,
    SystemModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ProjectAccessGuard },
  ],
})
export class AppModule {}
