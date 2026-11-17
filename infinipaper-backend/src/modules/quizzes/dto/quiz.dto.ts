import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuizQuestionType } from '../../../generated/prisma/enums.js';

export class CreateQuizDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class QuizOptionInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class QuizQuestionInputDto {
  @IsEnum(QuizQuestionType)
  type!: QuizQuestionType;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  prompt!: string;

  @IsInt()
  @Min(1)
  points!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  correctText?: string;

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceRefs?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionInputDto)
  options?: QuizOptionInputDto[];
}

export class SetQuizQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionInputDto)
  questions!: QuizQuestionInputDto[];
}
