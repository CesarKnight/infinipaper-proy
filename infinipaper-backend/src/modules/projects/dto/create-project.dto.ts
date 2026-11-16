import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ProjectType, ProjectVisibility } from '../../../generated/prisma/enums.js';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @ValidateIf((dto: CreateProjectDto) => dto.type === 'COURSE')
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  institution?: string;

  @ValidateIf((dto: CreateProjectDto) => dto.type === 'COURSE')
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  period?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;
}
