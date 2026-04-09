/**
 * Auth state management for HashVault frontend.
 *
 * Access tokens are stored in memory only (never localStorage).
 * Minimal user info (name, email, role, id) is stored in sessionStorage
 * for UI display across same-tab navigation, but is cleared on tab close.
 * Refresh tokens live in an HttpOnly cookie managed by the backend.
 */

const BASE_URL = '/api/v1';

// In-memory access token — cleared on page refresh
let _accessToken = null;

/** Returns the current in-memory access token, or null if not logged in. */
export function getAccessToken() {
  return _accessToken;
}

/**
 * Stores the access token in memory and saves minimal user info in sessionStorage.
 * @param {Object} authResponse - The auth response data object from the API
 */
export function setAuth(authResponse) {
  _accessToken = authResponse.accessToken;
  if (authResponse.user) {
    sessionStorage.setItem('hv_user', JSON.stringify({
      id:    authResponse.user.id,
      name:  authResponse.user.name,
      email: authResponse.user.email,
      role:  authResponse.user.role,
    }));
  }
}

/** Clears the in-memory token and sessionStorage user info. */
export function clearAuth() {
  _accessToken = null;
  sessionStorage.removeItem('hv_user');
}

/**
 * Silently restores the access token from the HttpOnly refresh cookie.
 * Call this at the start of every page before checking isLoggedIn().
 * Safe to call multiple times — returns immediately if token already exists.
 *
 * @returns {Promise<boolean>} true if the user is authenticated after the call
 */
export async function initAuth() {
  if (_accessToken) return true;
  if (!sessionStorage.getItem('hv_user')) return false;
  const ok = await _tryRefresh();
  if (!ok) clearAuth();
  return ok;
}

/** Returns true if a token is in memory AND user info is in sessionStorage. */
export function isLoggedIn() {
  return _accessToken !== null && sessionStorage.getItem('hv_user') !== null;
}

/**
 * Returns the stored user object from sessionStorage, or null.
 * @returns {{ id, name, email, role } | null}
 */
export function getUser() {
  const raw = sessionStorage.getItem('hv_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Returns true if the stored user has the ADMIN role. */
export function isAdmin() {
  const user = getUser();
  return user?.role === 'ADMIN';
}

/**
 * Authenticated fetch wrapper.
 * Adds Authorization header if a token exists.
 * On 401, attempts a silent token refresh; if refresh succeeds, retries once.
 * On refresh failure, clears auth and redirects to login.
 *
 * @param {string} url      - Full URL to fetch
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<Response>}
 */
export async function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    // Attempt silent refresh
    const refreshed = await _tryRefresh();
    if (refreshed) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${_accessToken}`;
      return fetch(url, { ...options, headers, credentials: 'include' });
    } else {
      clearAuth();
      const page = window.location.pathname.split('/').pop() || 'index.html';
      sessionStorage.setItem('redirectAfterLogin', page);
      const loginPath = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
      window.location.href = loginPath;
    }
  }

  return res;
}

/**
 * Attempts to refresh the access token using the HttpOnly refresh cookie.
 * @returns {Promise<boolean>} true if refresh succeeded
 */
async function _tryRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (json.success && json.data) {
      setAuth(json.data);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
