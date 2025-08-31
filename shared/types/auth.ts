// 認證相關類型定義

export type UserType = 'member' | 'admin';

export interface JWTPayload {
  // 通用字段
  sub: string;           // 用戶ID
  iat: number;          // 簽發時間
  exp: number;          // 過期時間
  type: UserType;       // 用戶類型
  
  // 會員專用字段
  memberTier?: MemberTier;
  memberStatus?: MemberStatus;
  
  // 管理員專用字段
  role?: string;
  permissions?: string[];
  department?: string;
}

export type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// 登入請求
export interface LoginRequest {
  email: string;
  password: string;
}

// 登入響應
export interface LoginResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 註冊請求
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  marketingConsent?: boolean;
}

// 用戶信息
export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  type: UserType;
  status: string;
  
  // 會員專用
  memberTier?: MemberTier;
  memberStatus?: MemberStatus;
  points?: number;
  
  // 管理員專用
  role?: string;
  permissions?: string[];
  department?: string;
  
  createdAt: Date;
  lastLoginAt?: Date;
}

// Token 刷新請求
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Token 刷新響應
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// 修改密碼請求
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 忘記密碼請求
export interface ForgotPasswordRequest {
  email: string;
}

// 重設密碼請求
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// 社交登入
export interface SocialLoginRequest {
  provider: 'google' | 'facebook' | 'line';
  code: string;
  redirectUri: string;
}