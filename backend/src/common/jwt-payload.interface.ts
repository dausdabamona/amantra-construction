export interface JwtPayload {
  sub: string;
  email: string;
  role: string; // OWNER, CONTRACTOR, SUPERVISOR, WITNESS
  name: string;
}
