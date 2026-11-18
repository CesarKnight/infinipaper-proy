import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ResourceEventType,
  ResourceKind,
  ResourceOrigin,
  ValidationStatus,
} from '../../../generated/prisma/enums.js';

export class UsageQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(ResourceEventType)
  kind?: ResourceEventType;

  @IsOptional()
  @IsEnum(ResourceKind)
  resourceKind?: ResourceKind;

  @IsOptional()
  @IsEnum(ResourceOrigin)
  origin?: ResourceOrigin;

  @IsOptional()
  @IsEnum(ValidationStatus)
  validationStatus?: ValidationStatus;

  @IsOptional()
  @IsString()
  resourceId?: string;
}
