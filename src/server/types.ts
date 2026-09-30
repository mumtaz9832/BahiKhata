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
  fullName: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  businessAddress: string;
  gstNumber?: string;
  mobileVerificationToken?: string;
  emailVerificationToken?: string;
  isGoogleAuthenticated?: boolean;
}

export interface ServerRegisterResponse {
  success: boolean;
  message?: string;
  error?: string;
}
