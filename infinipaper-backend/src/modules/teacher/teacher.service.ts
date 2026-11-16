import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception.js';
import { EmailService } from '../../common/email/email.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { TeacherRequestDto } from './dto/teacher-request.dto.js';

const TEACHER_USER_SELECT = {
  select: {
    id: true,
    username: true,
    email: true,
    displayName: true,
    avatarUrl: true,
    role: true,
    emailVerifiedAt: true,
  },
} as const;

@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  getMine(userId: string) {
    return this.prisma.teacherProfile.findUnique({ where: { userId } });
  }

  async request(userId: string, dto: TeacherRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, emailVerifiedAt: true },
    });
    if (!user) {
      throw new AppException('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    if (!user.emailVerifiedAt) {
      throw new AppException(
        'EMAIL_NOT_VERIFIED',
        'Confirma tu correo antes de solicitar la verificación docente',
        HttpStatus.FORBIDDEN,
      );
    }
    if (user.role === 'ADMIN') {
      throw new AppException(
        'ADMIN_CANNOT_REQUEST_TEACHER',
        'Un administrador no necesita verificación docente',
        HttpStatus.CONFLICT,
      );
    }

    const existing = await this.prisma.teacherProfile.findUnique({
      where: { userId },
    });
    if (existing?.status === 'PENDING' || existing?.status === 'VERIFIED') {
      return existing;
    }

    const institutional = this.isInstitutionalEmail(user.email);
    const status = institutional ? 'VERIFIED' : 'PENDING';
    const method = institutional ? 'INSTITUTIONAL_EMAIL' : 'MANUAL';
    const profile = await this.prisma.teacherProfile.upsert({
      where: { userId },
      create: {
        userId,
        status,
        method,
        institution: dto.institution.trim(),
        area: dto.area?.trim() || null,
        position: dto.position?.trim() || null,
        evidenceUrl: dto.evidenceUrl ?? null,
        reviewedAt: institutional ? new Date() : null,
      },
      update: {
        status,
        method,
        institution: dto.institution.trim(),
        area: dto.area?.trim() || null,
        position: dto.position?.trim() || null,
        evidenceUrl: dto.evidenceUrl ?? null,
        rejectionReason: null,
        reviewerId: null,
        reviewedAt: institutional ? new Date() : null,
      },
    });

    if (institutional) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: 'TEACHER' },
      });
    }

    await this.audit(
      userId,
      institutional ? 'TEACHER_AUTO_VERIFIED' : 'TEACHER_REQUESTED',
      profile.id,
      { method },
    );
    return profile;
  }

  list(status?: string) {
    return this.prisma.teacherProfile.findMany({
      where:
        status && ['PENDING', 'VERIFIED', 'REJECTED', 'REVOKED'].includes(status)
          ? { status: status as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REVOKED' }
          : {},
      include: { user: TEACHER_USER_SELECT },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async approve(id: string, reviewerId: string, reason?: string) {
    const profile = await this.getProfile(id);
    const updated = await this.prisma.$transaction(async (tx) => {
      const teacher = await tx.teacherProfile.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          reviewerId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });
      await tx.user.update({
        where: { id: profile.userId },
        data: { role: 'TEACHER' },
      });
      return teacher;
    });

    await this.audit(reviewerId, 'TEACHER_APPROVED', id, { reason });
    void this.email
      .sendTeacherDecision(profile.user.email, true, reason)
      .catch((error: Error) =>
        this.logger.warn(`No se pudo notificar al docente: ${error.message}`),
      );
    return updated;
  }

  async reject(id: string, reviewerId: string, reason: string) {
    const profile = await this.getProfile(id);
    const updated = await this.prisma.$transaction(async (tx) => {
      const teacher = await tx.teacherProfile.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewerId,
          reviewedAt: new Date(),
          rejectionReason: reason.trim(),
        },
      });
      await tx.user.update({
        where: { id: profile.userId },
        data: { role: 'STUDENT' },
      });
      return teacher;
    });

    await this.audit(reviewerId, 'TEACHER_REJECTED', id, { reason });
    void this.email
      .sendTeacherDecision(profile.user.email, false, reason)
      .catch((error: Error) =>
        this.logger.warn(`No se pudo notificar al docente: ${error.message}`),
      );
    return updated;
  }

  async revoke(userId: string, reviewerId: string, reason: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      include: { user: TEACHER_USER_SELECT },
    });
    if (!profile) {
      throw new AppException(
        'TEACHER_NOT_FOUND',
        'Perfil docente no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    const days = this.config.get<number>('PROJECT_ARCHIVE_ACCESS_DAYS') ?? 30;
    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.teacherProfile.update({
        where: { userId },
        data: {
          status: 'REVOKED',
          reviewerId,
          reviewedAt: now,
          rejectionReason: reason.trim(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: 'STUDENT' },
      }),
      this.prisma.project.updateMany({
        where: { ownerId: userId, type: 'COURSE', status: 'ACTIVE' },
        data: { status: 'ARCHIVED', archivedAt: now, archiveAccessUntil: until },
      }),
    ]);

    await this.audit(reviewerId, 'TEACHER_REVOKED', profile.id, { reason });
    void this.email
      .sendTeacherDecision(profile.user.email, false, reason)
      .catch((error: Error) =>
        this.logger.warn(`No se pudo notificar al docente: ${error.message}`),
      );
    return profile;
  }

  private async getProfile(id: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id },
      include: { user: TEACHER_USER_SELECT },
    });
    if (!profile) {
      throw new AppException(
        'TEACHER_NOT_FOUND',
        'Perfil docente no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    return profile;
  }

  private isInstitutionalEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    const allowed = (this.config.get<string>('TEACHER_INSTITUTION_DOMAINS') ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    return Boolean(domain) && allowed.includes(domain);
  }

  private audit(
    actorId: string,
    action: string,
    entityId: string,
    metadata: Record<string, unknown>,
  ): Promise<unknown> {
    return this.prisma.auditEvent.create({
      data: {
        actorId,
        action,
        entityType: 'TeacherProfile',
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}
