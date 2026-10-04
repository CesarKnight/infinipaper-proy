import { IsEnum, IsString } from 'class-validator';
import { ProjectRole } from '../../../generated/prisma/enums.js';

export class AddMemberDto {
  @IsString()
  userId!: string;

  @IsEnum(ProjectRole)
  role?: ProjectRole;
}
