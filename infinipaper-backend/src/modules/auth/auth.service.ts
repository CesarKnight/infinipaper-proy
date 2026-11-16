import {
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '../../generated/prisma/client.js';
import { EmailService } from '../../common/email/email.service.js';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { generateSessionToken, hashToken } from '../../common/utils/token.util.js';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly sessions: SessionService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
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
    const role = this.adminEmails.includes(email) ? 'ADMIN' : 'STUDENT';
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        displayName: dto.displayName.trim(),
        passwordHash,
        role,
      },
    });

    void this.issueVerification(user.id, user.email).catch((error: Error) =>
      this.logger.error(
        `No se pudo enviar la verificación de email a ${user.email}: ${error.message}`,
      ),
    );

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

    const promoted =
      this.adminEmails.includes(user.email) && user.role !== 'ADMIN'
        ? await this.prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' },
          })
        : user;

    const session = await this.sessions.create(promoted.id);
    return { user: this.sanitize(promoted), session };
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

  async requestEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.emailVerifiedAt) {
      return;
    }

    const latest = await this.prisma.emailVerificationToken.findFirst({
      where: { userId, usedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < 60_000) {
      throw new AppException(
        'EMAIL_RATE_LIMITED',
        'Espera un minuto antes de solicitar otro correo',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.issueVerification(user.id, user.email);
  }

  async confirmEmail(token: string): Promise<Omit<User, 'passwordHash'>> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!record) {
      throw new AppException(
        'EMAIL_TOKEN_INVALID',
        'El enlace de confirmación no es válido',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (record.usedAt) {
      throw new AppException(
        'EMAIL_TOKEN_USED',
        'El enlace de confirmación ya fue utilizado',
        HttpStatus.CONFLICT,
      );
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new AppException(
        'EMAIL_TOKEN_EXPIRED',
        'El enlace de confirmación expiró',
        HttpStatus.GONE,
      );
    }

    const [, user] = await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return this.sanitize(user);
  }

  private async issueVerification(userId: string, email: string): Promise<void> {
    const token = generateSessionToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.email.sendVerificationEmail(email, token);
  }

  private get adminEmails(): string[] {
    return (this.config.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
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
