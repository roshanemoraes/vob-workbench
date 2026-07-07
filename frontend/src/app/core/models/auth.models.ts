export type UserRole = 'ADMIN' | 'FRONT_DESK_OPERATOR' | 'SPECIALIST';

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}
