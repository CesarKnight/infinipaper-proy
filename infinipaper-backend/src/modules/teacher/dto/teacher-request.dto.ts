import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class TeacherRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  institution!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  position?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  evidenceUrl?: string;
}
