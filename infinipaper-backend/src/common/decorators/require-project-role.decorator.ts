import { SetMetadata } from '@nestjs/common';
import type { RequiredRole } from '../permissions/permissions.service.js';

export const PROJECT_ROLE_KEY = 'requiredProjectRole';

/** Exige un rol mínimo de proyecto en la ruta. */
export const RequireProjectRole = (role: RequiredRole) =>
  SetMetadata(PROJECT_ROLE_KEY, role);
