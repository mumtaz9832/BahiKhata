import crypto from 'crypto';
import { getSmsProvider, getEmailProvider } from './providers';
import { StoredOtpRecord } from './types';

// In-memory record store (hashed OTPs only)
const otpStore = new Map<string, StoredOtpRecord>();

// Verified tokens store for server-side registration validation
interface VerifiedTokenRecord {
  target: string;
  channel: 'sms' | 'email';
  token: string;
  expiresAt: number;
}
const verifiedTokens = new Map<string, VerifiedTokenRecord>();

// Automatic periodic cleanup of expired records every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(key);
    }
  }
  for (const [token, record] of verifiedTokens.entries()) {
    if (now > record.expiresAt) {
      verifiedTokens.delete(token);
    }
  }
}, 60000);

// Helper: Normalize target
function normalizeTarget(target: string, channel: 'sms' | 'email'): string {
  if (channel === 'sms') {
    return target.replace(/\D/g, '').slice(-10);
  }
  return target.trim().toLowerCase();
}

// Helper: Secure hash with salt
function hashOtp(otp: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${otp}`).digest('hex');
}

/**
 * Request Mobile OTP
 */
export async function sendMobileOtp(mobileNumber: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  resendCooldown?: number;
}> {
  const cleanPhone = normalizeTarget(mobileNumber, 'sms');
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number' };
  }

  // Rate-limiting check
  const existing = otpStore.get(`sms:${cleanPhone}`);
  const now = Date.now();
  if (existing && now < existing.resendAfter) {
    const remaining = Math.ceil((existing.resendAfter - now) / 1000);
    return {
      success: false,
      error: `Please wait ${remaining}s before requesting a new OTP.`,
      resendCooldown: remaining,
    };
  }

  // Check SMS Provider
  const smsProvider = getSmsProvider();
  if (!smsProvider) {
    return {
      success: false,
      error: 'OTP service is not configured. Please contact the administrator.',
    };
  }

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();

  // Send via real SMS provider
  const sendResult = await smsProvider.sendSms(cleanPhone, rawOtp);
  if (!sendResult.success) {
    return {
      success: false,
      error: sendResult.error || 'Failed to send SMS OTP. Please try again.',
    };
  }

  // Store ONLY secure salt and SHA-256 hash. The plaintext OTP is discarded immediately.
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtp(rawOtp, salt);

  otpStore.set(`sms:${cleanPhone}`, {
    target: cleanPhone,
    channel: 'sms',
    otpHash,
    salt,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes expiry
    resendAfter: now + 60 * 1000, // 60 seconds resend cooldown
    attempts: 0,
    verified: false,
  });

  return {
    success: true,
    message: 'OTP sent to mobile number',
    resendCooldown: 60,
  };
}

/**
 * Verify Mobile OTP
 */
export async function verifyMobileOtp(
  mobileNumber: string,
  userOtp: string
): Promise<{
  success: boolean;
  verificationToken?: string;
  error?: string;
  attemptsRemaining?: number;
}> {
  const cleanPhone = normalizeTarget(mobileNumber, 'sms');
  const record = otpStore.get(`sms:${cleanPhone}`);
  const now = Date.now();

  if (!record || now > record.expiresAt) {
    return {
      success: false,
      error: 'OTP has expired or was not requested. Please request a new OTP.',
    };
  }

  if (record.attempts >= 5) {
    otpStore.delete(`sms:${cleanPhone}`);
    return {
      success: false,
      error: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  const cleanInput = userOtp.trim();
  if (!/^\d{6}$/.test(cleanInput)) {
    record.attempts++;
    return {
      success: false,
      error: 'Invalid OTP. Please enter a 6-digit code.',
      attemptsRemaining: Math.max(0, 5 - record.attempts),
    };
  }

  // Hash input with stored salt
  const inputHash = hashOtp(cleanInput, record.salt);

  // Timing-safe comparison to prevent timing attacks
  const inputBuffer = Buffer.from(inputHash, 'hex');
  const targetBuffer = Buffer.from(record.otpHash, 'hex');
  const isValid =
    inputBuffer.length === targetBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, targetBuffer);

  if (!isValid) {
    record.attempts++;
    return {
      success: false,
      error: 'Invalid OTP. Please try again.',
      attemptsRemaining: Math.max(0, 5 - record.attempts),
    };
  }

  // Mark verified and generate secure verification token
  record.verified = true;
  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = now + 15 * 60 * 1000; // 15 min registration window

  verifiedTokens.set(token, {
    target: cleanPhone,
    channel: 'sms',
    token,
    expiresAt: tokenExpiresAt,
  });

  // Clean up used OTP record
  otpStore.delete(`sms:${cleanPhone}`);

  return {
    success: true,
    verificationToken: token,
  };
}

/**
 * Request Email OTP
 */
export async function sendEmailOtp(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  resendCooldown?: number;
}> {
  const cleanEmail = normalizeTarget(email, 'email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  // Rate-limiting check
  const existing = otpStore.get(`email:${cleanEmail}`);
  const now = Date.now();
  if (existing && now < existing.resendAfter) {
    const remaining = Math.ceil((existing.resendAfter - now) / 1000);
    return {
      success: false,
      error: `Please wait ${remaining}s before requesting a new OTP.`,
      resendCooldown: remaining,
    };
  }

  // Check Email Provider
  const emailProvider = getEmailProvider();
  if (!emailProvider) {
    return {
      success: false,
      error: 'OTP service is not configured. Please contact the administrator.',
    };
  }

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();

  // Send via real Email provider
  const sendResult = await emailProvider.sendEmail(cleanEmail, rawOtp);
  if (!sendResult.success) {
    return {
      success: false,
      error: sendResult.error || 'Failed to send verification email. Please try again.',
    };
  }

  // Store ONLY secure salt and SHA-256 hash. The plaintext OTP is discarded immediately.
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtp(rawOtp, salt);

  otpStore.set(`email:${cleanEmail}`, {
    target: cleanEmail,
    channel: 'email',
    otpHash,
    salt,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes expiry
    resendAfter: now + 60 * 1000, // 60 seconds resend cooldown
    attempts: 0,
    verified: false,
  });

  return {
    success: true,
    message: 'OTP sent to email address',
    resendCooldown: 60,
  };
}

/**
 * Verify Email OTP
 */
export async function verifyEmailOtp(
  email: string,
  userOtp: string
): Promise<{
  success: boolean;
  verificationToken?: string;
  error?: string;
  attemptsRemaining?: number;
}> {
  const cleanEmail = normalizeTarget(email, 'email');
  const record = otpStore.get(`email:${cleanEmail}`);
  const now = Date.now();

  if (!record || now > record.expiresAt) {
    return {
      success: false,
      error: 'OTP has expired or was not requested. Please request a new OTP.',
    };
  }

  if (record.attempts >= 5) {
    otpStore.delete(`email:${cleanEmail}`);
    return {
      success: false,
      error: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  const cleanInput = userOtp.trim();
  if (!/^\d{6}$/.test(cleanInput)) {
    record.attempts++;
    return {
      success: false,
      error: 'Invalid OTP. Please enter a 6-digit code.',
      attemptsRemaining: Math.max(0, 5 - record.attempts),
    };
  }

  // Hash input with stored salt
  const inputHash = hashOtp(cleanInput, record.salt);

  // Timing-safe comparison to prevent timing attacks
  const inputBuffer = Buffer.from(inputHash, 'hex');
  const targetBuffer = Buffer.from(record.otpHash, 'hex');
  const isValid =
    inputBuffer.length === targetBuffer.length &&
    crypto.timingSafeEqual(inputBuffer, targetBuffer);

  if (!isValid) {
    record.attempts++;
    return {
      success: false,
      error: 'Invalid OTP. Please try again.',
      attemptsRemaining: Math.max(0, 5 - record.attempts),
    };
  }

  // Mark verified and generate secure verification token
  record.verified = true;
  const token = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = now + 15 * 60 * 1000; // 15 min registration window

  verifiedTokens.set(token, {
    target: cleanEmail,
    channel: 'email',
    token,
    expiresAt: tokenExpiresAt,
  });

  // Clean up used OTP record
  otpStore.delete(`email:${cleanEmail}`);

  return {
    success: true,
    verificationToken: token,
  };
}

/**
 * Server-Side Validation for Account Registration
 * Ensures frontend verification flags cannot be spoofed.
 */
export function validateRegistrationTokens(
  mobileNumber: string,
  mobileToken?: string,
  email?: string,
  emailToken?: string,
  isGoogleAuthenticated?: boolean
): { valid: boolean; error?: string } {
  const now = Date.now();

  // 1. Mobile verification token validation
  if (!mobileToken) {
    return { valid: false, error: 'Mobile number must be verified via OTP.' };
  }
  const mobileRecord = verifiedTokens.get(mobileToken);
  const cleanPhone = normalizeTarget(mobileNumber, 'sms');

  if (
    !mobileRecord ||
    mobileRecord.channel !== 'sms' ||
    mobileRecord.target !== cleanPhone ||
    now > mobileRecord.expiresAt
  ) {
    return {
      valid: false,
      error: 'Mobile OTP verification is invalid or expired. Please re-verify your mobile number.',
    };
  }

  // 2. Email verification token validation (unless authenticated via Google)
  if (!isGoogleAuthenticated) {
    if (!emailToken) {
      return { valid: false, error: 'Email address must be verified via OTP.' };
    }
    const emailRecord = verifiedTokens.get(emailToken);
    const cleanEmail = normalizeTarget(email || '', 'email');

    if (
      !emailRecord ||
      emailRecord.channel !== 'email' ||
      emailRecord.target !== cleanEmail ||
      now > emailRecord.expiresAt
    ) {
      return {
        valid: false,
        error: 'Email OTP verification is invalid or expired. Please re-verify your email address.',
      };
    }
  }

  return { valid: true };
}
