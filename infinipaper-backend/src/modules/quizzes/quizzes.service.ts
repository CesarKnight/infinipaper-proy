import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { User } from '../../generated/prisma/client.js';
import type { CreateQuizDto } from './dto/create-quiz.dto.js';
import type { SubmitQuizDto } from './dto/submit-quiz.dto.js';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, user: User, dto: CreateQuizDto) {
    if (!user.isTeacher) {
      throw new AppException(
        'TEACHER_ROLE_REQUIRED',
        'Solo los usuarios con perfil docente confirmado pueden crear cuestionarios',
        HttpStatus.FORBIDDEN,
      );
    }

    for (let i = 0; i < dto.questions.length; i++) {
      const hasCorrect = dto.questions[i].options.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        throw new AppException(
          'QUIZ_MISSING_CORRECT_OPTION',
          `La pregunta #${i + 1} debe tener al menos una opción correcta`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.prisma.quiz.create({
      data: {
        projectId,
        folderId: dto.folderId ?? null,
        creatorId: user.id,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: dto.status ?? 'PUBLISHED',
        questions: {
          create: dto.questions.map((q, index) => ({
            text: q.text.trim(),
            points: q.points ?? 1,
            order: index,
            options: {
              create: q.options.map((opt) => ({
                text: opt.text.trim(),
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: true },
        },
      },
    });
  }

  async findAll(projectId: string, user: User) {
    const quizzes = await this.prisma.quiz.findMany({
      where: {
        projectId,
        ...(user.isTeacher ? {} : { status: 'PUBLISHED' }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true },
        },
        _count: {
          select: { questions: true, submissions: true },
        },
        submissions: {
          where: { userId: user.id },
          select: { id: true, score: true, maxScore: true, submittedAt: true },
        },
      },
    });

    return quizzes.map(({ submissions, ...quiz }) => ({
   ...quiz,
   mySubmission: submissions[0] ?? null,
   }));
}

  async findOne(projectId: string, quizId: string, user: User) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, projectId },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true },
        },
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              select: {
                id: true,
                text: true,
                // Ocultar respuesta correcta si el usuario no es el docente creador
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      throw new AppException(
        'QUIZ_NOT_FOUND',
        'Cuestionario no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (quiz.status !== 'PUBLISHED' && quiz.creatorId !== user.id) {
      throw new AppException(
        'QUIZ_NOT_PUBLISHED',
        'Este cuestionario aún no ha sido publicado',
        HttpStatus.FORBIDDEN,
      );
    }

    const isCreator = quiz.creatorId === user.id;

    return {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          ...(isCreator ? { isCorrect: opt.isCorrect } : {}),
        })),
      })),
    };
  }

  async submit(
    projectId: string,
    quizId: string,
    user: User,
    dto: SubmitQuizDto,
  ) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, projectId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!quiz) {
      throw new AppException(
        'QUIZ_NOT_FOUND',
        'Cuestionario no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    if (quiz.status !== 'PUBLISHED') {
      throw new AppException(
        'QUIZ_NOT_PUBLISHED',
        'No se puede responder un cuestionario en borrador',
        HttpStatus.FORBIDDEN,
      );
    }

    if (quiz.dueDate && new Date() > quiz.dueDate) {
      throw new AppException(
        'QUIZ_EXPIRED',
        'La fecha límite para resolver este cuestionario ha expirado',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const existing = await this.prisma.quizSubmission.findUnique({
      where: { quizId_userId: { quizId, userId: user.id } },
    });

    if (existing) {
      throw new AppException(
        'QUIZ_ALREADY_SUBMITTED',
        'Ya has enviado una resolución para este cuestionario',
        HttpStatus.CONFLICT,
      );
    }

    const answerMap = new Map(
      dto.answers.map((a) => [a.questionId, a.selectedOptionId]),
    );

    let score = 0;
    let maxScore = 0;

    const evaluatedAnswers = quiz.questions.map((question) => {
      maxScore += question.points;
      const selectedOptionId = answerMap.get(question.id);

      if (!selectedOptionId) {
        throw new AppException(
          'QUIZ_INCOMPLETE_ANSWERS',
          `Falta responder la pregunta: "${question.text}"`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const chosenOption = question.options.find(
        (o) => o.id === selectedOptionId,
      );

      if (!chosenOption) {
        throw new AppException(
          'QUIZ_INVALID_OPTION',
          'Una de las opciones seleccionadas no pertenece a la pregunta',
          HttpStatus.BAD_REQUEST,
        );
      }

      const isCorrect = chosenOption.isCorrect;
      if (isCorrect) {
        score += question.points;
      }

      return {
        questionId: question.id,
        selectedOptionId: chosenOption.id,
        isCorrect,
      };
    });

    return this.prisma.quizSubmission.create({
      data: {
        quizId,
        userId: user.id,
        score,
        maxScore,
        answers: {
          create: evaluatedAnswers,
        },
      },
      include: {
        answers: true,
      },
    });
  }

  async getMySubmission(projectId: string, quizId: string, userId: string) {
    const submission = await this.prisma.quizSubmission.findFirst({
      where: { quizId, userId, quiz: { projectId } },
      include: {
        answers: {
          include: {
            question: { select: { id: true, text: true, points: true } },
            selectedOption: { select: { id: true, text: true } },
          },
        },
      },
    });

    if (!submission) {
      throw new AppException(
        'SUBMISSION_NOT_FOUND',
        'Aún no has resuelto este cuestionario',
        HttpStatus.NOT_FOUND,
      );
    }

    return submission;
  }
}
