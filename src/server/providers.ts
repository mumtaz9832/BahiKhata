/**
 * OTP Delivery Providers Abstraction
 * Supports real transactional SMS and Email providers:
 * - Fast2SMS, Twilio, MSG91 (SMS)
 * - Resend, SendGrid, Postmark (Email)
 *
 * If no provider is configured via environment variables, returns null.
 */

export interface SmsProvider {
  name: string;
  sendSms(to: string, otp: string): Promise<{ success: boolean; error?: string }>;
}

export interface EmailProvider {
  name: string;
  sendEmail(to: string, otp: string): Promise<{ success: boolean; error?: string }>;
}

// 1. Fast2SMS Provider (Commonly used in India for transactional OTPs)
export class Fast2SmsProvider implements SmsProvider {
  name = 'Fast2SMS';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendSms(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanPhone = to.replace(/\D/g, '').slice(-10);
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables_values: otp,
          route: 'otp',
          numbers: cleanPhone,
        }),
      });

      const data = await response.json();
      if (response.ok && data?.return) {
        return { success: true };
      }
      return { success: false, error: data?.message || 'Fast2SMS delivery failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error reaching SMS gateway' };
    }
  }
}

// 2. Twilio SMS Provider
export class TwilioSmsProvider implements SmsProvider {
  name = 'Twilio';
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendSms(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanPhone = to.startsWith('+') ? to : `+91${to.replace(/\D/g, '').slice(-10)}`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams({
        To: cleanPhone,
        From: this.fromNumber,
        Body: `Your BahiKhata verification code is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const data = await response.json();
      if (response.ok && data?.sid) {
        return { success: true };
      }
      return { success: false, error: data?.message || 'Twilio SMS delivery failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Twilio API communication error' };
    }
  }
}

// 3. MSG91 SMS Provider
export class Msg91SmsProvider implements SmsProvider {
  name = 'MSG91';
  private authKey: string;
  private templateId: string;

  constructor(authKey: string, templateId: string) {
    this.authKey = authKey;
    this.templateId = templateId;
  }

  async sendSms(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanPhone = to.replace(/\D/g, '').slice(-10);
      const response = await fetch(
        `https://control.msg91.com/api/v5/otp?template_id=${this.templateId}&mobile=91${cleanPhone}&authkey=${this.authKey}&otp=${otp}`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (response.ok && data?.type === 'success') {
        return { success: true };
      }
      return { success: false, error: data?.message || 'MSG91 delivery failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'MSG91 communication error' };
    }
  }
}

// 4. Resend Email Provider
export class ResendEmailProvider implements EmailProvider {
  name = 'Resend';
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail = 'BahiKhata Security <onboarding@resend.dev>') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject: `${otp} is your BahiKhata Email Verification Code`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">BahiKhata Account Verification</h2>
              <p style="color: #475569; font-size: 14px;">Use the verification code below to verify your email address. This code is valid for 5 minutes.</p>
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #d97706;">${otp}</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">If you did not request this verification code, please ignore this email.</p>
            </div>
          `,
        }),
      });

      const data = await response.json();
      if (response.ok && data?.id) {
        return { success: true };
      }
      return { success: false, error: data?.message || 'Resend email delivery failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Resend API communication error' };
    }
  }
}

// 5. SendGrid Email Provider
export class SendGridEmailProvider implements EmailProvider {
  name = 'SendGrid';
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail = 'verify@bahikhata.app') {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: this.fromEmail, name: 'BahiKhata Verification' },
          subject: `${otp} is your BahiKhata Verification Code`,
          content: [
            {
              type: 'text/html',
              value: `<p>Your BahiKhata verification code is <strong>${otp}</strong>. Valid for 5 minutes.</p>`,
            },
          ],
        }),
      });

      if (response.ok || response.status === 202) {
        return { success: true };
      }
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data?.errors?.[0]?.message || 'SendGrid delivery failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'SendGrid API communication error' };
    }
  }
}

/**
 * Factory functions to retrieve configured providers based on environment variables
 */
export function getSmsProvider(): SmsProvider | null {
  if (process.env.FAST2SMS_API_KEY) {
    return new Fast2SmsProvider(process.env.FAST2SMS_API_KEY);
  }
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    return new TwilioSmsProvider(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
      process.env.TWILIO_PHONE_NUMBER
    );
  }
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    return new Msg91SmsProvider(process.env.MSG91_AUTH_KEY, process.env.MSG91_TEMPLATE_ID);
  }
  return null;
}

export function getEmailProvider(): EmailProvider | null {
  if (process.env.RESEND_API_KEY) {
    return new ResendEmailProvider(process.env.RESEND_API_KEY, process.env.RESEND_FROM_EMAIL);
  }
  if (process.env.SENDGRID_API_KEY) {
    return new SendGridEmailProvider(process.env.SENDGRID_API_KEY, process.env.SENDGRID_FROM_EMAIL);
  }
  return null;
}
