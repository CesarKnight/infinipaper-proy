import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyTeacherDto {
  @ApiProperty({ example: 'DOCENTE-2026' })
  @IsString()
  @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
  @MaxLength(64)
  code!: string;
}
