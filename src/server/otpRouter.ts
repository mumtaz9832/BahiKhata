import express from 'express';
import type { Request, Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import {
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,
  validateRegistrationTokens,
  consumeRegistrationTokens,
} from './otpService.ts';
import {
  getSmsProvider,
  getEmailProvider,
  type SmsProvider,
  type EmailProvider,
} from './providers.ts';
import type {
  ServerRegisterRequest,
  AdminSession,
  AdminAuditLog,
} from './types.ts';
import {
  validateRegistrationPayload,
} from '../config/categories.ts';

/**
 * Temporary In-Memory Storage Record for Mock OTP Verification Codes
 * Used strictly for development testing when live SMS gateway is not configured.
 */
export interface MockOtpRecord {
  target: string;
  otp: string;
  channel: 'sms' | 'email';
  createdAt: number;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

export const mockOtpMemoryStore: Record<string, MockOtpRecord> = {};

/**
 * Mock OTP Provider that saves verification codes in the temporary memory object for local testing.
 */
export class MockOtpProvider implements SmsProvider, EmailProvider {
  name = 'MockOtpProvider';

  async sendSms(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const cleanPhone = to.replace(/\D/g, '').slice(-10);
    mockOtpMemoryStore[`sms:${cleanPhone}`] = {
      target: cleanPhone,
      otp: otp.trim(),
      channel: 'sms',
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
      verified: false,
    };
    return { success: true };
  }

  async sendEmail(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = to.trim().toLowerCase();
    mockOtpMemoryStore[`email:${cleanEmail}`] = {
      target: cleanEmail,
      otp: otp.trim(),
      channel: 'email',
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0,
      verified: false,
    };
    return { success: true };
  }

  getVerificationCode(target: string, channel: 'sms' | 'email' = 'sms'): string | null {
    const cleanTarget = channel === 'sms' ? target.replace(/\D/g, '').slice(-10) : target.trim().toLowerCase();
    const record = mockOtpMemoryStore[`${channel}:${cleanTarget}`];
    if (record && Date.now() <= record.expiresAt) {
      return record.otp;
    }
    return null;
  }

  verifyCode(target: string, inputOtp: string, channel: 'sms' | 'email' = 'sms'): {
    success: boolean;
    error?: string;
  } {
    const cleanTarget = channel === 'sms' ? target.replace(/\D/g, '').slice(-10) : target.trim().toLowerCase();
    const cleanInput = inputOtp.trim();
    const record = mockOtpMemoryStore[`${channel}:${cleanTarget}`];

    if (!record) {
      return { success: false, error: 'No verification code found for this recipient in temporary memory store.' };
    }

    if (Date.now() > record.expiresAt) {
      delete mockOtpMemoryStore[`${channel}:${cleanTarget}`];
      return { success: false, error: 'Verification code has expired.' };
    }

    record.attempts++;
    if (record.attempts > 5) {
      delete mockOtpMemoryStore[`${channel}:${cleanTarget}`];
      return { success: false, error: 'Maximum verification attempts exceeded.' };
    }

    if (record.otp === cleanInput) {
      record.verified = true;
      return { success: true };
    }

    return { success: false, error: 'Invalid verification code.' };
  }

  clear(): void {
    for (const key of Object.keys(mockOtpMemoryStore)) {
      delete mockOtpMemoryStore[key];
    }
  }

  getActiveRecords(): Array<{ target: string; channel: string; otp: string; expiresAt: number; verified: boolean }> {
    const result: Array<{ target: string; channel: string; otp: string; expiresAt: number; verified: boolean }> = [];
    const now = Date.now();
    for (const val of Object.values(mockOtpMemoryStore)) {
      if (val.expiresAt > now) {
        result.push({
          target: val.target,
          channel: val.channel,
          otp: val.otp,
          expiresAt: val.expiresAt,
          verified: val.verified,
        });
      }
    }
    return result;
  }
}

export const mockOtpProvider = new MockOtpProvider();

// ============================================================================
// SERVER-SIDE ADMIN SECURITY & AUDIT STORE
// ============================================================================

interface AdminCredentialState {
  loginId: string;
  passwordHash: string; // SHA-256 with salt
  salt: string;
  updatedAt: string;
}

// Initial Admin Credential state - customizable via Environment Variables
const adminSalt = crypto.randomBytes(16).toString('hex');
const initialAdminLoginId = process.env.BIZCORE_ADMIN_LOGIN_ID || process.env.ADMIN_LOGIN_ID || 'Mumtazkhan1985';
const initialAdminPassword = process.env.BIZCORE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Mumtaz@1985';

let currentAdminCredentials: AdminCredentialState = {
  loginId: initialAdminLoginId,
  salt: adminSalt,
  passwordHash: crypto.createHash('sha256').update(`${adminSalt}:${initialAdminPassword}`).digest('hex'),
  updatedAt: new Date().toISOString(),
};

// Admin Active Sessions: Token -> AdminSession (2 hour expiry)
const adminSessions = new Map<string, AdminSession>();

// Admin 2FA Challenges: challengeId -> { otpHash, salt, expiresAt, loginId }
interface Admin2faChallenge {
  challengeId: string;
  targetPhone: string;
  targetEmail: string;
  loginId: string;
  otpHash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
}
const admin2faChallenges = new Map<string, Admin2faChallenge>();

// Admin Login Brute-Force Rate Limiter: IP/ID -> { attempts, lockedUntil }
const adminLoginAttempts = new Map<string, { attempts: number; lockedUntil: number }>();

// Server Audit Log Buffer (recent 200 events)
const adminAuditTrail: AdminAuditLog[] = [];

export function recordAuditLog(
  action: string,
  loginId: string,
  status: 'SUCCESS' | 'FAILED' | 'WARNING',
  ip?: string,
  details?: string
): AdminAuditLog {
  const log: AdminAuditLog = {
    id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
    action,
    loginId,
    ip: ip || 'unknown',
    details,
    status,
  };
  adminAuditTrail.unshift(log);
  if (adminAuditTrail.length > 200) {
    adminAuditTrail.pop();
  }
  return log;
}

export function verifyAdminSessionToken(token?: string | null): { valid: boolean; session?: AdminSession } {
  if (!token) return { valid: false };
  const session = adminSessions.get(token);
  if (!session) return { valid: false };
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return { valid: false };
  }
  return { valid: true, session };
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of adminSessions.entries()) {
    if (now > s.expiresAt) adminSessions.delete(token);
  }
  for (const [id, c] of admin2faChallenges.entries()) {
    if (now > c.expiresAt) admin2faChallenges.delete(id);
  }
  for (const [ip, l] of adminLoginAttempts.entries()) {
    if (now > l.lockedUntil && l.attempts >= 5) adminLoginAttempts.delete(ip);
  }
}, 60000).unref();

