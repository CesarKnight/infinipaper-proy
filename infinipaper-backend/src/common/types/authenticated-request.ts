import type { Request } from 'express';
import type { Session, User } from '../../generated/prisma/client.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: Session;
}
