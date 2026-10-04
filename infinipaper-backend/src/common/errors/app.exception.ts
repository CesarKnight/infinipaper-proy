import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Error de dominio con un código estable para el cliente.
 * El formato final lo produce AllExceptionsFilter.
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details: unknown = null,
  ) {
    super({ code, message, details }, status);
  }
}
