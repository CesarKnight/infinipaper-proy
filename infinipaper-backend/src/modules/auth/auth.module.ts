import { Module } from '@nestjs/common';
import { EmailModule } from '../../common/email/email.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [EmailModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, SessionService],
  exports: [SessionService, PasswordService],
})
export class AuthModule {}
