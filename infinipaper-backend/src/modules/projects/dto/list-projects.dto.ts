import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export type ProjectScope = 'all' | 'owned' | 'participating' | 'public';

export class ListProjectsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['all', 'owned', 'participating', 'public'])
  scope?: ProjectScope;
}
