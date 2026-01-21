import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
