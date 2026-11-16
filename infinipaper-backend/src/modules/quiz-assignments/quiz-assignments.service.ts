import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import type {
  CreateAssignmentDto,
  GradeAnswerDto,
  SaveAnswerDto,
} from './dto/assignment.dto.js';

@Injectable()
export class QuizAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async create(quizId: string, userId: string, dto: CreateAssignmentDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { resource: { include: { folder: true } } },
    });
    if (!quiz) {
      throw this.notFound('QUIZ_NOT_FOUND', 'Cuestionario no encontrado');
    }
    await this.permissions.assertProjectRole(
      userId,
      quiz.resource.folder.projectId,
      'editor',
    );

    const studentIds = [...new Set(dto.studentIds)];
    const students = await this.prisma.projectMember.findMany({
      where: {
        projectId: quiz.resource.folder.projectId,
        userId: { in: studentIds },
        role: 'STUDENT',
      },
      select: { userId: true },
    });
    if (students.length !== studentIds.length) {
      throw new AppException(
        'INVALID_STUDENTS',
        'Todos los estudiantes deben pertenecer al proyecto con rol STUDENT',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.prisma.quizAssignment.create({
      data: {
        quizId,
        projectId: quiz.resource.folder.projectId,
        createdById: userId,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        attemptsAllowed: dto.attemptsAllowed ?? 1,
        students: { create: studentIds.map((studentId) => ({ studentId })) },
      },
      include: { quiz: true, students: true },
    });
  }

  async publish(assignmentId: string, userId: string) {
    const assignment = await this.assertManager(assignmentId, userId);
    if (assignment.quiz.status !== 'PUBLISHED') {
      throw new AppException(
        'QUIZ_NOT_PUBLISHED',
        'Publica el cuestionario antes de asignarlo',
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.quizAssignment.update({
      where: { id: assignmentId },
      data: { status: 'PUBLISHED' },
    });
  }

  async close(assignmentId: string, userId: string) {
    await this.assertManager(assignmentId, userId);
    return this.prisma.quizAssignment.update({
      where: { id: assignmentId },
      data: { status: 'CLOSED' },
    });
  }

  async listMine(studentId: string) {
    const assignments = await this.prisma.quizAssignment.findMany({
      where: {
        status: { in: ['PUBLISHED', 'CLOSED'] },
        students: { some: { studentId } },
      },
      include: {
        quiz: { include: { resource: true } },
        attempts: { where: { studentId }, orderBy: { attemptNumber: 'desc' } },
      },
      orderBy: { dueAt: 'asc' },
    });
    return assignments;
  }

  async listByProject(projectId: string, userId: string) {
    await this.permissions.assertProjectRole(userId, projectId, 'editor');
    return this.prisma.quizAssignment.findMany({
      where: { projectId },
      include: {
        quiz: { include: { resource: true } },
        _count: { select: { students: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForStudent(assignmentId: string, studentId: string) {
    const assignment = await this.loadAssignment(assignmentId);
    if (!assignment.students.some((student) => student.studentId === studentId)) {
      throw new AppException(
        'TASK_NOT_ASSIGNED',
        'No tienes esta tarea asignada',
        HttpStatus.FORBIDDEN,
      );
    }
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { assignmentId, studentId },
      include: { answers: true },
      orderBy: { attemptNumber: 'desc' },
    });
    return {
      ...assignment,
      quiz: this.sanitizeQuiz(assignment.quiz),
      attempts,
    };
  }

  async startAttempt(assignmentId: string, studentId: string) {
    const assignment = await this.loadAssignment(assignmentId);
    if (assignment.status !== 'PUBLISHED') {
      throw new AppException(
        'TASK_CLOSED',
        'La tarea no está publicada',
        HttpStatus.CONFLICT,
      );
    }
    if (assignment.quiz.status !== 'PUBLISHED') {
      throw new AppException(
        'QUIZ_NOT_PUBLISHED',
        'El cuestionario no está publicado',
        HttpStatus.CONFLICT,
      );
    }
    if (assignment.startsAt && assignment.startsAt.getTime() > Date.now()) {
      throw new AppException(
        'TASK_NOT_STARTED',
        'La tarea aún no ha comenzado',
        HttpStatus.CONFLICT,
      );
    }
    if (assignment.dueAt && assignment.dueAt.getTime() < Date.now()) {
      throw new AppException(
        'TASK_CLOSED',
        'La tarea ya cerró',
        HttpStatus.CONFLICT,
      );
    }
    const assigned = assignment.students.some(
      (student) => student.studentId === studentId,
    );
    if (!assigned) {
      throw new AppException(
        'TASK_NOT_ASSIGNED',
        'No tienes esta tarea asignada',
        HttpStatus.FORBIDDEN,
      );
    }

    const attempts = await this.prisma.quizAttempt.count({
      where: { assignmentId, studentId },
    });
    if (attempts >= assignment.attemptsAllowed) {
      throw new AppException(
        'ATTEMPT_LIMIT_REACHED',
        'Ya usaste todos los intentos disponibles',
        HttpStatus.CONFLICT,
      );
    }

    const maxScore = assignment.quiz.questions.reduce(
      (total, question) => total + question.points,
      0,
    );
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        assignmentId,
        studentId,
        attemptNumber: attempts + 1,
        maxScore,
      },
    });
    return { attempt, quiz: this.sanitizeQuiz(assignment.quiz) };
  }

  async saveAnswer(
    attemptId: string,
    studentId: string,
    dto: SaveAnswerDto,
  ) {
    const attempt = await this.loadAttempt(attemptId);
    this.assertOwner(attempt.studentId, studentId);
    if (attempt.status !== 'IN_PROGRESS') {
      throw new AppException(
        'ATTEMPT_SUBMITTED',
        'El intento ya fue enviado',
        HttpStatus.CONFLICT,
      );
    }
    const question = attempt.assignment.quiz.questions.find(
      (item) => item.id === dto.questionId,
    );
    if (!question) {
      throw new AppException(
        'QUESTION_NOT_FOUND',
        'Pregunta no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    if (dto.optionId) {
      const option = question.options.find((item) => item.id === dto.optionId);
      if (!option) {
        throw new AppException(
          'OPTION_NOT_FOUND',
          'Opción no encontrada',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    return this.prisma.quizAnswer.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId: dto.questionId },
      },
      create: {
        attemptId,
        questionId: dto.questionId,
        optionId: dto.optionId ?? null,
        text: dto.text?.trim() || null,
      },
      update: {
        optionId: dto.optionId ?? null,
        text: dto.text?.trim() || null,
      },
    });
  }

  async submit(attemptId: string, studentId: string) {
    const attempt = await this.loadAttempt(attemptId);
    this.assertOwner(attempt.studentId, studentId);
    if (attempt.status !== 'IN_PROGRESS') {
      throw new AppException(
        'ATTEMPT_SUBMITTED',
        'El intento ya fue enviado',
        HttpStatus.CONFLICT,
      );
    }

    let hasManual = false;
    let score = 0;
    for (const question of attempt.assignment.quiz.questions) {
      const answer = attempt.answers.find(
        (item) => item.questionId === question.id,
      );
      if (question.type === 'SHORT_ANSWER') {
        hasManual = true;
        if (answer) {
          await this.prisma.quizAnswer.update({
            where: { id: answer.id },
            data: { isCorrect: null, pointsAwarded: null },
          });
        }
        continue;
      }

      const correct = question.options.find((option) => option.isCorrect);
      const isCorrect = Boolean(
        answer?.optionId && correct && answer.optionId === correct.id,
      );
      const points = isCorrect ? question.points : 0;
      score += points;
      if (answer) {
        await this.prisma.quizAnswer.update({
          where: { id: answer.id },
          data: { isCorrect, pointsAwarded: points },
        });
      } else {
        await this.prisma.quizAnswer.create({
          data: {
            attemptId,
            questionId: question.id,
            isCorrect: false,
            pointsAwarded: 0,
          },
        });
      }
    }

    return this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        status: hasManual ? 'SUBMITTED' : 'GRADED',
        score,
        submittedAt: new Date(),
        gradedAt: hasManual ? null : new Date(),
      },
      include: { answers: true },
    });
  }

  async getAttempt(attemptId: string, userId: string) {
    const attempt = await this.loadAttempt(attemptId);
    if (attempt.studentId !== userId) {
      await this.permissions.assertProjectRole(
        userId,
        attempt.assignment.projectId,
        'editor',
      );
    }
    const resultsVisible = Boolean(attempt.assignment.resultsPublishedAt);
    return {
      attempt,
      quiz:
        resultsVisible || attempt.studentId !== userId
          ? attempt.assignment.quiz
          : this.sanitizeQuiz(attempt.assignment.quiz),
      resultsVisible,
    };
  }

  async results(assignmentId: string, userId: string) {
    await this.assertManager(assignmentId, userId);
    const assignment = await this.prisma.quizAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: {
        quiz: { include: { questions: { include: { options: true } } } },
        students: { include: { student: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        attempts: {
          include: { answers: true },
          orderBy: { startedAt: 'asc' },
        },
      },
    });
    return assignment;
  }

  async publishResults(assignmentId: string, userId: string) {
    await this.assertManager(assignmentId, userId);
    return this.prisma.quizAssignment.update({
      where: { id: assignmentId },
      data: { resultsPublishedAt: new Date() },
    });
  }

  async gradeAnswer(
    attemptId: string,
    answerId: string,
    userId: string,
    dto: GradeAnswerDto,
  ) {
    const attempt = await this.loadAttempt(attemptId);
    await this.permissions.assertProjectRole(
      userId,
      attempt.assignment.projectId,
      'editor',
    );
    const answer = attempt.answers.find((item) => item.id === answerId);
    const question = attempt.assignment.quiz.questions.find(
      (item) => item.id === answer?.questionId,
    );
    if (!answer || !question) {
      throw new AppException(
        'ANSWER_NOT_FOUND',
        'Respuesta no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }
    if (question.type !== 'SHORT_ANSWER') {
      throw new AppException(
        'INVALID_GRADING',
        'Solo las respuestas cortas requieren calificación manual',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (dto.points > question.points) {
      throw new AppException(
        'INVALID_GRADING',
        'El puntaje supera el máximo de la pregunta',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.prisma.quizAnswer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: dto.points,
        isCorrect: dto.points >= question.points,
        feedback: dto.feedback?.trim() || null,
      },
    });

    const answers = await this.prisma.quizAnswer.findMany({
      where: { attemptId },
    });
    const questions = attempt.assignment.quiz.questions;
    const allGraded = questions.every((item) => {
      const current = answers.find((entry) => entry.questionId === item.id);
      return current?.pointsAwarded !== null && current?.pointsAwarded !== undefined;
    });
    const score = answers.reduce(
      (total, item) => total + (item.pointsAwarded ?? 0),
      0,
    );
    return this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        ...(allGraded ? { status: 'GRADED', gradedAt: new Date() } : {}),
      },
      include: { answers: true },
    });
  }

  private async loadAssignment(assignmentId: string) {
    const assignment = await this.prisma.quizAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
        students: true,
      },
    });
    if (!assignment) {
      throw this.notFound(
        'ASSIGNMENT_NOT_FOUND',
        'Tarea no encontrada',
      );
    }
    return assignment;
  }

  private async loadAttempt(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        assignment: {
          include: {
            quiz: {
              include: {
                questions: {
                  include: { options: { orderBy: { order: 'asc' } } },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });
    if (!attempt) {
      throw this.notFound('ATTEMPT_NOT_FOUND', 'Intento no encontrado');
    }
    return attempt;
  }

  private async assertManager(assignmentId: string, userId: string) {
    const assignment = await this.loadAssignment(assignmentId);
    await this.permissions.assertProjectRole(
      userId,
      assignment.projectId,
      'editor',
    );
    return assignment;
  }

  private assertOwner(ownerId: string, userId: string): void {
    if (ownerId !== userId) {
      throw new AppException(
        'ATTEMPT_FORBIDDEN',
        'No puedes acceder a este intento',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private sanitizeQuiz(
    quiz: Awaited<ReturnType<QuizAssignmentsService['loadAssignment']>>['quiz'],
  ) {
    return {
      ...quiz,
      questions: quiz.questions.map((question) => ({
        ...question,
        correctText: null,
        options: question.options.map((option) => ({
          ...option,
          isCorrect: false,
        })),
      })),
    };
  }

  private notFound(code: string, message: string): AppException {
    return new AppException(code, message, HttpStatus.NOT_FOUND);
  }
}
