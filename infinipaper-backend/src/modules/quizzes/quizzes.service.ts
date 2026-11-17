import {
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PermissionsService } from '../../common/permissions/permissions.service.js';
import { StorageService } from '../../common/storage/storage.service.js';
import type { QuizQuestionInputDto } from './dto/quiz.dto.js';
import type { CreateQuizDto, UpdateQuizDto } from './dto/quiz.dto.js';

const QUIZ_MIME = 'application/vnd.infinipaper.quiz+json';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly permissions: PermissionsService,
  ) {}

  async create(folderId: string, authorId: string, dto: CreateQuizDto) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, projectId: true },
    });
    if (!folder) {
      throw new AppException(
        'FOLDER_NOT_FOUND',
        'Carpeta no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    const name = await this.uniqueResourceName(
      folderId,
      `${dto.title.trim()}.quiz.json`,
    );
    const s3Key = `projects/${folder.projectId}/folders/${folderId}/${randomUUID()}/${name}`;
    const resource = await this.prisma.resource.create({
      data: {
        folderId,
        authorId,
        name,
        kind: 'QUIZ',
        origin: 'QUIZ',
        mimeType: QUIZ_MIME,
        size: 0,
        s3Key,
      },
      include: { author: true },
    });

    const quiz = await this.prisma.quiz.create({
      data: {
        resourceId: resource.id,
        title: dto.title.trim(),
        instructions: dto.instructions?.trim() || null,
        createdById: authorId,
        settings: (dto.settings ?? {}) as Prisma.InputJsonValue,
      },
      include: { questions: { include: { options: true } } },
    });
    await this.syncSnapshot(quiz.id);
    return { resource, quiz };
  }

  async get(quizId: string, userId: string) {
    const quiz = await this.load(quizId);
    const projectId = quiz.resource.folder.projectId;
    const role = await this.permissions.resolveRole(
      userId,
      quiz.resource.folder.project,
    );
    if (!role) {
      throw new AppException(
        'PROJECT_FORBIDDEN',
        'No tienes permisos suficientes',
        HttpStatus.FORBIDDEN,
      );
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
    const isManager = quiz.resource.folder.project.ownerId === userId ||
      membership?.role === 'EDITOR';

    if (isManager) {
      return quiz;
    }

    if (membership?.role !== 'STUDENT' || quiz.status !== 'PUBLISHED') {
      throw new AppException(
        'QUIZ_NOT_ASSIGNED',
        'No tienes acceso a este cuestionario',
        HttpStatus.FORBIDDEN,
      );
    }

    const assigned = await this.prisma.quizAssignmentStudent.findFirst({
      where: {
        studentId: userId,
        assignment: { quizId, status: { in: ['PUBLISHED', 'CLOSED'] } },
      },
      select: { assignmentId: true },
    });
    if (!assigned) {
      throw new AppException(
        'QUIZ_NOT_ASSIGNED',
        'No tienes acceso a este cuestionario',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.sanitizeForStudent(quiz);
  }

  async update(quizId: string, userId: string, dto: UpdateQuizDto) {
    await this.assertManager(quizId, userId);
    const quiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.instructions !== undefined
          ? { instructions: dto.instructions?.trim() || null }
          : {}),
        ...(dto.settings !== undefined
          ? { settings: dto.settings as Prisma.InputJsonValue }
          : {}),
      },
      include: { questions: { include: { options: true } } },
    });
    await this.syncSnapshot(quizId);
    return quiz;
  }

  async setQuestions(
    quizId: string,
    userId: string,
    questions: QuizQuestionInputDto[],
  ) {
    await this.assertManager(quizId, userId);
    this.validateQuestions(questions);

    await this.prisma.$transaction(async (tx) => {
      await tx.quizQuestion.deleteMany({ where: { quizId } });
      for (const [index, question] of questions.entries()) {
        await tx.quizQuestion.create({
          data: {
            quizId,
            type: question.type,
            prompt: question.prompt.trim(),
            points: question.points,
            order: question.order ?? index,
            correctText: question.correctText?.trim() || null,
            caseSensitive: question.caseSensitive ?? false,
            sourceRefs: (question.sourceRefs ?? null) as Prisma.InputJsonValue,
            options: {
              create: (question.options ?? []).map((option, optionIndex) => ({
                text: option.text.trim(),
                isCorrect: option.isCorrect,
                order: option.order ?? optionIndex,
              })),
            },
          },
        });
      }
    });

    await this.syncSnapshot(quizId);
    return this.prisma.quiz.findUniqueOrThrow({
      where: { id: quizId },
      include: { questions: { include: { options: true } } },
    });
  }

  async publish(quizId: string, userId: string) {
    await this.assertManager(quizId, userId);
    const count = await this.prisma.quizQuestion.count({ where: { quizId } });
    if (count === 0) {
      throw new AppException(
        'QUIZ_INVALID',
        'El cuestionario debe tener al menos una pregunta',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const quiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: 'PUBLISHED' },
      include: { questions: { include: { options: true } } },
    });
    await this.syncSnapshot(quizId);
    return quiz;
  }

  async archive(quizId: string, userId: string) {
    await this.assertManager(quizId, userId);
    const quiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: 'ARCHIVED' },
    });
    await this.syncSnapshot(quizId);
    return quiz;
  }

  async duplicate(quizId: string, userId: string) {
    const original = await this.assertManager(quizId, userId);
    const name = await this.uniqueResourceName(
      original.resource.folderId,
      `${original.title} (copia).quiz.json`,
    );
    const s3Key = `projects/${original.resource.folder.projectId}/folders/${original.resource.folderId}/${randomUUID()}/${name}`;
    const resource = await this.prisma.resource.create({
      data: {
        folderId: original.resource.folderId,
        authorId: userId,
        name,
        kind: 'QUIZ',
        origin: 'QUIZ',
        mimeType: QUIZ_MIME,
        size: 0,
        s3Key,
      },
    });
    const quiz = await this.prisma.quiz.create({
      data: {
        resourceId: resource.id,
        title: `${original.title} (copia)`,
        instructions: original.instructions,
        settings: (original.settings ?? {}) as Prisma.InputJsonValue,
        createdById: userId,
        questions: {
          create: original.questions.map((question) => ({
            type: question.type,
            prompt: question.prompt,
            points: question.points,
            order: question.order,
            correctText: question.correctText,
            caseSensitive: question.caseSensitive,
            ...(question.sourceRefs
              ? { sourceRefs: question.sourceRefs as Prisma.InputJsonValue }
              : {}),
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: option.order,
              })),
            },
          })),
        },
      },
      include: { questions: { include: { options: true } } },
    });
    await this.syncSnapshot(quiz.id);
    return { resource, quiz };
  }

  private async load(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        resource: {
          include: { folder: { include: { project: true } } },
        },
        questions: {
          include: { options: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
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
    return quiz;
  }

  private async assertManager(quizId: string, userId: string) {
    const quiz = await this.load(quizId);
    await this.permissions.assertProjectRole(
      userId,
      quiz.resource.folder.projectId,
      'editor',
    );
    return quiz;
  }

  private validateQuestions(questions: QuizQuestionInputDto[]): void {
    if (!questions.length) {
      throw new AppException(
        'QUIZ_INVALID',
        'El cuestionario debe tener al menos una pregunta',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    for (const question of questions) {
      if (question.type === 'SHORT_ANSWER') {
        continue;
      }
      const options = question.options ?? [];
      if (options.length < 2 || !options.some((option) => option.isCorrect)) {
        throw new AppException(
          'QUIZ_INVALID',
          'Cada pregunta de opción múltiple o verdadero/falso necesita opciones y una respuesta correcta',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }
  }

  private sanitizeForStudent(
    quiz: Awaited<ReturnType<QuizzesService['load']>>,
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

  private async syncSnapshot(quizId: string): Promise<void> {
    const quiz = await this.load(quizId);
    const payload = JSON.stringify({
      title: quiz.title,
      instructions: quiz.instructions,
      status: quiz.status,
      settings: quiz.settings,
      questions: quiz.questions.map((question) => ({
        type: question.type,
        prompt: question.prompt,
        points: question.points,
        order: question.order,
        correctText: question.correctText,
        caseSensitive: question.caseSensitive,
        options: question.options.map((option) => ({
          text: option.text,
          isCorrect: option.isCorrect,
          order: option.order,
        })),
      })),
    });
    const buffer = Buffer.from(payload, 'utf8');
    await this.storage.put(quiz.resource.s3Key, buffer, QUIZ_MIME);
    await this.prisma.resource.update({
      where: { id: quiz.resourceId },
      data: {
        size: buffer.length,
        checksum: createHash('sha256').update(buffer).digest('hex'),
      },
    });
  }

  private async uniqueResourceName(
    folderId: string,
    base: string,
  ): Promise<string> {
    let candidate = base;
    let index = 1;
    while (
      await this.prisma.resource.findFirst({
        where: { folderId, name: { equals: candidate, mode: 'insensitive' } },
        select: { id: true },
      })
    ) {
      candidate = base.replace(/(\.quiz\.json)$/i, ` (${index})$1`);
      index += 1;
    }
    return candidate;
  }
}
