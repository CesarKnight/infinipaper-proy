import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

/** Inyecta el usuario autenticado (o undefined en rutas públicas). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
