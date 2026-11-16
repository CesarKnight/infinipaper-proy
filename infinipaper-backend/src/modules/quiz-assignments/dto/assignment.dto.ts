import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssignmentDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  studentIds!: string[];

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  attemptsAllowed?: number;
}

export class SaveAnswerDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsString()
  optionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;
}

export class GradeAnswerDto {
  @IsInt()
  @Min(0)
  points!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}
