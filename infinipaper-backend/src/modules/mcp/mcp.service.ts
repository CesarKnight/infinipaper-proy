import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import type { CreateMcpTokenDto } from './dto/mcp-token.dto.js';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private readonly rate = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async createToken(
    projectId: string,
    userId: string,
    dto: CreateMcpTokenDto,
  ) {
    await this.permissions.assertProjectRole(userId, projectId, 'editor');
    const token = `mcp_${randomBytes(32).toString('base64url')}`;
    const created = await this.prisma.mcpToken.create({
      data: {
        ownerId: userId,
        projectId,
        name: dto.name.trim(),
        tokenHash: hashToken(token),
        scopes: (dto.scopes ?? ['performance:read']) as Prisma.InputJsonValue,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        scopes: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    await this.audit(userId, 'MCP_TOKEN_CREATED', created.id, {
      projectId,
      name: created.name,
    });
    return { ...created, token };
  }

  async listTokens(projectId: string, userId: string) {
    await this.permissions.assertProjectRole(userId, projectId, 'editor');
    return this.prisma.mcpToken.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        scopes: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeToken(tokenId: string, userId: string) {
    const token = await this.prisma.mcpToken.findUnique({
      where: { id: tokenId },
      select: { id: true, projectId: true },
    });
    if (!token) {
      throw new AppException(
        'MCP_TOKEN_NOT_FOUND',
        'Token MCP no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.permissions.assertProjectRole(
      userId,
      token.projectId,
      'editor',
    );
    const updated = await this.prisma.mcpToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
      select: { id: true, revokedAt: true },
    });
    await this.audit(userId, 'MCP_TOKEN_REVOKED', tokenId, {
      projectId: token.projectId,
    });
    return updated;
  }

  async authorize(authorization: string | undefined, tool: string) {
    const raw = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';
    if (!raw) {
      throw new AppException(
        'MCP_TOKEN_INVALID',
        'Token MCP inválido',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const token = await this.prisma.mcpToken.findUnique({
      where: { tokenHash: hashToken(raw) },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!token) {
      throw new AppException(
        'MCP_TOKEN_INVALID',
        'Token MCP inválido',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (token.revokedAt) {
      throw new AppException(
        'MCP_TOKEN_REVOKED',
        'Token MCP revocado',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (token.expiresAt && token.expiresAt.getTime() < Date.now()) {
      throw new AppException(
        'MCP_TOKEN_EXPIRED',
        'Token MCP expirado',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const scopes = Array.isArray(token.scopes)
      ? token.scopes.map(String)
      : [];
    if (!scopes.includes('*') && !scopes.includes('performance:read')) {
      throw new AppException(
        'MCP_SCOPE_FORBIDDEN',
        'El token no tiene scope de desempeño',
        HttpStatus.FORBIDDEN,
      );
    }
    this.checkRate(token.id);
    await this.prisma.mcpToken.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });
    await this.audit(null, 'MCP_TOOL_CALLED', token.id, {
      tool,
      projectId: token.projectId,
    });
    return token;
  }

  async listProjects(token: Awaited<ReturnType<McpService['authorize']>>) {
    return [
      {
        id: token.project.id,
        name: token.project.name,
        scopes: token.scopes,
      },
    ];
  }

  async projectSummary(token: Awaited<ReturnType<McpService['authorize']>>, projectId: string) {
    assertScope(token, projectId);
    const [members, assignments, attempts] = await Promise.all([
      this.prisma.projectMember.count({
        where: { projectId, role: 'STUDENT' },
      }),
      this.prisma.quizAssignment.findMany({
        where: { projectId },
        select: { id: true, status: true },
      }),
      this.prisma.quizAttempt.findMany({
        where: { assignment: { projectId } },
        select: { status: true, score: true, maxScore: true },
      }),
    ]);
    const graded = attempts.filter((attempt) =>
      ['SUBMITTED', 'GRADED'].includes(attempt.status),
    );
    const percentages = graded
      .filter((attempt) => attempt.maxScore > 0)
      .map((attempt) => (attempt.score / attempt.maxScore) * 100);
    return {
      projectId,
      students: members,
      assignments: assignments.length,
      publishedAssignments: assignments.filter((a) => a.status === 'PUBLISHED').length,
      attempts: attempts.length,
      average: percentages.length
        ? round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : null,
    };
  }

  async listTasks(token: Awaited<ReturnType<McpService['authorize']>>, projectId: string) {
    assertScope(token, projectId);
    const tasks = await this.prisma.quizAssignment.findMany({
      where: { projectId },
      include: {
        quiz: { select: { title: true } },
        _count: { select: { students: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return tasks.map((task) => ({
      id: task.id,
      title: task.quiz.title,
      status: task.status,
      dueAt: task.dueAt,
      students: task._count.students,
      attempts: task._count.attempts,
    }));
  }

  async taskResults(
    token: Awaited<ReturnType<McpService['authorize']>>,
    projectId: string,
    assignmentId: string,
  ) {
    assertScope(token, projectId);
    const assignment = await this.prisma.quizAssignment.findFirst({
      where: { id: assignmentId, projectId },
      include: {
        quiz: { select: { title: true } },
        students: {
          include: {
            student: { select: { id: true, username: true, displayName: true } },
          },
        },
        attempts: {
          include: { answers: true },
          orderBy: { startedAt: 'asc' },
        },
      },
    });
    if (!assignment) {
      throw new AppException(
        'MCP_SCOPE_FORBIDDEN',
        'Tarea fuera del scope',
        HttpStatus.FORBIDDEN,
      );
    }
    return {
      id: assignment.id,
      title: assignment.quiz.title,
      students: assignment.students.map((student) => ({
        studentId: student.studentId,
        username: student.student.username,
        displayName: student.student.displayName,
      })),
      attempts: assignment.attempts.map((attempt) => ({
        id: attempt.id,
        studentId: attempt.studentId,
        status: attempt.status,
        score: attempt.score,
        maxScore: attempt.maxScore,
        submittedAt: attempt.submittedAt,
      })),
    };
  }

  async studentPerformance(
    token: Awaited<ReturnType<McpService['authorize']>>,
    projectId: string,
    studentId: string,
  ) {
    assertScope(token, projectId);
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: studentId } },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
    });
    if (!member) {
      throw new AppException(
        'MCP_SCOPE_FORBIDDEN',
        'Estudiante fuera del scope',
        HttpStatus.FORBIDDEN,
      );
    }
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { studentId, assignment: { projectId } },
      include: { assignment: { include: { quiz: { select: { title: true } } } } },
      orderBy: { startedAt: 'desc' },
    });
    return {
      studentId,
      username: member.user.username,
      displayName: member.user.displayName,
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        task: attempt.assignment.quiz.title,
        status: attempt.status,
        score: attempt.score,
        maxScore: attempt.maxScore,
      })),
    };
  }

  private checkRate(tokenId: string): void {
    const now = Date.now();
    const current = this.rate.get(tokenId);
    if (!current || current.resetAt < now) {
      this.rate.set(tokenId, { count: 1, resetAt: now + 60_000 });
      return;
    }
    current.count += 1;
    if (current.count > 60) {
      throw new AppException(
        'MCP_RATE_LIMITED',
        'Demasiadas consultas MCP',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private audit(
    actorId: string | null,
    action: string,
    entityId: string,
    metadata: Record<string, unknown>,
  ) {
    return this.prisma.auditEvent.create({
      data: {
        actorId,
        action,
        entityType: 'McpToken',
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function assertScope(
  token: Awaited<ReturnType<McpService['authorize']>>,
  projectId: string,
): void {
  if (token.projectId !== projectId) {
    throw new AppException(
      'MCP_SCOPE_FORBIDDEN',
      'Proyecto fuera del scope',
      HttpStatus.FORBIDDEN,
    );
  }
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
