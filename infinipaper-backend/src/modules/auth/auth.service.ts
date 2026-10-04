import {
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '../../generated/prisma/client.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { SessionService, type IssuedSession } from './session.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  session: IssuedSession;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly sessions: SessionService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });

    if (existing?.email === email) {
      throw new AppException(
        'USER_EMAIL_TAKEN',
        'El correo ya está registrado',
        HttpStatus.CONFLICT,
      );
    }
    if (existing?.username === username) {
      throw new AppException(
        'USER_USERNAME_TAKEN',
        'El nombre de usuario ya está en uso',
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await this.password.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        displayName: dto.displayName.trim(),
        passwordHash,
      },
    });

    const session = await this.sessions.create(user.id);
    return { user: this.sanitize(user), session };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });

    if (!user || !(await this.password.verify(user.passwordHash, dto.password))) {
      throw new AppException(
        'AUTH_INVALID_CREDENTIALS',
        'Credenciales inválidas',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status === 'ARCHIVED') {
      throw new AppException(
        'AUTH_ACCOUNT_ARCHIVED',
        'La cuenta está archivada',
        HttpStatus.FORBIDDEN,
      );
    }

    const session = await this.sessions.create(user.id);
    return { user: this.sanitize(user), session };
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) {
      await this.sessions.revoke(token);
    }
  }

  async me(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.sanitize(user);
  }

  sanitize(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }

  get cookieName(): string {
    return this.config.get<string>('SESSION_COOKIE_NAME') ?? 'session';
  }

  get sessionTtlMs(): number {
    const days = this.config.get<number>('SESSION_TTL_DAYS') ?? 7;
    return days * 24 * 60 * 60 * 1000;
  }

  get cookieSecure(): boolean {
    return this.config.get<boolean>('COOKIE_SECURE') ?? false;
  }
}
