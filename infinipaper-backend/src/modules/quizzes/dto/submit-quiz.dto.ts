import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class QuizAnswerItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  selectedOptionId!: string;
}

export class SubmitQuizDto {
  @ApiProperty({ type: [QuizAnswerItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debes responder al menos una pregunta' })
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerItemDto)
  answers!: QuizAnswerItemDto[];
}
