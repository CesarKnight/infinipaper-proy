import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { User } from '../../generated/prisma/client.js';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = await this.auth.register(dto);
    this.setSessionCookie(res, session.token);
    return user;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = await this.auth.login(dto);
    this.setSessionCookie(res, session.token);
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const cookies = (req as { cookies?: Record<string, string> }).cookies;
    await this.auth.logout(cookies?.[this.auth.cookieName]);
    res.clearCookie(this.auth.cookieName, { path: '/' });
  }

  @Get('me')
  async me(@CurrentUser() user: User) {
    return this.auth.me(user.id);
  }

  private setSessionCookie(res: Response, token: string): void {
    res.cookie(this.auth.cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.auth.cookieSecure,
      path: '/',
      maxAge: this.auth.sessionTtlMs,
    });
  }
}
