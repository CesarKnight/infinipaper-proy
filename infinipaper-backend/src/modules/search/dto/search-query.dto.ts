import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  ResourceKind,
  ResourceOrigin,
  ValidationStatus,
} from '../../../generated/prisma/enums.js';

export class SearchQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  q!: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsEnum(ResourceKind)
  kind?: ResourceKind;

  @IsOptional()
  @IsEnum(ResourceOrigin)
  origin?: ResourceOrigin;

  @IsOptional()
  @IsEnum(ValidationStatus)
  validationStatus?: ValidationStatus;
}
