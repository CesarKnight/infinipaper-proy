import { IsEnum } from 'class-validator';
import { ProjectRole } from '../../../generated/prisma/enums.js';

export class UpdateMemberRoleDto {
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}
