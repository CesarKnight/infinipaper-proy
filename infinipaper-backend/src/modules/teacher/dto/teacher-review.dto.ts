import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TeacherReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
