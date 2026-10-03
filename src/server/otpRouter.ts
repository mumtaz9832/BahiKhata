import express from 'express';
import type { Request, Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,
  validateRegistrationTokens,
} from './otpService.ts';
import { getSmsProvider, getEmailProvider } from './providers.ts';
import type { ServerRegisterRequest } from './types.ts';

export const otpRouter = express.Router();

// Diagnostic logging middleware for Express /otp routes
otpRouter.use('/otp', (req, _res, next) => {
  const rawBody =
    (req as any).rawBody ??
    (typeof req.body === 'string'
      ? req.body
      : req.body
      ? JSON.stringify(req.body)
      : '(empty)');
  console.log(`\n================== [DIAGNOSTIC LOG: /api/otp (Express)] ==================`);
  console.log(`[Timestamp]: ${new Date().toISOString()}`);
  console.log(`[Request]: ${req.method} ${req.originalUrl || req.url}`);
  console.log(`[Headers]:\n${JSON.stringify(req.headers, null, 2)}`);
  console.log(`[Raw Incoming Body]:\n${rawBody}`);
  console.log(`[Parsed Body (from middleware)]:\n`, req.body);
  console.log(`==========================================================================\n`);
  next();
});

// Health & Config Check
otpRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    smsProviderConfigured: Boolean(getSmsProvider()),
    emailProviderConfigured: Boolean(getEmailProvider()),
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
    const { mobileNumber } = req.body || {};
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
    const { email } = req.body || {};
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

// 5. Server-Side Registration Validation
otpRouter.post('/account/register', async (req: Request, res: Response) => {
  try {
    const data = req.body as ServerRegisterRequest;

    if (!data.fullName || data.fullName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Full name is required (min 2 chars).' });
    }
    if (!data.mobileNumber || data.mobileNumber.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, error: 'Valid 10-digit mobile number is required.' });
    }
    if (!data.businessName || data.businessName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Business name is required (min 2 chars).' });
    }
    if (!data.businessAddress || data.businessAddress.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Business address is required.' });
    }

    // GSTIN validation if entered
    if (data.gstNumber && data.gstNumber.trim()) {
      const cleanGst = data.gstNumber.trim().toUpperCase();
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(cleanGst)) {
        return res.status(400).json({ success: false, error: 'Invalid 15-character GSTIN format.' });
      }
    }

    // Verify cryptographic tokens server-side
    const tokenCheck = validateRegistrationTokens(
      data.mobileNumber,
      data.mobileVerificationToken,
      data.email,
      data.emailVerificationToken,
      data.isGoogleAuthenticated
    );

    if (!tokenCheck.valid) {
      return res.status(400).json({ success: false, error: tokenCheck.error });
    }

    return res.json({
      success: true,
      message: 'Account verified and authorized successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

/**
 * Pure Node / Connect Request Handler (Can be mounted in Vite dev server without Express dependency in vite.config.ts)
 */
export async function handleNodeApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  console.log(JSON.stringify({headers: req.headers, body: (req as any).body, raw: (req as any).rawBody}));
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

  // Helper to read JSON body
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

  // Diagnostic log for incoming /api/otp requests
  if (url.startsWith('/api/otp') || endpoint.startsWith('/otp')) {
    const rawBody =
      (req as any).rawBody ??
      (typeof (req as any).body === 'string'
        ? (req as any).body
        : (req as any).body
        ? JSON.stringify((req as any).body)
        : '(empty)');
    const parsedBody = (req as any).body;

    console.log(`\n================== [DIAGNOSTIC LOG: /api/otp] ==================`);
    console.log(`[Timestamp]: ${new Date().toISOString()}`);
    console.log(`[Request]: ${req.method} ${url}`);
    console.log(`[Headers]:\n${JSON.stringify(req.headers, null, 2)}`);
    console.log(`[Raw Incoming Body]:\n${rawBody}`);
    console.log(`[Parsed Body (from vite.config.ts middleware)]:\n`, parsedBody);
    console.log(`=================================================================\n`);
  }

  if (endpoint === '/health' && req.method === 'GET') {
    sendJson(200, {
      status: 'ok',
      smsProviderConfigured: Boolean(getSmsProvider()),
      emailProviderConfigured: Boolean(getEmailProvider()),
    });
    return true;
  }

  // Explicit Generic /otp/send Route (supports mobileNumber/phone or email)
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

  // Explicit Generic /otp/verify Route (supports mobileNumber/phone or email + otp/code)
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
    if (!body?.mobileNumber) {
      sendJson(400, { success: false, error: 'Mobile number is required' });
      return true;
    }
    const result = await sendMobileOtp(body.mobileNumber);
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

  if (endpoint === '/account/register' && req.method === 'POST') {
    const data = (await readJsonBody()) as ServerRegisterRequest;
    if (!data.fullName || data.fullName.trim().length < 2) {
      sendJson(400, { success: false, error: 'Full name is required (min 2 chars).' });
      return true;
    }
    if (!data.mobileNumber || data.mobileNumber.replace(/\D/g, '').length < 10) {
      sendJson(400, { success: false, error: 'Valid 10-digit mobile number is required.' });
      return true;
    }
    if (!data.businessName || data.businessName.trim().length < 2) {
      sendJson(400, { success: false, error: 'Business name is required (min 2 chars).' });
      return true;
    }
    if (!data.businessAddress || data.businessAddress.trim().length < 3) {
      sendJson(400, { success: false, error: 'Business address is required.' });
      return true;
    }

    const tokenCheck = validateRegistrationTokens(
      data.mobileNumber,
      data.mobileVerificationToken,
      data.email,
      data.emailVerificationToken,
      data.isGoogleAuthenticated
    );

    if (!tokenCheck.valid) {
      sendJson(400, { success: false, error: tokenCheck.error });
      return true;
    }

    sendJson(200, {
      success: true,
      message: 'Account verified and authorized successfully',
    });
    return true;
  }

  return false;
}
