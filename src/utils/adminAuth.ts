/**
 * BIZCORE Master Admin Authentication & Security Client
 * Powered by Server-Authoritative Authentication, Rate Limiting, 2FA, and Audit Logs.
 * No plaintext passwords or hardcoded admin secrets exist on the client side.
 */

const STORAGE_KEY_ADMIN_TOKEN = 'bizcore_admin_session_token_v2';
const STORAGE_KEY_ADMIN_EXPIRY = 'bizcore_admin_session_expiry_v2';
const STORAGE_KEY_ADMIN_LOGIN_ID = 'bizcore_admin_login_id_v2';

export const ADMIN_2FA_PHONE = '9647398509';
export const ADMIN_2FA_EMAIL = 'mumtazkhan9832@gmail.com';

export interface AdminLoginStep1Result {
  success: boolean;
  require2fa?: boolean;
  challengeId?: string;
  demoCode?: string;
  error?: string;
}

export interface AdminLoginStep2Result {
  success: boolean;
  token?: string;
  expiresAt?: number;
  loginId?: string;
  error?: string;
}

/**
 * Step 1: Submit Admin Credentials to secure server endpoint
 */
export async function authenticateAdminStep1(
  loginId: string,
  password: string
): Promise<AdminLoginStep1Result> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Invalid Admin credentials' };
    }
    return {
      success: true,
      require2fa: data.require2fa,
      challengeId: data.challengeId,
      demoCode: data.demoCode,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during admin authentication' };
  }
}

/**
 * Step 2: Submit 2FA verification code to receive server session token
 */
export async function authenticateAdminStep2(
  challengeId: string,
  otp: string
): Promise<AdminLoginStep2Result> {
  try {
    const res = await fetch('/api/admin/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, otp }),
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.token) {
      return { success: false, error: data.error || '2FA verification failed' };
    }

    // Persist session token and expiry
    localStorage.setItem(STORAGE_KEY_ADMIN_TOKEN, data.token);
    localStorage.setItem(STORAGE_KEY_ADMIN_EXPIRY, String(data.expiresAt));
    if (data.loginId) {
      localStorage.setItem(STORAGE_KEY_ADMIN_LOGIN_ID, data.loginId);
    }

    return {
      success: true,
      token: data.token,
      expiresAt: data.expiresAt,
      loginId: data.loginId,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during 2FA verification' };
  }
}

/**
 * Checks if a valid, unexpired server session token exists in storage
 */
export function isAdminLoggedIn(): boolean {
  try {
    const token = localStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
    const expiry = Number(localStorage.getItem(STORAGE_KEY_ADMIN_EXPIRY) || 0);
    if (!token || !expiry) return false;
    if (Date.now() > expiry) {
      clearAdminSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies active session token with server
 */
export async function verifyAdminSessionWithServer(): Promise<boolean> {
  const token = getAdminSessionToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/admin/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return true;
    }
    clearAdminSession();
    return false;
  } catch {
    return isAdminLoggedIn(); // fallback to local unexpired check if offline
  }
}

export function getAdminSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
  } catch {
    return null;
  }
}

export function getActiveAdminLoginId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_LOGIN_ID) || 'Admin';
  } catch {
    return 'Admin';
  }
}

export function clearAdminSession(): void {
  try {
    const token = localStorage.getItem(STORAGE_KEY_ADMIN_TOKEN);
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY_ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEY_ADMIN_EXPIRY);
    localStorage.removeItem(STORAGE_KEY_ADMIN_LOGIN_ID);
    localStorage.removeItem('bizcore_admin_session_v1');
    localStorage.removeItem('bizcore_admin_credentials_v1');
  } catch {}
}

export function setAdminLoggedIn(loggedIn: boolean): void {
  if (!loggedIn) {
    clearAdminSession();
  }
}

/**
 * Change Admin credentials via server
 */
export async function updateAdminCredentials(
  currentPassword: string,
  newLoginId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const token = getAdminSessionToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin session expired.' };
  }
  try {
    const res = await fetch('/api/admin/change-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newLoginId, newPassword, token }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update credentials' };
    }
    localStorage.setItem(STORAGE_KEY_ADMIN_LOGIN_ID, newLoginId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server error' };
  }
}

/**
 * Record sensitive admin action in server audit log
 */
export async function logAdminAction(action: string, details?: string, status: 'SUCCESS' | 'FAILED' = 'SUCCESS'): Promise<void> {
  const token = getAdminSessionToken();
  if (!token) return;
  try {
    await fetch('/api/admin/audit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, details, status, token }),
    });
  } catch {}
}

/**
 * Fetch server audit logs
 */
export async function fetchAdminAuditLogs(): Promise<any[]> {
  const token = getAdminSessionToken();
  if (!token) return [];
  try {
    const res = await fetch(`/api/admin/audit-logs?token=${token}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.logs || [];
  } catch {
    return [];
  }
}
