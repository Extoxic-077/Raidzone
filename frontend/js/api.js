import { authFetch, clearAuth } from './auth.js';

console.log("Loading API Logic v2026.04.26.1...");

const BASE_URL = window.__APP_CONFIG__?.API_URL?.trim() || '/api';

// ─── Response Handling Helper ──────────────────────────────────────────────────

async function handleResponse(res) {
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { success: false, error: 'Malformed JSON response from server' };
  }

  if (!res.ok || json.success === false) {
    const errorMsg = json.error || json.message || `API error: ${res.status}`;
    throw new Error(errorMsg);
  }
  return json.data;
}

// ─── Public fetch (no auth) ───────────────────────────────────────────────────

export async function apiFetch(path) {
  const cacheBuster = `cb=${Date.now()}`;
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${sep}${cacheBuster}`;
  console.log(`[API] Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    return await handleResponse(res);
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Backend unavailable - please ensure the server is running');
    }
    throw err;
  }
}

// ─── Authenticated fetch ──────────────────────────────────────────────────────

export async function authApiFetch(path, options = {}) {
  const cacheBuster = `cb=${Date.now()}`;
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${sep}${cacheBuster}`;
  const res = await authFetch(url, {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  return await handleResponse(res);
}

// ─── OAuth2 ──────────────────────────────────────────────────────────────────

export async function getGoogleAuthUrl() {
  const res  = await fetch(`${BASE_URL}/auth/oauth/google`, { credentials: 'include' });
  return await handleResponse(res);
}

export async function getDiscordAuthUrl() {
  const res  = await fetch(`${BASE_URL}/auth/oauth/discord`, { credentials: 'include' });
  return await handleResponse(res);
}

export async function getFilters(game, tab) {
  // Return same shape as apiFetch (json.data) — not the { success, data } wrapper
  if (!game || !tab) return { filters: [] };
  return apiFetch(`/filters?game=${game}&tab=${tab}`);
}

// ─── Catalogue (public) ───────────────────────────────────────────────────────

export async function getCategories() {
  return apiFetch('/categories');
}

export async function getCategoriesFlat() {
  return apiFetch('/categories/flat');
}

export async function getCompanies() {
  return apiFetch('/companies');
}

// Keys that are state management internals, not query filters
const PRODUCTS_SKIP_KEYS = new Set([
  'page', 'game', 'tab', 'search', 'sort', 'minPrice', 'maxPrice',
  'loading', 'allLoaded'
]);

export async function getProducts(params = {}) {
  const qs = new URLSearchParams();

  qs.set('page', params.page || 1);
  if (params.game)     qs.set('game', params.game);
  if (params.tab)      qs.set('tab', params.tab);
  if (params.search)   qs.set('search', params.search);
  if (params.sort)     qs.set('sort', params.sort);
  if (params.minPrice) qs.set('minPrice', params.minPrice);
  if (params.maxPrice) qs.set('maxPrice', params.maxPrice);

  // Pass dynamic attribute filters, excluding internal state keys and private (_) keys
  Object.keys(params).forEach(key => {
    if (PRODUCTS_SKIP_KEYS.has(key) || key.startsWith('_')) return;
    if (params[key] != null && params[key] !== '') qs.set(key, params[key]);
  });

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
  return await handleResponse(res);
}

/**
 * Step 1: validate credentials, trigger OTP send.
 * Returns { message, maskedEmail }
 */
export async function loginStep1(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
}

/**
 * Step 2: verify OTP code, receive access token.
 */
export async function verifyOtp(data) {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
}

/**
 * Resend OTP (rate limited to 60s).
 */
export async function resendOtp(email) {
  const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return await handleResponse(res);
}

/**
 * Verify email after registration.
 */
export async function verifyEmail(data) {
  const res = await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await handleResponse(res);
}

/**
 * Logout — clears the refresh token cookie on the backend and clears local auth state.
 */
export async function logout() {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  clearAuth();
}

/**
 * Refresh the access token using the HttpOnly refresh cookie.
 */
export async function refreshToken() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  return await handleResponse(res);
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

export async function requestEmailChange(newEmail) {
  return authApiFetch('/auth/request-email-change', {
    method: 'POST',
    body: JSON.stringify({ newEmail }),
  });
}

export async function verifyEmailChange(newEmail, otpCode) {
  return authApiFetch('/auth/verify-email-change', {
    method: 'POST',
    body: JSON.stringify({ newEmail, otpCode }),
  });
}

export async function requestPasswordChange() {
  return authApiFetch('/auth/request-password-change', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function verifyPasswordChange(newPassword, otpCode) {
  return authApiFetch('/auth/verify-password-change', {
    method: 'POST',
    body: JSON.stringify({ newPassword, otpCode }),
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

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(data) {
  return authApiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyOrders() {
  return authApiFetch('/orders/my', { method: 'GET' });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminGetStats() {
  return authApiFetch('/admin/stats', { method: 'GET' });
}

export async function adminGetAnalytics(period = 'THIS_MONTH') {
  return authApiFetch(`/admin/analytics?period=${period}`, { method: 'GET' });
}

export async function adminGetCategories() {
  return authApiFetch('/admin/categories', { method: 'GET' });
}

export async function adminCreateCategory(data) {
  return authApiFetch('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCategory(id, data) {
  return authApiFetch(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCategory(id) {
  return authApiFetch(`/admin/categories/${id}`, { method: 'DELETE' });
}

export async function adminGetProducts(page = 0, size = 20, includeInactive = false) {
  return authApiFetch(
    `/products?page=${page}&size=${size}&includeInactive=${includeInactive}&admin=true`,
    { method: 'GET' }
  );
}

export async function adminCreateProduct(data) {
  return authApiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateProduct(id, data) {
  return authApiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteProduct(id) {
  return authApiFetch(`/products/${id}`, { method: 'DELETE' });
}

export async function adminUploadImage(productId, file) {
  const formData = new FormData();
  formData.append('file', file);
  // Use authFetch so the Authorization header is set automatically and 401/refresh is handled
  const res = await authFetch(`${BASE_URL}/products/${productId}/image`, {
    method: 'POST',
    body: formData,
  });
  return await handleResponse(res);
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

export async function adminToggleUserStatus(userId, isActive) {
  return authApiFetch(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });
}

export async function adminDeleteUser(userId) {
  return authApiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export async function applyCoupon(code, orderAmount) {
  return authApiFetch('/coupons/apply', {
    method: 'POST',
    body: JSON.stringify({ code, orderAmount }),
  });
}

// ─── Payment — Stripe ─────────────────────────────────────────────────────────

export async function createStripeIntent(orderId) {
  return authApiFetch('/payments/stripe/intent', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

// ─── Payment — Razorpay ───────────────────────────────────────────────────────

export async function createRazorpayOrder(orderId) {
  return authApiFetch('/payments/razorpay/order', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function verifyRazorpayPayment(orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  return authApiFetch('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  });
}

// ─── Payment — Coinbase ───────────────────────────────────────────────────────

export async function createCoinbaseCharge(orderId) {
  return authApiFetch('/payments/coinbase/charge', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function pollOrderStatus(orderId) {
  return authApiFetch(`/payments/order/${orderId}/status`, { method: 'GET' });
}

// ─── Admin — Orders ───────────────────────────────────────────────────────────

export async function adminGetOrders(params = {}) {
  const qs = new URLSearchParams();
  if (params.page     != null)  qs.set('page',   params.page);
  if (params.size     != null)  qs.set('size',   params.size);
  if (params.status)            qs.set('status', params.status);
  if (params.search)            qs.set('search', params.search);
  return authApiFetch(`/admin/orders${qs.toString() ? '?' + qs : ''}`, { method: 'GET' });
}

export async function adminGetOrder(orderId) {
  return authApiFetch(`/admin/orders/${orderId}`, { method: 'GET' });
}

export async function adminUpdateOrderStatus(orderId, status) {
  return authApiFetch(`/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ─── Admin — Coupons ──────────────────────────────────────────────────────────

export async function adminGetCoupons() {
  return authApiFetch('/admin/coupons', { method: 'GET' });
}

export async function adminCreateCoupon(data) {
  return authApiFetch('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCoupon(id, data) {
  return authApiFetch(`/admin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminDeactivateCoupon(id) {
  return authApiFetch(`/admin/coupons/${id}`, { method: 'DELETE' });
}

export async function adminGetCouponUsages(id) {
  return authApiFetch(`/admin/coupons/${id}/usages`, { method: 'GET' });
}

// ─── Admin — Payments ─────────────────────────────────────────────────────────

export async function adminGetPayments(params = {}) {
  const qs = new URLSearchParams();
  if (params.page     != null)  qs.set('page',     params.page);
  if (params.size     != null)  qs.set('size',     params.size);
  if (params.provider)          qs.set('provider', params.provider);
  if (params.status)            qs.set('status',   params.status);
  return authApiFetch(`/admin/payments${qs.toString() ? '?' + qs : ''}`, { method: 'GET' });
}

// ─── Admin — Product quick controls ──────────────────────────────────────────

export async function adminToggleProductActive(id) {
  return authApiFetch(`/admin/products/${id}/toggle-active`, { method: 'PATCH' });
}

export async function adminToggleFlashDeal(id) {
  return authApiFetch(`/admin/products/${id}/toggle-flash-deal`, { method: 'PATCH' });
}

export async function adminSetBadge(id, badge) {
  return authApiFetch(`/admin/products/${id}/badge`, {
    method: 'PATCH',
    body: JSON.stringify({ badge }),
  });
}

export async function adminBulkToggleActive(productIds, isActive) {
  return authApiFetch('/admin/products/bulk-toggle-active', {
    method: 'POST',
    body: JSON.stringify({ productIds, isActive }),
  });
}

// ─── Admin — System / Monitoring ─────────────────────────────────────────────

export async function adminGetSystemHealth() {
  return authApiFetch('/admin/system/health', { method: 'GET' });
}

export async function adminGetSystemMetrics() {
  return authApiFetch('/admin/system/metrics', { method: 'GET' });
}

export async function adminGetDbStats() {
  return authApiFetch('/admin/system/db-stats', { method: 'GET' });
}

// ─── Admin — Companies ────────────────────────────────────────────────────────

export async function adminGetCompanies() {
  return authApiFetch('/admin/companies', { method: 'GET' });
}

export async function adminCreateCompany(data) {
  return authApiFetch('/admin/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCompany(id, data) {
  return authApiFetch(`/admin/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCompany(id) {
  return authApiFetch(`/admin/companies/${id}`, { method: 'DELETE' });
}

export async function adminGetRealtime() {
  return authApiFetch('/admin/analytics/realtime', { method: 'GET' });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications() {
  return authApiFetch('/notifications', { method: 'GET' });
}

export async function getNotificationCount() {
  return authApiFetch('/notifications/count', { method: 'GET' });
}

export async function markAllNotificationsRead() {
  return authApiFetch('/notifications/read-all', { method: 'PUT' });
}

export async function markNotificationRead(id) {
  return authApiFetch(`/notifications/${id}/read`, { method: 'PUT' });
}
