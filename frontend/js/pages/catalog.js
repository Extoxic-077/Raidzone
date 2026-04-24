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

// ─── SUBCATEGORY ICONS ───────────────────────────────────────────────────────

const SUB_ICONS = {
  // Games — platforms
  'pc':          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  'computer':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  'playstation': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M9 21V8.5c0-1.1.9-1.5 1.8-1.2l1.2.4c.7.3 1 .9 1 1.6V21"/><path d="M9 17l-4.5-1.5c-.8-.3-1.5-.9-1.5-1.8 0-.9.7-1.3 1.5-1l4.5 1.5"/><path d="M15 7.5V17l4.5-1.5c.8-.3 1.5-.9 1.5-1.8V9c0-.5-.3-.9-.8-1.1L15 6"/></svg>`,
  'xbox':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M6.5 8c1.5 2.5 2.5 4.5 5.5 5.5 3-1 4-3 5.5-5.5M8 7c1.2 1.8 2.8 3 4 3s2.8-1.2 4-3"/></svg>`,
  'nintendo':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="6" width="18" height="12" rx="6"/><circle cx="8.5" cy="12" r="2.5"/><path d="M14.5 9.5h3M14.5 14.5h3M16 9.5v5"/></svg>`,
  'switch':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="6" width="18" height="12" rx="6"/><circle cx="8.5" cy="12" r="2.5"/><path d="M14.5 9.5h3M14.5 14.5h3M16 9.5v5"/></svg>`,
  'mobile':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  'android':     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  'ios':         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  'webgame':     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`,
  'web':         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`,
  // Cards / gift
  'steam':       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  'gift':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  'wallet':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 12h.01"/><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/></svg>`,
  'google':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M21.805 10.023H12v3.955h5.627c-.254 1.286-1.016 2.376-2.16 3.107v2.583h3.496c2.047-1.884 3.228-4.66 3.228-7.962a9.6 9.6 0 0 0-.386-1.683z"/><path d="M12 22c2.7 0 4.965-.895 6.623-2.422l-3.236-2.518c-.897.601-2.044.956-3.387.956-2.605 0-4.81-1.76-5.598-4.122H3.064v2.594A9.998 9.998 0 0 0 12 22z"/><path d="M6.402 13.894A5.984 5.984 0 0 1 6.09 12c0-.659.113-1.3.312-1.894V7.512H3.064A9.998 9.998 0 0 0 2 12c0 1.614.387 3.14 1.064 4.488l3.338-2.594z"/><path d="M12 6.004c1.468 0 2.786.504 3.822 1.493l2.87-2.87C16.96 2.99 14.695 2 12 2A9.998 9.998 0 0 0 3.064 7.512l3.338 2.594C7.19 7.764 9.395 6.004 12 6.004z"/></svg>`,
  'amazon':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M4 4h16v16H4z"/><path d="M8 10h8M8 14h5"/></svg>`,
  // Streaming / subscriptions
  'netflix':     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  'spotify':     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M8 13.5c2.5-1 5.5-.5 7.5 1M7 10.5c3-1.5 7-1 9.5 1.5M9 16.5c2-1 4.5-.5 6 .5"/></svg>`,
  'streaming':   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  'subscription':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  // Top-up / direct pop-up
  'topup':       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'top-up':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'popup':       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'pop-up':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'valorant':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'pubg':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`,
  'freefire':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'cod':         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'mlbb':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`,
  'roblox':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  // VPN / security
  'vpn':         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  'security':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  // Software
  'software':    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  'antivirus':   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  'office':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h1m4 0h1M8 7v2"/></svg>`,
  'windows':     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
};

const DEFAULT_SUB_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;

