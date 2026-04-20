import { getProducts, getCategoriesFlat, getCompanies } from '../api.js';
import { createProductCard } from '../components/productCard.js';
import { createProductSkeleton } from '../components/skeleton.js';
import { showToast } from '../components/toast.js';
import { getCurrentFilters, updateURL } from '../router.js';

let filters    = {};
let currentPage = 0;
let loading    = false;
let allLoaded  = false;
let totalCount = 0;

// ─── STATE HELPERS ───────────────────────────────────────────────────────────

function readFiltersFromURL() {
  const f = getCurrentFilters();
  filters = {
    categoryId: f.categoryId,
    companyId:  f.companyId,
    minPrice:   f.minPrice,
    maxPrice:   f.maxPrice,
    minRating:  f.minRating,
    search:     f.search,
    sort:       f.sort,
  };
  currentPage = 0;
  allLoaded   = false;
}

function getFilterParams() {
  const p = { page: currentPage, size: 16 };
  if (filters.categoryId) p.categoryId = filters.categoryId;
  if (filters.companyId)  p.companyId  = filters.companyId;
  if (filters.minPrice)   p.minPrice   = filters.minPrice;
  if (filters.maxPrice)   p.maxPrice   = filters.maxPrice;
  if (filters.minRating)  p.minRating  = filters.minRating;
  if (filters.search)     p.search     = filters.search;
  if (filters.sort)       p.sort       = filters.sort;
  return p;
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────────

async function renderSidebar(catList, companyList) {
  const catFilter = document.getElementById('cat-filter-list');
  if (!catFilter) return;

  catFilter.innerHTML = '';

  const allItem = document.createElement('label');
  allItem.className = `filter-cat-item${!filters.categoryId ? ' active' : ''}`;
  allItem.innerHTML = `<input type="radio" name="cat" value=""> <span>All Categories</span>`;
  allItem.addEventListener('click', () => { filters.categoryId = ''; applyAndFetch(); });
  catFilter.appendChild(allItem);

  catList.forEach(cat => {
    const item = document.createElement('label');
    item.className = `filter-cat-item${filters.categoryId === String(cat.id) ? ' active' : ''}`;
    const indent = cat.parentId ? ' style="padding-left:20px;font-size:0.82rem"' : '';
    item.innerHTML = `<input type="radio" name="cat" value="${cat.id}"> <span${indent}>${cat.emoji ? cat.emoji + ' ' : ''}${cat.name}</span>`;
    item.addEventListener('click', () => { filters.categoryId = String(cat.id); applyAndFetch(); });
    catFilter.appendChild(item);
  });

  // Price inputs
  const minEl = document.getElementById('filter-min-price');
  const maxEl = document.getElementById('filter-max-price');
  if (minEl) minEl.value = filters.minPrice || '';
  if (maxEl) maxEl.value = filters.maxPrice || '';

  // Rating stars
  const ratingVal = parseInt(filters.minRating || '0', 10);
  document.querySelectorAll('.rating-star-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.value, 10) <= ratingVal && ratingVal > 0);
  });

  // Company filter
  const companySection = document.getElementById('company-filter-list');
  if (companySection && companyList && companyList.length > 0) {
    companySection.innerHTML = '';
    const allComp = document.createElement('label');
    allComp.className = `filter-cat-item${!filters.companyId ? ' active' : ''}`;
    allComp.innerHTML = `<input type="radio" name="comp" value=""> <span>All Brands</span>`;
    allComp.addEventListener('click', () => { filters.companyId = ''; applyAndFetch(); });
    companySection.appendChild(allComp);

    companyList.forEach(c => {
      const item = document.createElement('label');
      item.className = `filter-cat-item${filters.companyId === String(c.id) ? ' active' : ''}`;
      item.innerHTML = `<input type="radio" name="comp" value="${c.id}"> <span>${c.name}</span>`;
      item.addEventListener('click', () => { filters.companyId = String(c.id); applyAndFetch(); });
      companySection.appendChild(item);
    });
  }
}

