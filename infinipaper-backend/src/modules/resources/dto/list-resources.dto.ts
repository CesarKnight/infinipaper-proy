import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { ResourceOrigin, ValidationStatus } from '../../../generated/prisma/enums.js';

export class ListResourcesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ResourceOrigin)
  origin?: ResourceOrigin;

  @IsOptional()
  @IsEnum(ValidationStatus)
  validationStatus?: ValidationStatus;
}
