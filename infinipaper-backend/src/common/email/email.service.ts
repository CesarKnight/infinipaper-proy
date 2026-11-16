import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER') || undefined;
    const pass = config.get<string>('SMTP_PASS') || undefined;

    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST') ?? 'localhost',
      port: config.get<number>('SMTP_PORT') ?? 1025,
      secure: config.get<boolean>('SMTP_SECURE') ?? false,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
    this.from =
      config.get<string>('SMTP_FROM') ??
      'Infinipaper <no-reply@infinipaper.local>';
    this.appUrl = (
      config.get<string>('APP_PUBLIC_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${this.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.send({
      to,
      subject: 'Confirma tu correo en Infinipaper',
      text: `Confirma tu correo abriendo este enlace: ${url}\n\nEl enlace caduca en 24 horas.`,
      html: `<p>Confirma tu correo en Infinipaper.</p><p><a href="${url}">Confirmar correo</a></p><p>El enlace caduca en 24 horas.</p>`,
    });
  }

  async sendTeacherDecision(
    to: string,
    approved: boolean,
    reason?: string | null,
  ): Promise<void> {
    const subject = approved
      ? 'Tu perfil docente ha sido verificado'
      : 'Tu solicitud docente fue revisada';
    const detail = reason ? `\n\nMotivo: ${reason}` : '';
    await this.send({
      to,
      subject,
      text: approved
        ? 'Tu perfil docente ha sido verificado en Infinipaper.'
        : `Tu solicitud docente no fue aprobada.${detail}`,
      html: approved
        ? '<p>Tu perfil docente ha sido verificado en Infinipaper.</p>'
        : `<p>Tu solicitud docente no fue aprobada.</p>${reason ? `<p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>` : ''}`,
    });
  }

  private async send(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, ...input });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo "${input.subject}": ${(error as Error).message}`,
      );
      throw error;
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
