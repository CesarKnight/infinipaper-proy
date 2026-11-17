import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import type { AnalyticsQueryDto } from './dto/analytics-query.dto.js';

const ACTIVE_ATTEMPT = ['SUBMITTED', 'GRADED'] as const;

interface ScoreRow {
  studentId: string;
  assignmentId: string;
  score: number;
  maxScore: number;
  percentage: number;
}

@Injectable()
export class AnalyticsService {
  private readonly riskThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    config: ConfigService,
  ) {
    this.riskThreshold = config.get<number>('PROJECT_RISK_THRESHOLD') ?? 70;
  }

  async getPanel(projectId: string, userId: string, dto: AnalyticsQueryDto) {
    await this.permissions.assertProjectRole(userId, projectId, 'editor');
    return this.build(projectId, dto);
  }

  async getTasks(projectId: string, userId: string, dto: AnalyticsQueryDto) {
    const panel = await this.getPanel(projectId, userId, dto);
    return panel.tasks;
  }

  async getStudents(
    projectId: string,
    userId: string,
    dto: AnalyticsQueryDto,
  ) {
    const panel = await this.getPanel(projectId, userId, dto);
    return panel.students;
  }

  async exportCsv(
    projectId: string,
    userId: string,
    dto: AnalyticsQueryDto,
  ): Promise<string> {
    const panel = await this.getPanel(projectId, userId, dto);
    const lines = [
      'estudiante,usuario,promedio,completadas,pendientes,riesgo,motivo',
      ...panel.students.map((student) =>
        [
          csv(student.displayName),
          csv(student.username),
          student.average?.toFixed(2) ?? '',
          student.completed,
          student.pending,
          student.atRisk ? 'si' : 'no',
          csv(student.riskReason ?? ''),
        ].join(','),
      ),
    ];
    return lines.join('\n');
  }

  async myProgress(projectId: string, userId: string) {
    const role = await this.permissions.resolveRole(userId, {
      id: projectId,
      ownerId: '',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
    } as never);
    if (!role) {
      throw new AppException(
        'PROJECT_FORBIDDEN',
        'No tienes acceso a este proyecto',
        HttpStatus.FORBIDDEN,
      );
    }

    const assignments = await this.prisma.quizAssignment.findMany({
      where: {
        projectId,
        status: { in: ['PUBLISHED', 'CLOSED'] },
        students: { some: { studentId: userId } },
      },
      include: {
        quiz: { select: { id: true, title: true } },
        attempts: {
          where: { studentId: userId },
          orderBy: { attemptNumber: 'desc' },
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            score: true,
            maxScore: true,
            submittedAt: true,
            gradedAt: true,
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });

    return {
      assignments: assignments.map((assignment) => {
        const latest = assignment.attempts[0] ?? null;
        return {
          id: assignment.id,
          title: assignment.quiz.title,
          dueAt: assignment.dueAt,
          status: assignment.status,
          attemptsAllowed: assignment.attemptsAllowed,
          latestAttempt: latest,
          completed: Boolean(
            latest && ['SUBMITTED', 'GRADED'].includes(latest.status),
          ),
        };
      }),
    };
  }

  private async build(projectId: string, dto: AnalyticsQueryDto) {
    const from = dto.from ? new Date(dto.from) : undefined;
    const to = dto.to ? new Date(dto.to) : undefined;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        members: {
          where: {
            role: 'STUDENT',
            ...(dto.studentId ? { userId: dto.studentId } : {}),
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
    if (!project) {
      throw new AppException(
        'PROJECT_NOT_FOUND',
        'Proyecto no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    if (dto.studentId && project.members.length === 0) {
      throw new AppException(
        'INVALID_FILTER',
        'El estudiante no pertenece al proyecto',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const assignments = await this.prisma.quizAssignment.findMany({
      where: {
        projectId,
        ...(dto.assignmentId ? { id: dto.assignmentId } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      include: {
        quiz: {
          select: {
            title: true,
            questions: {
              select: {
                id: true,
                prompt: true,
                points: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        students: {
          ...(dto.studentId
            ? { where: { studentId: dto.studentId } }
            : {}),
          select: { studentId: true },
        },
        attempts: {
          ...(dto.studentId
            ? { where: { studentId: dto.studentId } }
            : {}),
          include: { answers: true },
          orderBy: { attemptNumber: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    type Attempt = (typeof assignments)[number]['attempts'][number];
    if (dto.assignmentId && assignments.length === 0) {
      throw new AppException(
        'INVALID_FILTER',
        'La tarea no pertenece al proyecto',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const latest = new Map<string, Attempt>();
    const activeLatest = new Map<string, Attempt>();
    for (const assignment of assignments) {
      for (const attempt of assignment.attempts) {
        const key = `${assignment.id}:${attempt.studentId}`;
        if (!latest.has(key)) latest.set(key, attempt);
        if (
          !activeLatest.has(key) &&
          ACTIVE_ATTEMPT.includes(attempt.status as never)
        ) {
          activeLatest.set(key, attempt);
        }
      }
    }

    const scores: ScoreRow[] = [];
    for (const attempt of activeLatest.values()) {
      const maxScore = attempt.maxScore || 0;
      scores.push({
        studentId: attempt.studentId,
        assignmentId: attempt.assignmentId,
        score: attempt.score,
        maxScore,
        percentage: maxScore > 0 ? (attempt.score / maxScore) * 100 : 0,
      });
    }

    const percentages = scores.map((row) => row.percentage).sort((a, b) => a - b);
    const summaryScores = {
      average: percentages.length
        ? round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
        : null,
      median: percentages.length
        ? round(percentages[Math.floor(percentages.length / 2)])
        : null,
      min: percentages.length ? round(percentages[0]) : null,
      max: percentages.length
        ? round(percentages[percentages.length - 1])
        : null,
    };

    const expected = assignments.reduce(
      (total, assignment) => total + assignment.students.length,
      0,
    );
    const completed = assignments.reduce(
      (total, assignment) =>
        total +
        assignment.students.filter((student) =>
          activeLatest.has(`${assignment.id}:${student.studentId}`),
        ).length,
      0,
    );

    const tasks = assignments.map((assignment) => {
      const rows = scores.filter((row) => row.assignmentId === assignment.id);
      const assigned = assignment.students.length;
      const completedRows = assignment.students.filter((student) =>
        activeLatest.has(`${assignment.id}:${student.studentId}`),
      ).length;
      const pendingGrading = assignment.attempts.filter(
        (attempt) => attempt.status === 'SUBMITTED',
      ).length;
      return {
        id: assignment.id,
        title: assignment.quiz.title,
        status: assignment.status,
        dueAt: assignment.dueAt,
        assigned,
        completed: completedRows,
        completion: assigned ? round((completedRows / assigned) * 100) : 0,
        average: rows.length
          ? round(rows.reduce((total, row) => total + row.percentage, 0) / rows.length)
          : null,
        pendingGrading,
      };
    });

    const studentRows = project.members.map((member) => {
      const rows = scores.filter((row) => row.studentId === member.userId);
      const assigned = assignments.filter((assignment) =>
        assignment.students.some(
          (student) => student.studentId === member.userId,
        ),
      ).length;
      const completed = rows.length;
      const pending = Math.max(0, assigned - completed);
      const average = rows.length
        ? round(rows.reduce((total, row) => total + row.percentage, 0) / rows.length)
        : null;
      const atRisk =
        (average !== null && average < this.riskThreshold) || pending > 0;
      const reasons: string[] = [];
      if (average !== null && average < this.riskThreshold) {
        reasons.push(`Promedio bajo (${average.toFixed(1)}%)`);
      }
      if (pending > 0) reasons.push(`${pending} tarea(s) pendiente(s)`);
      return {
        studentId: member.userId,
        username: member.user.username,
        displayName: member.user.displayName,
        assigned,
        completed,
        pending,
        average,
        atRisk,
        riskReason: reasons.join('; ') || null,
      };
    });

    const questionStats = new Map<
      string,
      { prompt: string; answered: number; correct: number }
    >();
    for (const assignment of assignments) {
      for (const question of assignment.quiz.questions) {
        const entry = questionStats.get(question.id) ?? {
          prompt: question.prompt,
          answered: 0,
          correct: 0,
        };
        for (const attempt of assignment.attempts) {
          if (!ACTIVE_ATTEMPT.includes(attempt.status as never)) continue;
          const answer = attempt.answers.find(
            (item) => item.questionId === question.id,
          );
          if (!answer) continue;
          entry.answered += 1;
          if (answer.isCorrect === true) entry.correct += 1;
        }
        questionStats.set(question.id, entry);
      }
    }

    return {
      filters: {
        assignmentId: dto.assignmentId ?? null,
        studentId: dto.studentId ?? null,
        from: dto.from ?? null,
        to: dto.to ?? null,
      },
      summary: {
        students: project.members.length,
        activeStudents: studentRows.filter((student) => student.completed > 0).length,
        pendingStudents: studentRows.filter((student) => student.pending > 0).length,
        assignments: assignments.length,
        publishedAssignments: assignments.filter(
          (assignment) => assignment.status === 'PUBLISHED',
        ).length,
        closedAssignments: assignments.filter(
          (assignment) => assignment.status === 'CLOSED',
        ).length,
        pendingGrading: tasks.reduce(
          (total, task) => total + task.pendingGrading,
          0,
        ),
        completion: expected ? round((completed / expected) * 100) : 0,
        riskThreshold: this.riskThreshold,
        ...summaryScores,
        distribution: distribution(percentages),
      },
      tasks,
      students: studentRows,
      questions: [...questionStats.entries()].map(([id, value]) => ({
        id,
        prompt: value.prompt,
        answered: value.answered,
        correct: value.correct,
        accuracy: value.answered
          ? round((value.correct / value.answered) * 100)
          : null,
      })),
    };
  }
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function distribution(values: number[]) {
  const buckets = [
    { label: '0-59', min: 0, max: 59.999 },
    { label: '60-69', min: 60, max: 69.999 },
    { label: '70-79', min: 70, max: 79.999 },
    { label: '80-89', min: 80, max: 89.999 },
    { label: '90-100', min: 90, max: 100 },
  ];
  return buckets.map((bucket) => ({
    label: bucket.label,
    count: values.filter(
      (value) => value >= bucket.min && value <= bucket.max,
    ).length,
  }));
}

function csv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
