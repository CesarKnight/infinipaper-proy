import { SetMetadata } from '@nestjs/common';
import type { GlobalRole } from '../../generated/prisma/enums.js';

export const ROLES_KEY = 'globalRoles';

export const Roles = (...roles: GlobalRole[]) =>
  SetMetadata(ROLES_KEY, roles);
