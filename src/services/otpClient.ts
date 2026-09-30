/**
 * Client service for secure server-side OTP generation and verification.
 * The frontend NEVER generates, displays, or logs OTP codes.
 */

export interface OtpSendResult {
  success: boolean;
  message?: string;
  error?: string;
  resendCooldown?: number;
}

export interface OtpVerifyResult {
  success: boolean;
  verificationToken?: string;
  error?: string;
  attemptsRemaining?: number;
}

export interface ServerRegisterPayload {
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

export async function requestMobileOtp(mobileNumber: string): Promise<OtpSendResult> {
  try {
    const res = await fetch('/api/otp/send-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success) {
      return { success: true, message: data.message, resendCooldown: data.resendCooldown || 60 };
    }
    return {
      success: false,
      error: data?.error || 'OTP service is not configured. Please contact the administrator.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Unable to reach OTP service. Please contact the administrator.',
    };
  }
}

export async function submitMobileOtp(mobileNumber: string, otp: string): Promise<OtpVerifyResult> {
  try {
    const res = await fetch('/api/otp/verify-mobile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, otp }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success) {
      return { success: true, verificationToken: data.verificationToken };
    }
    return {
      success: false,
      error: data?.error || 'Invalid OTP. Please try again.',
      attemptsRemaining: data?.attemptsRemaining,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Network error during verification. Please try again.',
    };
  }
}

export async function requestEmailOtp(email: string): Promise<OtpSendResult> {
  try {
    const res = await fetch('/api/otp/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success) {
      return { success: true, message: data.message, resendCooldown: data.resendCooldown || 60 };
    }
    return {
      success: false,
      error: data?.error || 'OTP service is not configured. Please contact the administrator.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Unable to reach email service. Please contact the administrator.',
    };
  }
}

export async function submitEmailOtp(email: string, otp: string): Promise<OtpVerifyResult> {
  try {
    const res = await fetch('/api/otp/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success) {
      return { success: true, verificationToken: data.verificationToken };
    }
    return {
      success: false,
      error: data?.error || 'Invalid OTP. Please try again.',
      attemptsRemaining: data?.attemptsRemaining,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Network error during verification. Please try again.',
    };
  }
}

export async function submitServerRegistration(
  payload: ServerRegisterPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success) {
      return { success: true };
    }
    return {
      success: false,
      error: data?.error || 'Server validation failed. Please check registration fields.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Network error connecting to registration server. Please try again.',
    };
  }
}
