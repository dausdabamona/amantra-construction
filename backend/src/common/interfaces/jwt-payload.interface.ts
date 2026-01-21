export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string; // OWNER, CONTRACTOR, SUPERVISOR, WITNESS
  name?: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
