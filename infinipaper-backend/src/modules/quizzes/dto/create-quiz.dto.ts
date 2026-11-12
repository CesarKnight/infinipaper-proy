import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuizStatus } from '../../../generated/prisma/client.js';

export class CreateQuizOptionDto {
  @ApiProperty({ example: 'Un protocolo de transferencia de hipertexto' })
  @IsString()
  @IsNotEmpty({ message: 'El texto de la opción es obligatorio' })
  @MaxLength(500)
  text!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect!: boolean;
}

export class CreateQuizQuestionDto {
  @ApiProperty({ example: '¿Qué significa HTTP?' })
  @IsString()
  @IsNotEmpty({ message: 'El enunciado de la pregunta es obligatorio' })
  @MaxLength(1000)
  text!: string;

  @ApiPropertyOptional({ example: 10, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiProperty({ type: [CreateQuizOptionDto] })
  @IsArray()
  @ArrayMinSize(2, { message: 'Cada pregunta debe tener al menos 2 opciones' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  options!: CreateQuizOptionDto[];
}

export class CreateQuizDto {
  @ApiProperty({ example: 'Cuestionario Tema 1' })
  @IsString()
  @IsNotEmpty({ message: 'El título del cuestionario es obligatorio' })
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Evaluación diagnóstica del módulo' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: QuizStatus, default: QuizStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @ApiProperty({ type: [CreateQuizQuestionDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'El cuestionario debe tener al menos 1 pregunta' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions!: CreateQuizQuestionDto[];
}