function setupSidebarEvents() {
  // Rating stars
  document.querySelectorAll('.rating-star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = parseInt(btn.dataset.value, 10);
      filters.minRating = filters.minRating === String(v) ? '' : String(v);
      document.querySelectorAll('.rating-star-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.value,10) <= parseInt(filters.minRating||'0',10) && !!filters.minRating);
      });
    });
  });

  // Apply filters button
  document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
    const min = document.getElementById('filter-min-price')?.value?.trim();
    const max = document.getElementById('filter-max-price')?.value?.trim();
    filters.minPrice = min || '';
    filters.maxPrice = max || '';
    applyAndFetch();
    closeMobileSheet();
  });

  // Clear all
  document.getElementById('clear-all-btn')?.addEventListener('click', () => {
    filters = {};
    document.getElementById('filter-min-price') && (document.getElementById('filter-min-price').value = '');
    document.getElementById('filter-max-price') && (document.getElementById('filter-max-price').value = '');
    document.querySelectorAll('.rating-star-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.filter-cat-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.filter-cat-item:first-child').forEach(i => i.classList.add('active'));
    applyAndFetch();
    closeMobileSheet();
  });
}

// ─── MOBILE SHEET ────────────────────────────────────────────────────────────

function openMobileSheet() {
  document.getElementById('filter-overlay')?.classList.add('open');
  const sheet = document.getElementById('filter-sheet');
  sheet?.classList.add('open');
  document.body.style.overflow = 'hidden';
  history.pushState({ filterOpen: true }, '');
}

function closeMobileSheet() {
  document.getElementById('filter-overlay')?.classList.remove('open');
  document.getElementById('filter-sheet')?.classList.remove('open');
  document.body.style.overflow = '';
}

function setupSwipeToClose() {
  const sheet = document.getElementById('filter-sheet');
  if (!sheet) return;

  let startY = 0;
  let currentY = 0;

  sheet.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
    sheet.style.transition = 'none';
  }, { passive: true });

  sheet.addEventListener('touchmove', e => {
    currentY = e.touches[0].clientY;
    const delta = currentY - startY;
    if (delta > 0) {
      sheet.style.transform = `translateY(${delta}px)`;
    }
  }, { passive: true });

  sheet.addEventListener('touchend', () => {
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (currentY - startY > 80) {
      closeMobileSheet();
      if (history.state?.filterOpen) history.back();
    }
  });
}

window.addEventListener('popstate', e => {
  if (!e.state?.filterOpen) {
    const sheet = document.getElementById('filter-sheet');
    if (sheet?.classList.contains('open')) closeMobileSheet();
  }
});

// ─── PRODUCT GRID ────────────────────────────────────────────────────────────

function showSkeletons(grid, count = 16) {
  for (let i = 0; i < count; i++) {
    grid.appendChild(createProductSkeleton());
  }
}

async function fetchAndRenderProducts(append = false) {
  if (loading || allLoaded) return;
  loading = true;

  const grid    = document.getElementById('products-grid');
  const endMsg  = document.getElementById('end-message');
  const countEl = document.getElementById('product-count');

  if (!grid) { loading = false; return; }

  if (!append) {
    grid.innerHTML = '';
    allLoaded = false;
    if (endMsg) endMsg.style.display = 'none';
    showSkeletons(grid);
  } else {
    showSkeletons(grid, 8);
  }

  try {
    const data = await getProducts(getFilterParams());

    // Remove any remaining skeletons
    grid.querySelectorAll('.skeleton-card').forEach(s => s.remove());

    const items = Array.isArray(data) ? data : (data.content || data.items || []);
    const total = data.totalElements ?? data.total ?? items.length;
    const isLast = data.last ?? (items.length < 16);

    if (!append) totalCount = total;

    if (countEl) {
      const base = `Showing ${totalCount > 0 ? totalCount : items.length} product${(totalCount || items.length) !== 1 ? 's' : ''}`;
      if (filters.search) {
        countEl.innerHTML = `${base} for "<strong>${filters.search}</strong>"
          <button id="clear-search-btn" style="margin-left:8px;background:none;border:none;color:var(--violet-light);cursor:pointer;font-size:0.8rem;text-decoration:underline;">clear</button>`;
        document.getElementById('clear-search-btn')?.addEventListener('click', () => {
          filters.search = '';
          const si = document.getElementById('catalog-search');
          if (si) si.value = '';
          applyAndFetch();
        });
      } else {
        countEl.textContent = base;
      }
    }

    if (items.length === 0 && !append) {
      grid.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div><h3>No products found</h3><p>Try adjusting your filters or search query.</p>`;
      grid.appendChild(empty);
      loading = false;
      return;
    }

    items.forEach((product, i) => {
      const card = createProductCard(product);
      card.classList.add('stagger-in');
      card.style.animationDelay = `${i * 60}ms`;
      grid.appendChild(card);
    });

    if (isLast) {
      allLoaded = true;
      if (endMsg) endMsg.style.display = 'block';
    }

    currentPage++;
  } catch (err) {
    grid.querySelectorAll('.skeleton-card').forEach(s => s.remove());
    console.error('Failed to load products:', err);
    if (!append) {
      grid.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3>Couldn't load products</h3><p>${err.message}</p>`;
      grid.appendChild(empty);
    }
    showToast('Failed to load products', 'error');
  }

  loading = false;
}