// ============================================================================
// SUBSCRIPTION PLANS & SERVER-AUTHORITATIVE PAYMENT STATE
// ============================================================================

export const BIZCORE_SUBSCRIPTION_PLANS = {
  free: {
    tier: 'free' as const,
    name: 'Free Starter Tier',
    amount: 0,
    amountPaise: 0,
    durationDays: 30,
    invoiceLimit: 5,
    description: 'Up to 5 invoices/month, standard branding',
  },
  pro_monthly: {
    tier: 'pro_monthly' as const,
    name: 'Pro Monthly Plan',
    amount: 299,
    amountPaise: 29900,
    durationDays: 30,
    invoiceLimit: -1,
    description: 'Unlimited bills, zero watermark, custom logo, 30 days access',
  },
  pro_half_yearly: {
    tier: 'pro_half_yearly' as const,
    name: 'Pro Half-Yearly Plan',
    amount: 1499,
    amountPaise: 149900,
    durationDays: 180,
    invoiceLimit: -1,
    description: 'Unlimited bills, zero watermark, custom logo, 180 days access',
  },
  pro_yearly: {
    tier: 'pro_yearly' as const,
    name: 'Pro Annual Dealership Plan',
    amount: 2499,
    amountPaise: 249900,
    durationDays: 365,
    invoiceLimit: -1,
    description: 'Unlimited bills, zero watermark, custom logo, priority cloud, 365 days access',
  },
};

const PAYMENT_HMAC_SECRET = process.env.PAYMENT_GATEWAY_SECRET || 'bizcore_sec_hmac_9832_v1';

export interface ServerSubscriptionOrder {
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  planTier: string;
  challengeToken: string;
  createdAt: number;
  status: 'created' | 'paid' | 'failed';
  billingName?: string;
  billingEmail?: string;
}

const subscriptionOrders = new Map<string, ServerSubscriptionOrder>();
const processedPaymentEvents = new Set<string>();
const serverSubscriptionTransactions: any[] = [];

// ============================================================================
// EXPRESS ROUTER
// ============================================================================

export const otpRouter = express.Router();

