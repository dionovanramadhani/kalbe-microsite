export interface AuthUser {
  id?: string | number;
  fullname?: string;
  fullName?: string;
  nama?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  no_handphone?: string;
  phone?: string;
  practice_place?: string;
  practicePlace?: string;
  practice_place_address?: string;
  practiceAddress?: string;
  speciality?: string;
  role?: string;
  master_doctor_id?: string;
  avatar?: string;
  user?: {
    fullname?: string;
    nama?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Retrieve current JWT access token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem('token') || localStorage.getItem('kalbe_token');
}

/**
 * Check if a JWT token exists and is valid (not expired)
 */
export function isTokenValid(token: string | null = getToken()): boolean {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // If token format is not standard 3-part JWT, consider present token valid as a non-JWT session key
      return true;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp < currentTime) {
        return false;
      }
    }
    return true;
  } catch {
    // If decoding fails, check if token string is present
    return Boolean(token);
  }
}

/**
 * Get stored user object from localStorage
 */
export function getUserData(): AuthUser | null {
  try {
    const userStr = localStorage.getItem('user') || localStorage.getItem('kalbe_auth_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && typeof user === 'object' && typeof user.avatar === 'string') {
        user.avatar = user.avatar.replace(/\.png$/i, '.webp');
      }
      return user;
    }
  } catch (err) {
    console.error('Failed to parse user data from localStorage:', err);
  }
  return null;
}

/**
 * Extract actual logged-in user name from localStorage or JWT payload
 */
export function getUserName(): string {
  const user = getUserData();
  if (user) {
    const name =
      user.fullname ||
      user.fullName ||
      user.nama ||
      user.name ||
      user.user?.fullname ||
      user.user?.nama;
    if (name && typeof name === 'string' && name.trim().length > 0) {
      return name.trim();
    }
  }

  // Fallback: try decoding JWT payload
  const token = getToken();
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const jwtName =
          payload.fullname ||
          payload.nama ||
          payload.name ||
          payload.username ||
          payload.sub;
        if (jwtName && typeof jwtName === 'string' && !jwtName.includes('@')) {
          return jwtName.trim();
        }
      }
    } catch {
      // Ignore parse error
    }
  }

  return 'User';
}

/**
 * Save auth session data (JWT token, user data, rememberMe flag)
 */
export function setAuthSession(
  token: string,
  user: AuthUser,
  rememberMe: boolean = false
): void {
  localStorage.setItem('token', token);
  localStorage.setItem('kalbe_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('kalbe_auth_user', JSON.stringify(user));

  if (rememberMe) {
    localStorage.setItem('kalbe_remember_me', 'true');
  } else {
    localStorage.removeItem('kalbe_remember_me');
  }
}

/**
 * Clear authentication session data from localStorage and sessionStorage
 */
export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('kalbe_token');
  localStorage.removeItem('kalbe_auth_user');
  localStorage.removeItem('kalbe_remember_me');
  sessionStorage.removeItem('kalbe_welcome_pending');
  sessionStorage.removeItem('kalbe_welcome_shown');
}
