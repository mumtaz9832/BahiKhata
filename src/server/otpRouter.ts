import { Router, Request, Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  sendMobileOtp,
  verifyMobileOtp,
  sendEmailOtp,
  verifyEmailOtp,
  validateRegistrationTokens,
} from './otpService';
import { getSmsProvider, getEmailProvider } from './providers';
import { ServerRegisterRequest } from './types';

export const otpRouter = Router();

// Health & Config Check
otpRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    smsProviderConfigured: Boolean(getSmsProvider()),
    emailProviderConfigured: Boolean(getEmailProvider()),
  });
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
    const { mobileNumber, otp } = req.body || {};
    if (!mobileNumber || !otp) {
      return res.status(400).json({ success: false, error: 'Mobile number and OTP are required' });
    }
    const result = await verifyMobileOtp(mobileNumber, otp);
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
  const url = req.url || '';
  if (!url.startsWith('/api/')) {
    return false;
  }

  const endpoint = url.replace('/api', '').split('?')[0];

  // Helper to read JSON body
  const readJsonBody = (): Promise<any> => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  if (endpoint === '/health' && req.method === 'GET') {
    sendJson(200, {
      status: 'ok',
      smsProviderConfigured: Boolean(getSmsProvider()),
      emailProviderConfigured: Boolean(getEmailProvider()),
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
    if (!body?.mobileNumber || !body?.otp) {
      sendJson(400, { success: false, error: 'Mobile number and OTP are required' });
      return true;
    }
    const result = await verifyMobileOtp(body.mobileNumber, body.otp);
    sendJson(result.success ? 200 : 400, result);
    return true;
  }

  if (endpoint === '/otp/send-email' && req.method === 'POST') {
    const body = await readJsonBody();
    if (!body?.email) {
      sendJson(400, { success: false, error: 'Email address is required' });
      return true;
    }
    const result = await sendEmailOtp(body.email);
    sendJson(result.success ? 200 : 400, result);
    return true;
  }

  if (endpoint === '/otp/verify-email' && req.method === 'POST') {
    const body = await readJsonBody();
    if (!body?.email || !body?.otp) {
      sendJson(400, { success: false, error: 'Email address and OTP are required' });
      return true;
    }
    const result = await verifyEmailOtp(body.email, body.otp);
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