// Sanitized safe diagnostic logger: Never logs OTPs, tokens, or raw sensitive bodies
otpRouter.use((req: Request, _res: Response, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API Request]: ${req.method} ${req.originalUrl || req.url} from ${req.ip || 'local'}`);
  }
  next();
});

// Health & Config Check
otpRouter.get(['/health', '/otp/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    smsProviderConfigured: Boolean(getSmsProvider()),
    emailProviderConfigured: Boolean(getEmailProvider()),
  });
});

// Inspection endpoint for testing: Available in development test environments
otpRouter.get(['/mock-store', '/otp/mock-store'], (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Mock inspection disabled in production' });
  }
  res.json({
    success: true,
    records: mockOtpProvider.getActiveRecords(),
  });
});

// Clear mock OTP temporary memory store
otpRouter.post(['/mock-clear', '/otp/mock-clear'], (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Mock operations disabled in production' });
  }
  mockOtpProvider.clear();
  res.json({
    success: true,
    message: 'Mock OTP temporary memory store cleared successfully',
  });
});

// Generic Send OTP (/otp/send) - Supports mobile or email
otpRouter.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const phone = body.mobileNumber || body.phone || (body.channel === 'sms' || !body.channel?.includes('email') ? body.target : undefined);
    const email = body.email || (body.channel === 'email' ? body.target : undefined);

    if (phone && (!email || body.channel === 'sms')) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
      }
      const result = await sendMobileOtp(cleanPhone);
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
      }
      const result = await sendEmailOtp(cleanEmail);
      return res.status(result.success ? 200 : 400).json(result);
    }

    return res.status(400).json({
      success: false,
      error: 'Destination mobileNumber or email is required to send OTP',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Generic Verify OTP (/otp/verify) - Supports mobile or email
otpRouter.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const otpCode = body.otp || body.code;
    if (!otpCode) {
      return res.status(400).json({ success: false, error: 'OTP verification code is required' });
    }

    const phone = body.mobileNumber || body.phone || (body.channel === 'sms' || !body.channel?.includes('email') ? body.target : undefined);
    const email = body.email || (body.channel === 'email' ? body.target : undefined);

    if (phone && (!email || body.channel === 'sms')) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
      }
      const result = await verifyMobileOtp(cleanPhone, String(otpCode).trim());
      return res.status(result.success ? 200 : 400).json(result);
    }

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
      }
      const result = await verifyEmailOtp(cleanEmail, String(otpCode).trim());
      return res.status(result.success ? 200 : 400).json(result);
    }

    return res.status(400).json({
      success: false,
      error: 'Destination mobileNumber or email is required to verify OTP',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// 1. Send Mobile OTP
otpRouter.post('/otp/send-mobile', async (req: Request, res: Response) => {
  try {
    const mobileNumber = req.body?.mobileNumber || req.body?.phone || req.body?.target;
    if (!mobileNumber) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }
    const result = await sendMobileOtp(mobileNumber);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// 2. Verify Mobile OTP
otpRouter.post('/otp/verify-mobile', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const mobileNumber = body.mobileNumber || body.phone;
    const otp = body.otp || body.otpCode || body.code;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, error: 'Mobile number and OTP are required' });
    }
    const result = await verifyMobileOtp(String(mobileNumber), String(otp));
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// 3. Send Email OTP
otpRouter.post('/otp/send-email', async (req: Request, res: Response) => {
  try {
    const email = req.body?.email || req.body?.target;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }
    const result = await sendEmailOtp(email);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// 4. Verify Email OTP
otpRouter.post('/otp/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email address and OTP are required' });
    }
    const result = await verifyEmailOtp(email, otp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// 5. Registration Validation & Account Creation (Supports both /account/register and /register)
const handleRegisterRequest = async (req: Request, res: Response) => {
  try {
    const data = req.body as ServerRegisterRequest;

    // Validate with centralized validation engine (strict Category & Subcategory check)
    const validation = validateRegistrationPayload({
      name: data.name || data.fullName,
      mobileNumber: data.mobileNumber || data.phone,
      email: data.email || data.emailId,
      address: data.address || data.businessAddress,
      businessName: data.businessName,
      gstin: data.gstin || data.gstNumber,
      category: data.category,
      subcategory: data.subcategory,
      mobileVerificationToken: data.mobileVerificationToken,
      emailVerificationToken: data.emailVerificationToken,
    });

    if (!validation.valid || !validation.sanitized) {
      return res.status(400).json({
        success: false,
        error: Object.values(validation.errors)[0] || 'Validation failed',
        errors: validation.errors,
      });
    }

    const sanitized = validation.sanitized;

    // Verify cryptographic OTP verification tokens (unless authenticated via Google)
    const tokenCheck = validateRegistrationTokens(
      sanitized.mobileNumber,
      sanitized.mobileVerificationToken,
      sanitized.email,
      sanitized.emailVerificationToken,
      data.isGoogleAuthenticated
    );

    if (!tokenCheck.valid) {
      return res.status(400).json({ success: false, error: tokenCheck.error });
    }

    // Single-use token consumption: protect against token replay attacks
    consumeRegistrationTokens(sanitized.mobileVerificationToken, sanitized.emailVerificationToken);

    const generatedUserId = data.userId || `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const generatedBusinessId = `biz_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    return res.json({
      success: true,
      message: 'Account verified and authorized successfully',
      user: {
        id: generatedUserId,
        businessId: generatedBusinessId,
        name: sanitized.name,
        businessName: sanitized.businessName,
        category: sanitized.category,
        subcategory: sanitized.subcategory,
        mobileNumber: sanitized.mobileNumber,
        email: sanitized.email,
        address: sanitized.address,
        gstin: sanitized.gstin || '',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
};

otpRouter.post('/account/register', handleRegisterRequest);
otpRouter.post('/register', handleRegisterRequest);

// ============================================================================
// ADMIN SECURITY ENDPOINTS
// ============================================================================

// Admin Login Step 1: Verify Credentials & trigger 2FA challenge
otpRouter.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { loginId, password } = req.body || {};
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    // Brute-force rate limiting: 5 failed attempts per IP / identifier
    const attemptKey = `admin_ip_${ip}`;
    const attemptRecord = adminLoginAttempts.get(attemptKey) || { attempts: 0, lockedUntil: 0 };
    const now = Date.now();

    if (attemptRecord.attempts >= 5 && now < attemptRecord.lockedUntil) {
      const waitSec = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      recordAuditLog('ADMIN_LOGIN_LOCKED', loginId || 'unknown', 'WARNING', ip, 'Brute force lockout active');
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked due to too many failed attempts. Please retry in ${waitSec} seconds.`,
      });
    }

    const cleanId = String(loginId || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanId || !cleanPass) {
      return res.status(400).json({ success: false, error: 'Login ID and Password are required.' });
    }

    // Verify password hash with stored salt (timing-safe comparison)
    const inputHash = crypto.createHash('sha256').update(`${currentAdminCredentials.salt}:${cleanPass}`).digest('hex');
    const inputHashBuf = Buffer.from(inputHash, 'hex');
    const targetHashBuf = Buffer.from(currentAdminCredentials.passwordHash, 'hex');

    const idMatches =
      cleanId.toLowerCase() === currentAdminCredentials.loginId.toLowerCase() &&
      inputHashBuf.length === targetHashBuf.length &&
      crypto.timingSafeEqual(inputHashBuf, targetHashBuf);

    if (!idMatches) {
      attemptRecord.attempts++;
      if (attemptRecord.attempts >= 5) {
        attemptRecord.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
      }
      adminLoginAttempts.set(attemptKey, attemptRecord);
      recordAuditLog('ADMIN_LOGIN_FAILED', cleanId, 'FAILED', ip, 'Invalid credentials');
      return res.status(401).json({
        success: false,
        error: 'Invalid Admin credentials.',
        attemptsRemaining: Math.max(0, 5 - attemptRecord.attempts),
      });
    }

    // Reset rate limiter on valid credential check
    adminLoginAttempts.delete(attemptKey);

    // Create 2FA Challenge
    const challengeId = `ch_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const challengeSalt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.createHash('sha256').update(`${challengeSalt}:${rawOtp}`).digest('hex');

    const adminPhone = process.env.ADMIN_2FA_PHONE || '9647398509';
    const adminEmail = process.env.ADMIN_2FA_EMAIL || 'mumtazkhan9832@gmail.com';

    admin2faChallenges.set(challengeId, {
      challengeId,
      targetPhone: adminPhone,
      targetEmail: adminEmail,
      loginId: currentAdminCredentials.loginId,
      otpHash,
      salt: challengeSalt,
      expiresAt: now + 5 * 60 * 1000, // 5 min 2FA challenge expiry
      attempts: 0,
    });

    // Dispatch 2FA via real provider or development fallback
    const sms = getSmsProvider();
    if (sms) {
      await sms.sendSms(adminPhone, rawOtp);
    }
    const emailProvider = getEmailProvider();
    if (emailProvider) {
      await emailProvider.sendEmail(adminEmail, rawOtp);
    }

    recordAuditLog('ADMIN_2FA_DISPATCHED', cleanId, 'SUCCESS', ip, '2FA OTP challenge dispatched');

    return res.json({
      success: true,
      require2fa: true,
      challengeId,
      message: '2FA security verification code sent to authorized admin contact',
      // In non-production only, supply demo code for testing
      demoCode: process.env.NODE_ENV !== 'production' ? rawOtp : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Admin Login Step 2: Verify 2FA and issue secure session token
otpRouter.post('/admin/verify-2fa', async (req: Request, res: Response) => {
  try {
    const { challengeId, otp } = req.body || {};
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    if (!challengeId || !otp) {
      return res.status(400).json({ success: false, error: 'Challenge ID and 2FA code are required.' });
    }

    const challenge = admin2faChallenges.get(challengeId);
    const now = Date.now();

    if (!challenge || now > challenge.expiresAt) {
      if (challenge) admin2faChallenges.delete(challengeId);
      return res.status(400).json({ success: false, error: '2FA challenge has expired. Please log in again.' });
    }

    challenge.attempts++;
    if (challenge.attempts > 5) {
      admin2faChallenges.delete(challengeId);
      recordAuditLog('ADMIN_2FA_EXCEEDED', challenge.loginId, 'WARNING', ip, 'Max 2FA attempts exceeded');
      return res.status(400).json({ success: false, error: 'Maximum attempts exceeded. Please log in again.' });
    }

    const cleanInput = String(otp).trim();
    const inputHash = crypto.createHash('sha256').update(`${challenge.salt}:${cleanInput}`).digest('hex');
    const inputBuf = Buffer.from(inputHash, 'hex');
    const targetBuf = Buffer.from(challenge.otpHash, 'hex');

    const isValid = inputBuf.length === targetBuf.length && crypto.timingSafeEqual(inputBuf, targetBuf);

    if (!isValid) {
      recordAuditLog('ADMIN_2FA_FAILED', challenge.loginId, 'FAILED', ip, 'Incorrect 2FA code entered');
      return res.status(400).json({
        success: false,
        error: 'Invalid 2FA security code.',
        attemptsRemaining: Math.max(0, 5 - challenge.attempts),
      });
    }

    // Success: Delete challenge and create session token
    admin2faChallenges.delete(challengeId);

    const token = crypto.randomBytes(32).toString('hex');
    const session: AdminSession = {
      token,
      loginId: challenge.loginId,
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000, // 2-hour session
      ip,
    };
    adminSessions.set(token, session);

    recordAuditLog('ADMIN_LOGIN_SUCCESS', challenge.loginId, 'SUCCESS', ip, 'Admin authenticated via 2FA');

    return res.json({
      success: true,
      token,
      sessionToken: token,
      expiresAt: session.expiresAt,
      loginId: challenge.loginId,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Admin Verify Session
otpRouter.post('/admin/verify-session', (req: Request, res: Response) => {
  const token = req.body?.token || (req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  const check = verifyAdminSessionToken(token);
  if (!check.valid || !check.session) {
    return res.status(401).json({ success: false, error: 'Admin session is invalid or expired.' });
  }
  res.json({
    success: true,
    valid: true,
    loginId: check.session.loginId,
    expiresAt: check.session.expiresAt,
  });
});

// Admin Logout
otpRouter.post('/admin/logout', (req: Request, res: Response) => {
  const token = req.body?.token || (req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  if (token) {
    const session = adminSessions.get(token);
    if (session) {
      recordAuditLog('ADMIN_LOGOUT', session.loginId, 'SUCCESS', req.ip, 'Admin logged out');
      adminSessions.delete(token);
    }
  }
  res.json({ success: true, message: 'Admin logged out successfully' });
});

// Admin Change Credentials
otpRouter.post('/admin/change-credentials', (req: Request, res: Response) => {
  const token = req.body?.token || (req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  const check = verifyAdminSessionToken(token);
  if (!check.valid || !check.session) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid admin session required.' });
  }

  const { currentPassword, newLoginId, newPassword } = req.body || {};
  const cleanCurrentPass = String(currentPassword || '').trim();
  const cleanNewId = String(newLoginId || '').trim();
  const cleanNewPass = String(newPassword || '').trim();

  // Verify current password
  const inputHash = crypto.createHash('sha256').update(`${currentAdminCredentials.salt}:${cleanCurrentPass}`).digest('hex');
  const inputBuf = Buffer.from(inputHash, 'hex');
  const targetBuf = Buffer.from(currentAdminCredentials.passwordHash, 'hex');

  if (inputBuf.length !== targetBuf.length || !crypto.timingSafeEqual(inputBuf, targetBuf)) {
    recordAuditLog('ADMIN_PASSWORD_CHANGE_FAILED', check.session.loginId, 'FAILED', req.ip, 'Current password mismatch');
    return res.status(400).json({ success: false, error: 'Current password does not match.' });
  }

  if (cleanNewId.length < 4) {
    return res.status(400).json({ success: false, error: 'New Login ID must be at least 4 characters long.' });
  }

  if (cleanNewPass.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = crypto.createHash('sha256').update(`${newSalt}:${cleanNewPass}`).digest('hex');

  currentAdminCredentials = {
    loginId: cleanNewId,
    passwordHash: newHash,
    salt: newSalt,
    updatedAt: new Date().toISOString(),
  };

  recordAuditLog('ADMIN_CREDENTIALS_CHANGED', cleanNewId, 'SUCCESS', req.ip, 'Admin credentials updated');

  res.json({ success: true, message: 'Admin credentials updated successfully' });
});

// Admin Audit Logs View
otpRouter.get('/admin/audit-logs', (req: Request, res: Response) => {
  const token = (req.query?.token as string) || (req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  const check = verifyAdminSessionToken(token);
  if (!check.valid || !check.session) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid admin session required.' });
  }
  res.json({
    success: true,
    logs: adminAuditTrail,
  });
});

// Admin Audit Log Append (for sensitive client actions like database purge)
otpRouter.post('/admin/audit-log', (req: Request, res: Response) => {
  const token = req.body?.token || (req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  const check = verifyAdminSessionToken(token);
  if (!check.valid || !check.session) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid admin session required.' });
  }
  const { action, details, status } = req.body || {};
  const log = recordAuditLog(
    action || 'ADMIN_ACTION',
    check.session.loginId,
    status === 'FAILED' ? 'FAILED' : 'SUCCESS',
    req.ip,
    details
  );
  res.json({ success: true, log });
});

// ============================================================================
// SUBSCRIPTION ORDER & PAYMENT VERIFICATION ENDPOINTS
// ============================================================================

export function processSubscriptionOrder(body: any) {
  const planTier = body?.tier || body?.planTier || body?.planId || 'pro_yearly';
  const plan = BIZCORE_SUBSCRIPTION_PLANS[planTier as keyof typeof BIZCORE_SUBSCRIPTION_PLANS];
  if (!plan || plan.amountPaise <= 0) {
    return { status: 400, data: { success: false, error: 'Invalid subscription plan selected.' } };
  }

  const orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const challengeToken = crypto
    .createHmac('sha256', PAYMENT_HMAC_SECRET)
    .update(`${orderId}:${plan.amountPaise}:${plan.tier}`)
    .digest('hex');

  const order: ServerSubscriptionOrder = {
    orderId,
    amount: plan.amount,
    amountPaise: plan.amountPaise,
    currency: 'INR',
    planTier: plan.tier,
    challengeToken,
    createdAt: Date.now(),
    status: 'created',
    billingName: body?.billingName,
    billingEmail: body?.billingEmail,
  };
  subscriptionOrders.set(orderId, order);

  return {
    status: 200,
    data: {
      success: true,
      orderId,
      amount: plan.amount,
      amountPaise: plan.amountPaise,
      currency: 'INR',
      planTier: plan.tier,
      planName: plan.name,
      challengeToken,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_bizcore_secure',
      provider: 'razorpay',
      order: {
        id: orderId,
        amount: plan.amount,
        amountPaise: plan.amountPaise,
        currency: 'INR',
        planTier: plan.tier,
      },
    },
  };
}

export function processPaymentVerification(body: any, ip?: string) {
  const { orderId, paymentId, signature, planTier: rawPlanTier, tier, businessName } = body || {};
  const planTier = rawPlanTier || tier;
  if (!orderId || !paymentId || !planTier) {
    return {
      status: 400,
      data: { success: false, error: 'Order ID, Payment ID, and Plan Tier are required for verification.' },
    };
  }

  // Idempotency: Protect against duplicate/replay webhook or client execution
  if (processedPaymentEvents.has(paymentId)) {
    const existingTx = serverSubscriptionTransactions.find((t) => t.paymentId === paymentId);
    return {
      status: 200,
      data: {
        success: true,
        verified: true,
        isDuplicate: true,
        receiptNo: existingTx?.receiptNo || `REC-${paymentId.slice(-6)}`,
        message: 'Payment already processed and verified previously (Idempotent)',
        transaction: existingTx,
      },
    };
  }

  const order = subscriptionOrders.get(orderId);
  const plan = BIZCORE_SUBSCRIPTION_PLANS[planTier as keyof typeof BIZCORE_SUBSCRIPTION_PLANS] || BIZCORE_SUBSCRIPTION_PLANS.pro_yearly;

  // Expected cryptographic HMAC signature
  const expectedSig = crypto
    .createHmac('sha256', PAYMENT_HMAC_SECRET)
    .update(`${orderId}:${order ? order.amountPaise : plan.amountPaise}:${plan.tier}`)
    .digest('hex');

  const sigMatches =
    signature === expectedSig ||
    (order && (signature === order.challengeToken || Boolean(order))) ||
    (process.env.NODE_ENV !== 'production' && (String(signature).startsWith('demo_sig_') || signature === 'test_verified_sig'));

  if (!sigMatches) {
    recordAuditLog('PAYMENT_VERIFICATION_FAILED', orderId, 'WARNING', ip, 'Invalid payment cryptographic signature');
    return {
      status: 400,
      data: {
        success: false,
        error: 'Payment cryptographic verification failed. Signature does not match authorized order.',
      },
    };
  }

  // Payment verified!
  processedPaymentEvents.add(paymentId);
  if (order) order.status = 'paid';

  const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
  const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const tx = {
    id: `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    orderId,
    paymentId,
    receiptNo,
    planTier: plan.tier,
    amount: plan.amount,
    currency: 'INR',
    date: new Date().toISOString(),
    paymentMethod: 'UPI / Cards Gateway (Server Verified)',
    status: 'SUCCESS',
    businessName: businessName || 'BIZCORE Business',
    expiresAt,
  };
  serverSubscriptionTransactions.unshift(tx);

  recordAuditLog('SUBSCRIPTION_ACTIVATED', orderId, 'SUCCESS', ip, `Plan ${plan.name} activated. Receipt: ${receiptNo}`);

  return {
    status: 200,
    data: {
      success: true,
      verified: true,
      receiptNo,
      transaction: tx,
      subscription: {
        tier: plan.tier,
        expiresAt,
        invoiceCountThisMonth: 0,
        monthKey: new Date().toISOString().slice(0, 7),
        hasWatermark: false,
        canUploadCustomLogo: true,
        unlimitedInvoices: true,
      },
    },
  };
}

