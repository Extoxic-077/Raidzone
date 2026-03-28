const BASE_URL = 'http://localhost:8080/api/v1';

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
