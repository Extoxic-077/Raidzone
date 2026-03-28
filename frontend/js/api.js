import { authFetch } from './auth.js';

const BASE_URL = 'http://localhost:8080/api/v1';

// ─── Public fetch (no auth) ───────────────────────────────────────────────────

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Accept': 'application/json' }
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `API error: ${res.status}`);
  }
  return json.data;
}

// ─── Authenticated fetch ──────────────────────────────────────────────────────

async function authApiFetch(path, options = {}) {
  const res = await authFetch(`${BASE_URL}${path}`, {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `API error: ${res.status}`);
  }
  return json.data;
}

// ─── Catalogue (public) ───────────────────────────────────────────────────────

export async function getCategories() {
  return apiFetch('/categories');
}

export async function getProducts(params = {}) {
  const qs = new URLSearchParams();
  if (params.page     != null) qs.set('page',       params.page);
  if (params.size     != null) qs.set('size',       params.size);
  if (params.categoryId)       qs.set('categoryId', params.categoryId);
  if (params.minPrice != null) qs.set('minPrice',   params.minPrice);
  if (params.maxPrice != null) qs.set('maxPrice',   params.maxPrice);
  if (params.search)           qs.set('search',     params.search);
  if (params.sort)             qs.set('sort',       params.sort);
  if (params.minRating != null) qs.set('minRating', params.minRating);
  const query = qs.toString();
  return apiFetch(`/products${query ? '?' + query : ''}`);
}

export async function getFeaturedProducts() {
  return apiFetch('/products/featured');
}

export async function getFlashDeals() {
  return apiFetch('/products/flash-deals');
}

export async function getProduct(id) {
  return apiFetch(`/products/${id}`);
}

export async function getProductBySlug(slug) {
  return apiFetch(`/products/slug/${slug}`);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Register a new user account.
 * @param {{ name, email, phone?, nickname?, password }} data
 */
export async function register(data) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Registration failed: ${res.status}`);
  }
  return json.data;
}

/**
 * Login with email and password.
 * @param {{ email, password }} data
 */
export async function login(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Login failed: ${res.status}`);
  }
  return json.data;
}

/**
 * Logout — clears the refresh token cookie on the backend.
 */
export async function logout() {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

/**
 * Refresh the access token using the HttpOnly refresh cookie.
 */
export async function refreshToken() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Token refresh failed');
  }
  return json.data;
}

/**
 * Fetch the current authenticated user's profile.
 */
export async function getMe() {
  return authApiFetch('/auth/me', { method: 'GET' });
}

export async function updateMe(data) {
  return authApiFetch('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCart() {
  return authApiFetch('/cart', { method: 'GET' });
}

export async function getCartCount() {
  return authApiFetch('/cart/count', { method: 'GET' });
}

export async function addToCart(productId, quantity = 1) {
  return authApiFetch('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(productId, quantity) {
  return authApiFetch(`/cart/items/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(productId) {
  return authApiFetch(`/cart/items/${productId}`, { method: 'DELETE' });
}

export async function clearCart() {
  return authApiFetch('/cart', { method: 'DELETE' });
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function getWishlist() {
  return authApiFetch('/wishlist', { method: 'GET' });
}

export async function toggleWishlist(productId) {
  return authApiFetch(`/wishlist/${productId}/toggle`, { method: 'POST' });
}

export async function getWishlistStatus(productId) {
  return authApiFetch(`/wishlist/${productId}/status`, { method: 'GET' });
}

export async function getWishlistCount() {
  return authApiFetch('/wishlist/count', { method: 'GET' });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getProductReviews(productId) {
  return apiFetch(`/products/${productId}/reviews`);
}

export async function createReview(productId, data) {
  return authApiFetch(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export async function recordPurchase(productId) {
  return authApiFetch('/purchases', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

export async function hasPurchased(productId) {
  return authApiFetch(`/purchases/product/${productId}`, { method: 'GET' });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminGetStats() {
  return authApiFetch('/admin/stats', { method: 'GET' });
}

export async function adminGetProducts(page = 0, size = 20) {
  return authApiFetch(`/admin/products?page=${page}&size=${size}`, { method: 'GET' });
}

export async function adminCreateProduct(data) {
  return authApiFetch('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateProduct(id, data) {
  return authApiFetch(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteProduct(id) {
  return authApiFetch(`/admin/products/${id}`, { method: 'DELETE' });
}

export async function adminUploadImage(productId, file) {
  const formData = new FormData();
  formData.append('file', file);
  // Use authFetch so the Authorization header is set automatically and 401/refresh is handled
  const res = await authFetch(`${BASE_URL}/admin/products/${productId}/image`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(json.message || 'Upload failed');
  return json.data;
}

export async function adminGetUsers(page = 0, size = 20) {
  return authApiFetch(`/admin/users?page=${page}&size=${size}`, { method: 'GET' });
}

export async function adminUpdateUserRole(userId, role) {
  return authApiFetch(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}
