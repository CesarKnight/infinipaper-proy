import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppException } from '../errors/app.exception.js';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string | string[];
  details: unknown;
}

const PRISMA_UNIQUE = 'P2002';
const PRISMA_NOT_FOUND = 'P2025';
const PRISMA_FK = 'P2003';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message: string | string[] = 'Error interno del servidor';
    let details: unknown = null;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const obj = body as Record<string, unknown>;
        message = (obj.message as string | string[]) ?? exception.message;
        details = obj.details ?? null;
      }
      code = `HTTP_${status}`;
    } else if (this.isPrismaKnownError(exception)) {
      const prismaCode = (exception as { code: string }).code;
      if (prismaCode === PRISMA_UNIQUE) {
        status = HttpStatus.CONFLICT;
        code = 'RESOURCE_CONFLICT';
        message = 'El recurso ya existe';
      } else if (prismaCode === PRISMA_NOT_FOUND) {
        status = HttpStatus.NOT_FOUND;
        code = 'RESOURCE_NOT_FOUND';
        message = 'El recurso no existe';
      } else if (prismaCode === PRISMA_FK) {
        status = HttpStatus.CONFLICT;
        code = 'RESOURCE_IN_USE';
        message = 'El recurso está en uso';
      } else {
        status = HttpStatus.BAD_REQUEST;
        code = 'DATABASE_ERROR';
        message = 'Error al procesar la operación';
      }
    } else if (exception instanceof Error) {
      message = 'Error interno del servidor';
    }

    const body: ErrorBody = { statusCode: status, code, message, details };
    response.status(status).json(body);
  }

  private isPrismaKnownError(
    exception: unknown,
  ): exception is { code: string } {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      typeof (exception as { code?: unknown }).code === 'string' &&
      (exception as { code: string }).code.startsWith('P')
    );
  }
}