function getSubIcon(name, slug) {
  const text = ((name || '') + ' ' + (slug || '')).toLowerCase();
  for (const [key, icon] of Object.entries(SUB_ICONS)) {
    if (text.includes(key)) return icon;
  }
  return DEFAULT_SUB_ICON;
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────────

async function renderSidebar(catList, companyList) {
  const catFilter = document.getElementById('cat-filter-list');
  if (!catFilter) return;

  catFilter.innerHTML = '';

  // Inject accordion styles once
  if (!document.getElementById('cat-accordion-styles')) {
    const s = document.createElement('style');
    s.id = 'cat-accordion-styles';
    s.textContent = `
      .cat-accordion-root {
        border-radius: var(--r-md);
        overflow: hidden;
        margin-bottom: 2px;
        border: 1px solid transparent;
        transition: border-color var(--ease-fast);
      }
      .cat-accordion-root.has-active { border-color: rgba(124,58,237,0.25); }
      .cat-accordion-header {
        display: flex; align-items: center; justify-content: space-between;
        width: 100%; padding: 8px 10px; background: none; border: none;
        cursor: pointer; border-radius: var(--r-md);
        font-family: var(--font-body); font-size: 0.875rem; font-weight: 600;
        color: var(--text-2); text-align: left;
        transition: background var(--ease-fast), color var(--ease-fast);
      }
      .cat-accordion-header:hover { background: var(--glass); color: var(--text-1); }
      .cat-accordion-header.active { color: var(--violet-light); background: rgba(124,58,237,0.08); }
      .cat-accordion-arrow {
        flex-shrink: 0; transition: transform 0.2s ease;
        color: var(--text-4);
      }
      .cat-accordion-root.open .cat-accordion-arrow { transform: rotate(180deg); }
      .cat-accordion-body {
        overflow: hidden; max-height: 0;
        transition: max-height 0.25s ease;
      }
      .cat-accordion-root.open .cat-accordion-body { max-height: 600px; }
      .cat-sub-item {
        display: flex; align-items: center; gap: 8px;
        width: 100%; padding: 6px 10px 6px 22px;
        background: none; border: none; cursor: pointer;
        font-family: var(--font-body); font-size: 0.82rem; font-weight: 500;
        color: var(--text-3); border-radius: var(--r-md);
        transition: background var(--ease-fast), color var(--ease-fast);
        text-align: left;
      }
      .cat-sub-item svg { flex-shrink: 0; color: var(--text-4); }
      .cat-sub-item:hover { background: var(--glass); color: var(--text-2); }
      .cat-sub-item:hover svg { color: var(--violet-light); }
      .cat-sub-item.active { color: var(--violet-light); background: rgba(124,58,237,0.1); font-weight: 600; }
      .cat-sub-item.active svg { color: var(--violet-light); }
      .filter-all-btn {
        display: flex; align-items: center; gap: 8px;
        width: 100%; padding: 8px 10px; background: none; border: none;
        cursor: pointer; border-radius: var(--r-md);
        font-family: var(--font-body); font-size: 0.875rem; font-weight: 600;
        color: var(--text-2); margin-bottom: 6px;
        transition: background var(--ease-fast), color var(--ease-fast);
        text-align: left;
      }
      .filter-all-btn:hover { background: var(--glass); color: var(--text-1); }
      .filter-all-btn.active { color: var(--violet-light); background: rgba(124,58,237,0.1); }
    `;
    document.head.appendChild(s);
  }

  // "All" button
  const allBtn = document.createElement('button');
  allBtn.className = `filter-all-btn${!filters.categoryId ? ' active' : ''}`;
  allBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> All Categories`;
  allBtn.addEventListener('click', () => {
    filters.categoryId = '';
    catFilter.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    allBtn.classList.add('active');
    applyAndFetch();
  });
  catFilter.appendChild(allBtn);

  // Build parent → children map
  const roots    = catList.filter(c => !c.parentId);
  const children = {};
  catList.filter(c => c.parentId).forEach(c => {
    if (!children[c.parentId]) children[c.parentId] = [];
    children[c.parentId].push(c);
  });

  // Standalone categories (roots with no children) — treat like flat items
  roots.forEach(root => {
    const subs = children[root.id] || [];
    const isRootActive = filters.categoryId === String(root.id);
    const isAnyChildActive = subs.some(s => filters.categoryId === String(s.id));

    if (subs.length === 0) {
      const btn = document.createElement('button');
      btn.className = `filter-all-btn${isRootActive ? ' active' : ''}`;
      btn.innerHTML = `${getSubIcon(root.name, root.slug)} ${root.name}`;
      btn.addEventListener('click', () => {
        filters.categoryId = String(root.id);
        syncActiveStates(catFilter, allBtn);
        applyAndFetch();
      });
      catFilter.appendChild(btn);
      return;
    }

    // Accordion group
    const acc = document.createElement('div');
    acc.className = `cat-accordion-root${(isRootActive || isAnyChildActive) ? ' has-active open' : ''}`;

    const header = document.createElement('button');
    header.className = `cat-accordion-header${isRootActive ? ' active' : ''}`;
    header.innerHTML = `
      <span>${root.name}</span>
      <svg class="cat-accordion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path d="M6 9l6 6 6-6"/></svg>
    `;
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      // Toggle accordion open/close
      acc.classList.toggle('open');
      // Selecting the parent category
      filters.categoryId = String(root.id);
      syncActiveStates(catFilter, allBtn);
      applyAndFetch();
    });

    const body = document.createElement('div');
    body.className = 'cat-accordion-body';

    // "All [parent]" sub-item
    const allSub = document.createElement('button');
    allSub.className = `cat-sub-item${isRootActive ? ' active' : ''}`;
    allSub.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> All ${root.name}`;
    allSub.dataset.catId = String(root.id);
    allSub.addEventListener('click', () => {
      filters.categoryId = String(root.id);
      syncActiveStates(catFilter, allBtn);
      applyAndFetch();
    });
    body.appendChild(allSub);

    subs.forEach(sub => {
      const btn = document.createElement('button');
      btn.className = `cat-sub-item${filters.categoryId === String(sub.id) ? ' active' : ''}`;
      btn.innerHTML = `${getSubIcon(sub.name, sub.slug)} ${sub.name}`;
      btn.dataset.catId = String(sub.id);
      btn.addEventListener('click', () => {
        filters.categoryId = String(sub.id);
        acc.classList.add('open');
        syncActiveStates(catFilter, allBtn);
        applyAndFetch();
      });
      body.appendChild(btn);
    });

    acc.appendChild(header);
    acc.appendChild(body);
    catFilter.appendChild(acc);
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
    const allComp = document.createElement('button');
    allComp.className = `filter-all-btn${!filters.companyId ? ' active' : ''}`;
    allComp.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> All Brands`;
    allComp.addEventListener('click', () => { filters.companyId = ''; applyAndFetch(); });
    companySection.appendChild(allComp);

    companyList.forEach(c => {
      const item = document.createElement('button');
      item.className = `filter-all-btn${filters.companyId === String(c.id) ? ' active' : ''}`;
      item.textContent = c.name;
      item.addEventListener('click', () => { filters.companyId = String(c.id); applyAndFetch(); });
      companySection.appendChild(item);
    });
  }
}

function syncActiveStates(catFilter, allBtn) {
  // Clear all active states
  catFilter.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
  catFilter.querySelectorAll('.cat-accordion-root.has-active').forEach(el => el.classList.remove('has-active'));
  allBtn.classList.remove('active');

  if (!filters.categoryId) {
    allBtn.classList.add('active');
    return;
  }
  // Mark matching items active
  catFilter.querySelectorAll('[data-cat-id]').forEach(el => {
    if (el.dataset.catId === filters.categoryId) {
      el.classList.add('active');
      el.closest('.cat-accordion-root')?.classList.add('has-active');
    }
  });
  catFilter.querySelectorAll('.cat-accordion-header').forEach(h => {
    const root = h.closest('.cat-accordion-root');
    if (root?.classList.contains('has-active')) h.classList.remove('active');
  });
  // If it's a root category itself
  catFilter.querySelectorAll('.cat-accordion-header').forEach(h => {
    const parent = h.closest('[data-cat-id]');
    if (parent?.dataset.catId === filters.categoryId) h.classList.add('active');
  });
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
