export function getCurrentProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

export function getCurrentProductSlug() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug');
  if (!slug && window.location.pathname.startsWith('/buy/')) {
    slug = window.location.pathname.substring(5);
  }
  return slug;
}

export function getCurrentFilters() {
  const params = new URLSearchParams(window.location.search);
  let categorySlug = params.get('category') || '';
  let rawProductType = params.get('productType') || '';
  let rawBlueprintTag = params.get('blueprintTag') || params.get('blueprint') || '';
  const path = window.location.pathname;

  const normalizeFilterValue = (value) => {
    if (!value) return '';
    const subTabPrefix = /^subtab:/i;
    return subTabPrefix.test(value) ? value.replace(subTabPrefix, '').trim() : value.trim();
  };

  // Hierarchical Path Parsing: /buy/{game}/{tab}/{subtab}
  if (path.startsWith('/buy/')) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) categorySlug = parts[1];
    if (parts.length >= 3) rawProductType = parts[2];
    if (parts.length >= 4) rawBlueprintTag = `SubTab:${parts[3]}`;
  }

  const normalizedProductType = normalizeFilterValue(rawProductType);
  const normalizedBlueprintTag = normalizeFilterValue(rawBlueprintTag);

  const productType = normalizedProductType;

  // Legacy Pattern fallback
  if (!categorySlug && path.match(/^\/[\w-]+-(coins|items|weapons|boosting)$/)) {
    categorySlug = path.substring(1);
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
    productType,
    itemType: params.get('itemType') || '',
    blueprintTag: normalizedBlueprintTag,
    page:       parseInt(params.get('page') || '0', 10),
  };
}

export function updateURL(params) {
  if (typeof params === 'string') {
    window.history.pushState({}, '', params);
    return;
  }

  const slug = s => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const game = params.category || params.categorySlug;
  const tab = params.productType;
  const bt = params.blueprintTag || '';
  const isSubTab = bt.startsWith('SubTab:');
  const subTab = isSubTab ? slug(bt.replace('SubTab:', '')) : null;
  const specificTag = (!isSubTab && bt) ? bt : null;  // e.g. "Hullcracker"

  let newPath = window.location.pathname;
  if (game) {
    newPath = `/buy/${game}`;
    if (tab) newPath += `/${slug(tab)}`;
    if (subTab) newPath += `/${subTab}`;
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === 'category' || k === 'categorySlug' || k === 'productType') continue;
    if (k === 'blueprintTag') continue; // handled below
    if (v !== '' && v != null) qs.set(k, v);
  }
  // Only add specific tag as ?blueprint= query param
  if (specificTag) qs.set('blueprint', specificTag);

  const finalURL = `${newPath}${qs.toString() ? '?' + qs.toString() : ''}`;
  window.history.pushState({}, '', finalURL);
}

export function getActivePage() {
  const path = window.location.pathname;
  if (path.endsWith('catalog.html') || path.match(/^\/[\w-]+-(coins|items|weapons|boosting)$/) || path.startsWith('/buy/')) return 'catalog';
  if (path.endsWith('product.html')) return 'product';
  return 'home';
}