// ─── INFINITE SCROLL ─────────────────────────────────────────────────────────

function setupInfiniteScroll() {
  const sentinel = document.getElementById('scroll-sentinel');
  if (!sentinel) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading && !allLoaded) {
      fetchAndRenderProducts(true);
    }
  }, { rootMargin: '200px' });

  observer.observe(sentinel);
}

// ─── SEARCH (debounced) ───────────────────────────────────────────────────────

let searchTimer = null;

function setupSearch() {
  const input   = document.getElementById('catalog-search');
  const spinner = document.getElementById('search-spinner');
  if (!input) return;

  input.value = filters.search || '';

  input.addEventListener('input', () => {
    if (spinner) spinner.style.display = 'block';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.search = input.value.trim();
      currentPage = 0;
      allLoaded   = false;
      applyAndFetch();
      if (spinner) spinner.style.display = 'none';
    }, 350);
  });
}

// ─── SORT ────────────────────────────────────────────────────────────────────

function setupSort() {
  const sel = document.getElementById('sort-select');
  if (!sel) return;
  sel.value = filters.sort || '';
  sel.addEventListener('change', () => {
    filters.sort = sel.value;
    applyAndFetch();
  });
}

// ─── VIEW TOGGLE ─────────────────────────────────────────────────────────────

function setupViewToggle() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const grid = document.getElementById('products-grid');
      if (btn.dataset.view === 'list') {
        grid?.classList.add('list-view');
      } else {
        grid?.classList.remove('list-view');
      }
    });
  });
}

// ─── APPLY & FETCH ────────────────────────────────────────────────────────────

function applyAndFetch() {
  currentPage = 0;
  allLoaded   = false;

  updateURL({ ...filters });

  // Sync sidebar active states
  document.querySelectorAll('.filter-cat-item').forEach(item => {
    const radio = item.querySelector('input[type="radio"]');
    item.classList.toggle('active', radio?.value === (filters.categoryId || ''));
  });

  fetchAndRenderProducts(false);
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────

export async function renderCatalog() {
  readFiltersFromURL();

  let catList = [], companyList = [];
  try {
    const [catData, compData] = await Promise.all([getCategoriesFlat(), getCompanies()]);
    catList     = Array.isArray(catData)  ? catData  : (catData.content  || []);
    companyList = Array.isArray(compData) ? compData : (compData.content || []);
  } catch (err) {
    console.error('Failed to load sidebar data:', err);
  }

  await renderSidebar(catList, companyList);
  setupSidebarEvents();

  // Mobile filter button
  document.getElementById('mobile-filter-btn')?.addEventListener('click', openMobileSheet);
  document.getElementById('filter-overlay')?.addEventListener('click', () => {
    closeMobileSheet();
    if (history.state?.filterOpen) history.back();
  });
  document.getElementById('close-filter-sheet')?.addEventListener('click', () => {
    closeMobileSheet();
    if (history.state?.filterOpen) history.back();
  });
  setupSwipeToClose();

  // Populate mobile sheet sidebar
  const mobileSheet = document.getElementById('filter-sheet-content');
  if (mobileSheet) {
    const desktopSidebar = document.querySelector('.catalog-sidebar');
    if (desktopSidebar) {
      mobileSheet.innerHTML = desktopSidebar.innerHTML;
      // Re-attach events for mobile cloned elements
      mobileSheet.querySelectorAll('.filter-cat-item').forEach(item => {
        item.addEventListener('click', () => {
          const radio = item.querySelector('input[type="radio"]');
          filters.categoryId = radio?.value || '';
          applyAndFetch();
          closeMobileSheet();
        });
      });
    }
  }

  setupSearch();
  setupSort();
  setupViewToggle();
  setupInfiniteScroll();

  await fetchAndRenderProducts(false);
}
