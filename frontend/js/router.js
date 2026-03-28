export function getCurrentProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

export function getCurrentFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    categoryId: params.get('categoryId') || '',
    minPrice:   params.get('minPrice')   || '',
    maxPrice:   params.get('maxPrice')   || '',
    minRating:  params.get('minRating')  || '',
    search:     params.get('search')     || '',
    sort:       params.get('sort')       || '',
    page:       parseInt(params.get('page') || '0', 10),
  };
}

export function updateURL(params) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v != null) qs.set(k, v);
  }
  const newURL = `${window.location.pathname}${qs.toString() ? '?' + qs.toString() : ''}`;
  window.history.pushState({}, '', newURL);
}

export function getActivePage() {
  const path = window.location.pathname;
  if (path.endsWith('catalog.html')) return 'catalog';
  if (path.endsWith('product.html')) return 'product';
  return 'home';
}
