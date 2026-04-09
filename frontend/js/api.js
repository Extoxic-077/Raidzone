import { authFetch } from './auth.js';

const BASE_URL = '/api/v1';

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

export async function adminGetRealtime() {
  return authApiFetch('/admin/analytics/realtime', { method: 'GET' });
}
