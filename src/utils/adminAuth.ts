/**
 * BIZCORE Master Admin Authentication & Credentials Management
 * Default Login ID: Mumtazkhan1985
 * Default Password: Mumtaz@1985
 */

const STORAGE_KEY_ADMIN_CREDENTIALS = 'bizcore_admin_credentials_v1';
const STORAGE_KEY_ADMIN_SESSION = 'bizcore_admin_session_v1';

export interface AdminCredentials {
  loginId: string;
  password: string;
  updatedAt: string;
}

export const ADMIN_2FA_PHONE = '9647398509';
export const ADMIN_2FA_EMAIL = 'mumtazkhan9832@gmail.com';

const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  loginId: 'Mumtazkhan1985',
  password: 'Mumtaz@1985',
  updatedAt: new Date().toISOString(),
};

export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_CREDENTIALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.loginId === 'string' && typeof parsed.password === 'string') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading admin credentials:', err);
  }
  // Initialize default credentials
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_CREDENTIALS, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
  } catch {}
  return DEFAULT_ADMIN_CREDENTIALS;
}

export function verifyAdminCredentials(loginId: string, password: string): boolean {
  const current = getAdminCredentials();
  const cleanId = loginId.trim();
  const cleanPass = password.trim();

  const isMatch =
    (cleanId === current.loginId || cleanId.toLowerCase() === current.loginId.toLowerCase()) &&
    cleanPass === current.password;

  if (isMatch) {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, 'true');
    } catch {}
  }
  return isMatch;
}

export function updateAdminCredentials(
  currentPassword: string,
  newLoginId: string,
  newPassword: string
): { success: boolean; error?: string } {
  const current = getAdminCredentials();

  if (currentPassword.trim() !== current.password) {
    return {
      success: false,
      error: 'Current password does not match.',
    };
  }

  const cleanId = newLoginId.trim();
  const cleanPass = newPassword.trim();

  if (!cleanId || cleanId.length < 4) {
    return {
      success: false,
      error: 'New Login ID must be at least 4 characters long.',
    };
  }

  if (!cleanPass || cleanPass.length < 6) {
    return {
      success: false,
      error: 'New password must be at least 6 characters long.',
    };
  }

  const updated: AdminCredentials = {
    loginId: cleanId,
    password: cleanPass,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_CREDENTIALS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, 'true');
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to persist new credentials.',
    };
  }
}

export function isAdminLoggedIn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_SESSION) === 'true';
  } catch {
    return false;
  }
}

export function setAdminLoggedIn(loggedIn: boolean): void {
  try {
    if (loggedIn) {
      localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    }
  } catch {}
}
