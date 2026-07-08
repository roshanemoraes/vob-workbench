export type UserRole = 'ADMIN' | 'FRONT_DESK_OPERATOR' | 'SPECIALIST';

export type Permission =
  | 'PATIENT_CREATE'
  | 'PATIENT_VIEW'
  | 'VOB_CREATE'
  | 'VOB_VIEW_OWN'
  | 'VOB_QUEUE_VIEW'
  | 'VOB_CLAIM'
  | 'VOB_VERIFY_API'
  | 'VOB_VERIFY_MANUAL'
  | 'VOB_COMPLETE'
  | 'VOB_ASSIGN'
  | 'DASHBOARD_VIEW'
  | 'AUDIT_VIEW'
  | 'USER_MANAGE';

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  permissions: Permission[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUserResponse {
  id: string;
  username: string;
  role: UserRole;
  permissions: Permission[];
}

export interface AuthResponse {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  user: AuthUserResponse;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
