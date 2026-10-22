export interface SendOtpRequest {
  target: string; // phone number or email
  channel: 'sms' | 'email';
}

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  resendCooldown?: number; // in seconds
}

export interface VerifyOtpRequest {
  target: string;
  channel: 'sms' | 'email';
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verificationToken?: string;
  message?: string;
  error?: string;
  attemptsRemaining?: number;
}

export interface StoredOtpRecord {
  target: string;
  channel: 'sms' | 'email';
  otpHash: string;
  salt: string;
  expiresAt: number; // timestamp ms
  resendAfter: number; // timestamp ms
  attempts: number;
  verified: boolean;
  verificationToken?: string;
  tokenExpiresAt?: number;
}

export interface ServerRegisterRequest {
  userId?: string;
  name?: string;
  fullName?: string;
  mobileNumber: string;
  phone?: string;
  email: string;
  emailId?: string;
  address?: string;
  businessAddress?: string;
  businessName: string;
  gstin?: string;
  gstNumber?: string;
  category: 'Sales' | 'Service';
  subcategory: string;
  mobileVerificationToken?: string;
  emailVerificationToken?: string;
  isGoogleAuthenticated?: boolean;
}

export interface ServerRegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  user?: {
    id: string;
    businessId: string;
    name: string;
    businessName: string;
    category: 'Sales' | 'Service';
    subcategory: string;
    mobileNumber: string;
    email: string;
  };
}

export interface AdminLoginRequest {
  loginId: string;
  password: string;
}

export interface AdminVerify2faRequest {
  challengeId: string;
  otp: string;
}

export interface AdminSession {
  token: string;
  loginId: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  loginId: string;
  ip?: string;
  details?: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}
