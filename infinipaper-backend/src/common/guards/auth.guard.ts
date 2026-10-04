import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AppException } from '../errors/app.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { hashToken } from '../utils/token.util.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly cookieName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    this.cookieName = config.get<string>('SESSION_COOKIE_NAME') ?? 'session';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (token) {
      const session = await this.prisma.session.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { user: true },
      });

      if (
        session &&
        session.expiresAt.getTime() > Date.now() &&
        session.user.status === 'ACTIVE'
      ) {
        request.user = session.user;
        request.session = session;
        return true;
      }
    }

    if (isPublic) {
      return true;
    }

    throw new AppException(
      'AUTH_REQUIRED',
      'Debes iniciar sesión',
      HttpStatus.UNAUTHORIZED,
    );
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const cookies = (request as { cookies?: Record<string, string> }).cookies;
    return cookies?.[this.cookieName];
  }
}
