export function getCurrentProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

export function getCurrentProductSlug() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug');
  if (!slug && window.location.pathname.startsWith('/buy/')) {
    const segments = window.location.pathname.split('/').filter(Boolean);
    slug = segments[segments.length - 1]; // Last segment only — e.g. /buy/arc-raiders/items/my-product → my-product
  }
  return slug;
}

export function getCurrentFilters() {
  const params = new URLSearchParams(window.location.search);
  let categorySlug = params.get('category') || '';
  const path = window.location.pathname;
  
  if (!categorySlug && path.match(/^\/[\w-]+-(coins|items|weapons|boosting)$/)) {
    categorySlug = path.substring(1); // Removes leading slashes
  }

  if (!categorySlug && path.startsWith('/buy/')) {
    const route = parseCatalogRoute();
    categorySlug = route.game || '';
  }

  return {
    categoryId:   params.get('categoryId')   || '',
    categorySlug: categorySlug,
    companyId:    params.get('companyId')    || '',
    minPrice:   params.get('minPrice')   || '',
    maxPrice:   params.get('maxPrice')   || '',
    minRating:  params.get('minRating')  || '',
    search:     params.get('search')     || '',
    sort:       params.get('sort')       || '',
    productType: params.get('productType') || '',
    blueprintTag: params.get('blueprintTag') || '',
    page:       parseInt(params.get('page') || '0', 10),
  };
}

export function parseCatalogRoute() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // New clean URL: /buy/arc-raiders/coins
  const newPattern = /^\/buy\/([^\/]+)\/([^\/]+)\/?$/;
  const newMatch = path.match(newPattern);
  if (newMatch) {
    return {
      game:        newMatch[1],  // 'arc-raiders'
      subcategory: newMatch[2]   // 'coins'
    };
  }

  // Game only: /buy/arc-raiders or /buy/cs2
  const gamePattern = /^\/buy\/([^\/]+)\/?$/;
  const gameMatch = path.match(gamePattern);
  if (gameMatch) {
    return {
      game:        gameMatch[1],
      subcategory: params.get('tab') || null
    };
  }

  // Query param URL: /catalog.html?game=arc-raiders&tab=items
  const gameParam = params.get('game');
  if (gameParam) {
    return {
      game:        gameParam,
      subcategory: params.get('tab') || null
    };
  }

  // Legacy flat path: /arc-raiders-coins (should be 301'd already, but fallback)
  const legacyPattern = /^\/([\w-]+)-(coins|items|weapons|boosting|accounts)\/?$/;
  const legacyMatch = path.match(legacyPattern);
  if (legacyMatch) {
    return {
      game:        legacyMatch[1],  // 'arc-raiders'
      subcategory: legacyMatch[2]   // 'coins'
    };
  }

  return { game: null, subcategory: null };
}

/**
 * Updates the browser URL without triggering a page reload.
 * @param {Object|string} params - An object of filters or a path string.
 */
export function updateURL(params) {
  if (typeof params === 'string') {
    window.history.pushState({}, '', params);
    return;
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v != null) qs.set(k, v);
  }
  const newURL = `${window.location.pathname}${qs.toString() ? '?' + qs.toString() : ''}`;
  window.history.pushState({}, '', newURL);
}

export function getActivePage() {
  const path = window.location.pathname;
  if (path.endsWith('catalog.html') || path.match(/^\/[\w-]+-(coins|items|weapons|boosting)$/)) return 'catalog';
  if (path.endsWith('product.html') || path.startsWith('/buy/')) return 'product';
  return 'home';
}