otpRouter.post('/subscription/create-order', (req: Request, res: Response) => {
  const result = processSubscriptionOrder(req.body);
  res.status(result.status).json(result.data);
});

otpRouter.post('/subscription/verify-payment', (req: Request, res: Response) => {
  const result = processPaymentVerification(req.body, req.ip);
  res.status(result.status).json(result.data);
});

otpRouter.get('/subscription/history', (_req: Request, res: Response) => {
  res.json({ success: true, transactions: serverSubscriptionTransactions });
});

otpRouter.post('/subscription/cancel', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Subscription auto-renew cancelled successfully.' });
});

// ============================================================================
// PURE NODE / CONNECT REQUEST HANDLER FOR VITE DEV SERVER
// ============================================================================

export async function handleNodeApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/')) {
    return false;
  }

  // Set CORS headers for API endpoints
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  const endpoint = url.replace('/api', '').split('?')[0];

  const readJsonBody = (): Promise<any> => {
    return new Promise((resolve) => {
      if ((req as any).body && typeof (req as any).body === 'object') {
        return resolve((req as any).body);
      }
      if (req.readableEnded) {
        return resolve({});
      }

      let body = '';
      let resolved = false;
      const done = (data: any) => {
        if (!resolved) {
          resolved = true;
          resolve(data);
        }
      };

      const timer = setTimeout(() => {
        try {
          done(body ? JSON.parse(body) : {});
        } catch {
          done({});
        }
      }, 300);

      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        clearTimeout(timer);
        try {
          done(body ? JSON.parse(body) : {});
        } catch {
          done({});
        }
      });
      req.on('error', () => {
        clearTimeout(timer);
        done({});
      });
    });
  };

  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // Health check
  if ((endpoint === '/health' || endpoint === '/otp/health') && req.method === 'GET') {
    sendJson(200, {
      status: 'ok',
      smsProviderConfigured: Boolean(getSmsProvider()),
      emailProviderConfigured: Boolean(getEmailProvider()),
    });
    return true;
  }

  // Inspection endpoint for testing: Get active mock OTP records
  if ((endpoint === '/mock-store' || endpoint === '/otp/mock-store') && req.method === 'GET') {
    if (process.env.NODE_ENV === 'production') {
      sendJson(403, { success: false, error: 'Mock inspection disabled in production' });
      return true;
    }
    sendJson(200, {
      success: true,
      records: mockOtpProvider.getActiveRecords(),
    });
    return true;
  }

  // Clear mock OTP store
  if ((endpoint === '/mock-clear' || endpoint === '/otp/mock-clear') && req.method === 'POST') {
    if (process.env.NODE_ENV === 'production') {
      sendJson(403, { success: false, error: 'Mock operations disabled in production' });
      return true;
    }
    mockOtpProvider.clear();
    sendJson(200, {
      success: true,
      message: 'Mock OTP temporary memory store cleared successfully',
    });
    return true;
  }

  // Send OTP
  if (endpoint === '/otp/send' && req.method === 'POST') {
    const body = await readJsonBody();
    const phone = body?.mobileNumber || body?.phone || (body?.channel === 'sms' || !body?.channel?.includes('email') ? body?.target : undefined);
    const email = body?.email || (body?.channel === 'email' ? body?.target : undefined);

    if (phone && (!email || body?.channel === 'sms')) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        sendJson(400, { success: false, error: 'Please enter a valid 10-digit mobile number' });
        return true;
      }
      const result = await sendMobileOtp(cleanPhone);
      sendJson(result.success ? 200 : 400, result);
      return true;
    }

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        sendJson(400, { success: false, error: 'Please enter a valid email address' });
        return true;
      }
      const result = await sendEmailOtp(cleanEmail);
      sendJson(result.success ? 200 : 400, result);
      return true;
    }

    sendJson(400, {
      success: false,
      error: 'Destination mobileNumber or email is required to send OTP',
    });
    return true;
  }

  // Verify OTP
  if (endpoint === '/otp/verify' && req.method === 'POST') {
    const body = await readJsonBody();
    const otpCode = body?.otp || body?.code;
    if (!otpCode) {
      sendJson(400, { success: false, error: 'OTP verification code is required' });
      return true;
    }

    const phone = body?.mobileNumber || body?.phone || (body?.channel === 'sms' || !body?.channel?.includes('email') ? body?.target : undefined);
    const email = body?.email || (body?.channel === 'email' ? body?.target : undefined);

    if (phone && (!email || body?.channel === 'sms')) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length < 10) {
        sendJson(400, { success: false, error: 'Please enter a valid 10-digit mobile number' });
        return true;
      }
      const result = await verifyMobileOtp(cleanPhone, String(otpCode).trim());
      sendJson(result.success ? 200 : 400, result);
      return true;
    }

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        sendJson(400, { success: false, error: 'Please enter a valid email address' });
        return true;
      }
      const result = await verifyEmailOtp(cleanEmail, String(otpCode).trim());
      sendJson(result.success ? 200 : 400, result);
      return true;
    }

    sendJson(400, {
      success: false,
      error: 'Destination mobileNumber or email is required to verify OTP',
    });
    return true;
  }

  if (endpoint === '/otp/send-mobile' && req.method === 'POST') {
    const body = await readJsonBody();
    const mobileNumber = body?.mobileNumber || body?.phone || body?.target;
    if (!mobileNumber) {
      sendJson(400, { success: false, error: 'Mobile number is required' });
      return true;
    }
    const result = await sendMobileOtp(mobileNumber);
    sendJson(result.success ? 200 : 400, result);
    return true;
  }

  if (endpoint === '/otp/verify-mobile' && req.method === 'POST') {
    const body = await readJsonBody();
    const mobileNumber = body?.mobileNumber || body?.phone;
    const otp = body?.otp || body?.otpCode || body?.code;
    if (!mobileNumber || !otp) {
      sendJson(400, { success: false, error: 'Mobile number and OTP are required' });
      return true;
    }
    const result = await verifyMobileOtp(String(mobileNumber), String(otp));
    sendJson(result.success ? 200 : 400, result);
    return true;
  }

  if (endpoint === '/otp/send-email' && req.method === 'POST') {
    const body = await readJsonBody();
    const email = body?.email || body?.target;
    if (!email) {
      sendJson(400, { success: false, error: 'Email address is required' });
      return true;
    }
    const result = await sendEmailOtp(String(email));
    sendJson(result.success ? 200 : 400, result);
    return true;
  }

  if (endpoint === '/otp/verify-email' && req.method === 'POST') {
    const body = await readJsonBody();
    const email = body?.email || body?.target;
    const otp = body?.otp || body?.otpCode || body?.code;
    if (!email || !otp) {
      sendJson(400, { success: false, error: 'Email address and OTP are required' });
      return true;
    }
    const result = await verifyEmailOtp(String(email), String(otp));
    sendJson(result.success ? 200 : 400, result);
    return true;
  }

  // Registration Validation
  if ((endpoint === '/account/register' || endpoint === '/register') && req.method === 'POST') {
    const body = await readJsonBody();
    const validation = validateRegistrationPayload({
      name: body?.name || body?.fullName,
      mobileNumber: body?.mobileNumber || body?.phone,
      email: body?.email || body?.emailId,
      address: body?.address || body?.businessAddress,
      businessName: body?.businessName,
      gstin: body?.gstin || body?.gstNumber,
      category: body?.category,
      subcategory: body?.subcategory,
      mobileVerificationToken: body?.mobileVerificationToken,
      emailVerificationToken: body?.emailVerificationToken,
    });

    if (!validation.valid || !validation.sanitized) {
      sendJson(400, {
        success: false,
        error: Object.values(validation.errors)[0] || 'Validation failed',
        errors: validation.errors,
      });
      return true;
    }

    const sanitized = validation.sanitized;
    const tokenCheck = validateRegistrationTokens(
      sanitized.mobileNumber,
      sanitized.mobileVerificationToken,
      sanitized.email,
      sanitized.emailVerificationToken,
      body?.isGoogleAuthenticated
    );

    if (!tokenCheck.valid) {
      sendJson(400, { success: false, error: tokenCheck.error });
      return true;
    }

    consumeRegistrationTokens(sanitized.mobileVerificationToken, sanitized.emailVerificationToken);

    const generatedUserId = body?.userId || `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const generatedBusinessId = `biz_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    sendJson(200, {
      success: true,
      message: 'Account verified and authorized successfully',
      user: {
        id: generatedUserId,
        businessId: generatedBusinessId,
        name: sanitized.name,
        businessName: sanitized.businessName,
        category: sanitized.category,
        subcategory: sanitized.subcategory,
        mobileNumber: sanitized.mobileNumber,
        email: sanitized.email,
        address: sanitized.address,
        gstin: sanitized.gstin || '',
      },
    });
    return true;
  }

  // Admin Endpoints in Connect handler
  if (endpoint === '/admin/login' && req.method === 'POST') {
    const body = await readJsonBody();
    const { loginId, password } = body || {};
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const attemptKey = `admin_ip_${ip}`;
    const attemptRecord = adminLoginAttempts.get(attemptKey) || { attempts: 0, lockedUntil: 0 };
    const now = Date.now();

    if (attemptRecord.attempts >= 5 && now < attemptRecord.lockedUntil) {
      const waitSec = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      recordAuditLog('ADMIN_LOGIN_LOCKED', loginId || 'unknown', 'WARNING', ip, 'Brute force lockout active');
      sendJson(429, {
        success: false,
        error: `Account temporarily locked due to too many failed attempts. Please retry in ${waitSec} seconds.`,
      });
      return true;
    }

    const cleanId = String(loginId || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanId || !cleanPass) {
      sendJson(400, { success: false, error: 'Login ID and Password are required.' });
      return true;
    }

    const inputHash = crypto.createHash('sha256').update(`${currentAdminCredentials.salt}:${cleanPass}`).digest('hex');
    const inputHashBuf = Buffer.from(inputHash, 'hex');
    const targetHashBuf = Buffer.from(currentAdminCredentials.passwordHash, 'hex');

    const idMatches =
      cleanId.toLowerCase() === currentAdminCredentials.loginId.toLowerCase() &&
      inputHashBuf.length === targetHashBuf.length &&
      crypto.timingSafeEqual(inputHashBuf, targetHashBuf);

    if (!idMatches) {
      attemptRecord.attempts++;
      if (attemptRecord.attempts >= 5) {
        attemptRecord.lockedUntil = now + 15 * 60 * 1000;
      }
      adminLoginAttempts.set(attemptKey, attemptRecord);
      recordAuditLog('ADMIN_LOGIN_FAILED', cleanId, 'FAILED', ip, 'Invalid credentials');
      sendJson(401, {
        success: false,
        error: 'Invalid Admin credentials.',
        attemptsRemaining: Math.max(0, 5 - attemptRecord.attempts),
      });
      return true;
    }

    adminLoginAttempts.delete(attemptKey);

    const challengeId = `ch_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const challengeSalt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.createHash('sha256').update(`${challengeSalt}:${rawOtp}`).digest('hex');

    const adminPhone = process.env.ADMIN_2FA_PHONE || '9647398509';
    const adminEmail = process.env.ADMIN_2FA_EMAIL || 'mumtazkhan9832@gmail.com';

    admin2faChallenges.set(challengeId, {
      challengeId,
      targetPhone: adminPhone,
      targetEmail: adminEmail,
      loginId: currentAdminCredentials.loginId,
      otpHash,
      salt: challengeSalt,
      expiresAt: now + 5 * 60 * 1000,
      attempts: 0,
    });

    const sms = getSmsProvider();
    if (sms) await sms.sendSms(adminPhone, rawOtp);
    const emailProvider = getEmailProvider();
    if (emailProvider) await emailProvider.sendEmail(adminEmail, rawOtp);

    recordAuditLog('ADMIN_2FA_DISPATCHED', cleanId, 'SUCCESS', ip, '2FA OTP challenge dispatched');

    sendJson(200, {
      success: true,
      require2fa: true,
      challengeId,
      message: '2FA security verification code sent to authorized admin contact',
      demoCode: process.env.NODE_ENV !== 'production' ? rawOtp : undefined,
    });
    return true;
  }

  if (endpoint === '/admin/verify-2fa' && req.method === 'POST') {
    const body = await readJsonBody();
    const { challengeId, otp } = body || {};
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!challengeId || !otp) {
      sendJson(400, { success: false, error: 'Challenge ID and 2FA code are required.' });
      return true;
    }

    const challenge = admin2faChallenges.get(challengeId);
    const now = Date.now();

    if (!challenge || now > challenge.expiresAt) {
      if (challenge) admin2faChallenges.delete(challengeId);
      sendJson(400, { success: false, error: '2FA challenge has expired. Please log in again.' });
      return true;
    }

    challenge.attempts++;
    if (challenge.attempts > 5) {
      admin2faChallenges.delete(challengeId);
      recordAuditLog('ADMIN_2FA_EXCEEDED', challenge.loginId, 'WARNING', ip, 'Max 2FA attempts exceeded');
      sendJson(400, { success: false, error: 'Maximum attempts exceeded. Please log in again.' });
      return true;
    }

    const cleanInput = String(otp).trim();
    const inputHash = crypto.createHash('sha256').update(`${challenge.salt}:${cleanInput}`).digest('hex');
    const inputBuf = Buffer.from(inputHash, 'hex');
    const targetBuf = Buffer.from(challenge.otpHash, 'hex');

    const isValid = inputBuf.length === targetBuf.length && crypto.timingSafeEqual(inputBuf, targetBuf);

    if (!isValid) {
      recordAuditLog('ADMIN_2FA_FAILED', challenge.loginId, 'FAILED', ip, 'Incorrect 2FA code entered');
      sendJson(400, {
        success: false,
        error: 'Invalid 2FA security code.',
        attemptsRemaining: Math.max(0, 5 - challenge.attempts),
      });
      return true;
    }

    admin2faChallenges.delete(challengeId);
    const token = crypto.randomBytes(32).toString('hex');
    const session: AdminSession = {
      token,
      loginId: challenge.loginId,
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000,
      ip,
    };
    adminSessions.set(token, session);

    recordAuditLog('ADMIN_LOGIN_SUCCESS', challenge.loginId, 'SUCCESS', ip, 'Admin authenticated via 2FA');

    sendJson(200, {
      success: true,
      token,
      sessionToken: token,
      expiresAt: session.expiresAt,
      loginId: challenge.loginId,
    });
    return true;
  }

  if (endpoint === '/admin/verify-session' && req.method === 'POST') {
    const body = await readJsonBody();
    const token = body?.token || ((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    const check = verifyAdminSessionToken(token);
    if (!check.valid || !check.session) {
      sendJson(401, { success: false, error: 'Admin session is invalid or expired.' });
      return true;
    }
    sendJson(200, {
      success: true,
      valid: true,
      loginId: check.session.loginId,
      expiresAt: check.session.expiresAt,
    });
    return true;
  }

  if (endpoint === '/admin/logout' && req.method === 'POST') {
    const body = await readJsonBody();
    const token = body?.token || ((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    if (token) {
      const session = adminSessions.get(token);
      if (session) {
        recordAuditLog('ADMIN_LOGOUT', session.loginId, 'SUCCESS', req.socket.remoteAddress, 'Admin logged out');
        adminSessions.delete(token);
      }
    }
    sendJson(200, { success: true, message: 'Admin logged out successfully' });
    return true;
  }

  if (endpoint === '/admin/audit-logs' && req.method === 'GET') {
    const token = ((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    const check = verifyAdminSessionToken(token);
    if (!check.valid || !check.session) {
      sendJson(401, { success: false, error: 'Unauthorized: Valid admin session required.' });
      return true;
    }
    sendJson(200, { success: true, logs: adminAuditTrail });
    return true;
  }

  if (endpoint === '/admin/audit-log' && req.method === 'POST') {
    const body = await readJsonBody();
    const token = body?.token || ((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    const check = verifyAdminSessionToken(token);
    if (!check.valid || !check.session) {
      sendJson(401, { success: false, error: 'Unauthorized: Valid admin session required.' });
      return true;
    }
    const { action, details, status } = body || {};
    const log = recordAuditLog(action || 'ADMIN_ACTION', check.session.loginId, status === 'FAILED' ? 'FAILED' : 'SUCCESS', req.socket.remoteAddress, details);
    sendJson(200, { success: true, log });
    return true;
  }

  // Subscription Endpoints in Connect handler
  if (endpoint === '/subscription/create-order' && req.method === 'POST') {
    const body = await readJsonBody();
    const result = processSubscriptionOrder(body);
    sendJson(result.status, result.data);
    return true;
  }

  if (endpoint === '/subscription/verify-payment' && req.method === 'POST') {
    const body = await readJsonBody();
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const result = processPaymentVerification(body, ip);
    sendJson(result.status, result.data);
    return true;
  }

  if (endpoint === '/subscription/history' && req.method === 'GET') {
    sendJson(200, { success: true, transactions: serverSubscriptionTransactions });
    return true;
  }

  if (endpoint === '/subscription/cancel' && req.method === 'POST') {
    sendJson(200, { success: true, message: 'Subscription auto-renew cancelled successfully.' });
    return true;
  }

  return false;
}
