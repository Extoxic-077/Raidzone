/**
 * Auth state management for HashVault frontend.
 *
 * Access tokens are stored in memory only (never localStorage).
 * Minimal user info (name, email, role, id) is stored in localStorage
 * for UI display across sessions.
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
 * Stores the access token in memory and saves user info in either localStorage or sessionStorage.
 * @param {Object} authResponse - The auth response data object
 * @param {boolean} persistent - If true, uses localStorage; else sessionStorage
 */
export function setAuth(authResponse, persistent = true) {
  _accessToken = authResponse.accessToken;
  if (authResponse.user) {
    const userData = JSON.stringify({
      id:    authResponse.user.id,
      name:  authResponse.user.name,
      email: authResponse.user.email,
      role:  authResponse.user.role,
    });
    
    if (persistent) {
      localStorage.setItem('hv_user', userData);
      localStorage.setItem('hv_is_persistent', 'true');
    } else {
      sessionStorage.setItem('hv_user', userData);
      localStorage.removeItem('hv_is_persistent');
    }
    localStorage.setItem('hv_logged_in', 'true');
  }
}

/** Clears tokens and info from all storage locations. */
export function clearAuth() {
  _accessToken = null;
  localStorage.removeItem('hv_user');
  sessionStorage.removeItem('hv_user');
  localStorage.removeItem('hv_is_persistent');
  localStorage.removeItem('hv_logged_in');
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
  
  const ok = await _tryRefresh();
  if (!ok) clearAuth();
  return ok;
}

/** Returns true if a token is in memory AND user info is in storage. */
export function isLoggedIn() {
  return _accessToken !== null && (localStorage.getItem('hv_user') !== null || sessionStorage.getItem('hv_user') !== null);
}

/** Returns true if localStorage suggests the user was logged in (even if token not yet refreshed). */
export function isLikelyLoggedIn() {
  return localStorage.getItem('hv_logged_in') === 'true';
}

/**
 * Returns the stored user object from sessionStorage, or null.
 * @returns {{ id, name, email, role } | null}
 */
export function getUser() {
  const raw = localStorage.getItem('hv_user') || sessionStorage.getItem('hv_user');
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
      localStorage.setItem('redirectAfterLogin', page);
      const loginPath = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
      window.location.href = loginPath;
    }
  }

  return res;
}

let _refreshPromise = null;

/**
 * Attempts to refresh the access token using the HttpOnly refresh cookie.
 * @returns {Promise<boolean>} true if refresh succeeded
 */
async function _tryRefresh() {
  if (_refreshPromise) return _refreshPromise;
  
  _refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(res => {
      if (!res.ok) return false;
      return res.json().then(json => {
        if (json.success && json.data) {
          setAuth(json.data);
          return true;
        }
        return false;
      });
    })
    .catch(() => false)
    .finally(() => { _refreshPromise = null; });

  return _refreshPromise;
}
