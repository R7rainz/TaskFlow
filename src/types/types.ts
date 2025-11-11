import { Request } from "express";

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface LogoutBody {
  refreshToken: string;
}

export interface RefreshBody {
  refreshToken: string;
  userId: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

//2FA requests
export interface Verify2FABody {
  otpCode: string;
  tempEncryptedSecret: string;
  backupCodes: string[];
}

export interface Verify2FABackupBody {
  backupCode: string;
  userEmail: string;
}

export interface VerifyLoginOTPBody {
  userId: string;
  otpCode: string;
}

export interface VerifyLoginBackupBody {
  userId: string;
  backupCode: string;
}

export interface JwtPayload {
  userId: number;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

//2faController
export interface Verify2FAWithOTPBody {
  otpCode: string;
  tempEncryptedSecret: string;
  backupCodes: string[];
}

export interface Verify2FAWithBackupCodeBody {
  userId: string;
  backupCode: string;
  userEmail: string;
}

export interface VerifyLoginWithOTPBody {
  userId: string;
  otpCode: string;
}

export interface VerifyLoginWithBackupCodeBody {
  userId: string;
  backupCode: string;
}
