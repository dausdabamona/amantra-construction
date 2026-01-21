import { UserRole } from './types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}
