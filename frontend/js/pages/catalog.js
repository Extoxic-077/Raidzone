import { getProducts, getCategoriesFlat, getCompanies } from '../api.js?v=1.1.0';
import { createProductCard } from '../components/productCard.js?v=1.1.0';
import { createProductSkeleton } from '../components/skeleton.js?v=1.1.0';
import { showToast } from '../components/toast.js?v=1.1.0';
import { getCurrentFilters, updateURL } from '../router.js?v=1.1.0';
import { SEO } from '../seo.js?v=1.1.0';

let filters    = {};
let currentPage = 0;
let loading    = false;
let allLoaded  = false;
let totalCount = 0;
let pendingFetch = false;
let catList    = [];

// ─── STATE HELPERS ───────────────────────────────────────────────────────────

function readFiltersFromURL() {
  const f = getCurrentFilters();
  filters = {
    categoryId:   f.categoryId,
    categorySlug: f.categorySlug,
    companyId:    f.companyId,
    minPrice:     f.minPrice,
    maxPrice:     f.maxPrice,
    minRating:    f.minRating,
    search:       f.search,
    sort:         f.sort,
    productType:  f.productType,
    blueprintTag: f.blueprintTag,
  };
  currentPage = 0;
  allLoaded   = false;
  pendingFetch = false;
}

function getFilterParams() {
  const p = { page: currentPage, size: 16 };
  if (filters.categoryId)   p.categoryId   = filters.categoryId;
  if (filters.categorySlug) p.categorySlug = filters.categorySlug;
  if (filters.companyId)    p.companyId    = filters.companyId;
  if (filters.minPrice)     p.minPrice     = filters.minPrice;
  if (filters.maxPrice)     p.maxPrice     = filters.maxPrice;
  if (filters.minRating)    p.minRating    = filters.minRating;
  if (filters.search)       p.search       = filters.search;
  if (filters.sort)         p.sort         = filters.sort;
  if (filters.productType)  p.productType  = filters.productType;
  if (filters.blueprintTag) p.blueprintTag = filters.blueprintTag;
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

// ─── GAME TILE THEMES ─────────────────────────────────────────────────────────

const GAME_THEMES = {
  'arc-raiders': {
    emoji: '🤖',
    badge: 'Featured',
    logoUrl: '/assets/branding/arc-raiders-logo.png',
    svgArt: `<img src="/assets/branding/arc-raiders-logo.png" style="position:absolute;bottom:15px;right:15px;opacity:0.25;width:120px;height:auto;mask-image:linear-gradient(to bottom, black, transparent);-webkit-mask-image:linear-gradient(to bottom, black, transparent)">`,
  },
  'cs2': {
    emoji: '🎯',
    badge: 'Hot',
    logoUrl: '/assets/branding/cs2-logo.png',
    svgArt: `<img src="/assets/branding/cs2-logo.png" style="position:absolute;bottom:15px;right:15px;opacity:0.2;width:110px;height:auto;filter:brightness(0) invert(1)">`,
  },
  'delta-force': {
    emoji: '⚔️',
    badge: 'New',
    svgArt: `<svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;right:0;opacity:0.15;width:110px;height:85px">
      <polygon points="40,5 75,55 5,55" stroke="#4ade80" stroke-width="1.5" fill="none"/>
      <polygon points="40,18 62,52 18,52" stroke="#4ade80" stroke-width="1" fill="none" opacity="0.6"/>
      <line x1="40" y1="5" x2="40" y2="55" stroke="#4ade80" stroke-width="0.8" opacity="0.5"/>
    </svg>`,
  },
  'windrose': {
    emoji: '🏵️',
    badge: 'Rising',
    logoUrl: '/assets/branding/windrose-logo.png',
    svgArt: `<img src="/assets/branding/windrose-logo.png" style="position:absolute;bottom:15px;right:-10px;opacity:0.25;width:160px;height:auto;filter:brightness(0) invert(1)">`,
  },
  'windows': {
    emoji: '🪟',
    badge: 'Digital',
    svgArt: `<svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;bottom:0;right:0;opacity:0.15;width:110px;height:85px">
      <rect x="10" y="10" width="28" height="20" rx="2" stroke="#60a5fa" stroke-width="1.5"/>
      <rect x="42" y="10" width="28" height="20" rx="2" stroke="#60a5fa" stroke-width="1.5"/>
      <rect x="10" y="34" width="28" height="20" rx="2" stroke="#60a5fa" stroke-width="1.5"/>
      <rect x="42" y="34" width="28" height="20" rx="2" stroke="#60a5fa" stroke-width="1.5"/>
    </svg>`,
  },
};

function getGameTheme(slug) {
  if (!slug) return GAME_THEMES['default'] || { emoji: '🎮', badge: 'Browse', svgArt: '' };
  for (const [key, theme] of Object.entries(GAME_THEMES)) {
    if (slug.includes(key)) return theme;
  }
  return { emoji: '🎮', badge: 'Browse', svgArt: '' };
}

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

  // 1. Featured Games Section
  const gamesHeader = document.createElement('div');
  gamesHeader.className = 'sidebar-section-title';
  gamesHeader.style.marginTop = '0';
  gamesHeader.innerHTML = 'Popular Games';
  catFilter.appendChild(gamesHeader);

  const gamesCat = catList.find(c => c.slug === 'games');
  let gameCats = [];
  if (gamesCat) {
    gameCats = catList.filter(c => c.parentId === gamesCat.id);
  } else {
    gameCats = catList.filter(c => !c.parentId);
  }

  const gamesGrid = document.createElement('div');
  gamesGrid.className = 'sidebar-games-links';
  gamesGrid.style.cssText = 'display:grid; grid-template-columns:1fr; gap:6px; margin-bottom:20px;';

  gameCats.forEach(cat => {
    const theme = getGameTheme(cat.slug);
    const btn = document.createElement('button');
    btn.className = `cat-accordion-header${filters.categorySlug === cat.slug ? ' active' : ''}`;
    btn.style.padding = '8px 10px';
    btn.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:16px;">${theme.emoji}</span>
        <span>${cat.name}</span>
      </div>
      <svg class="cat-accordion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M9 18l6-6-6-6"/></svg>
    `;
    btn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('nav-to-cat', { detail: cat.slug }));
    });
    gamesGrid.appendChild(btn);
  });
  catFilter.appendChild(gamesGrid);

  const otherHeader = document.createElement('div');
  otherHeader.className = 'sidebar-section-title';
  otherHeader.innerHTML = 'All Categories';
  catFilter.appendChild(otherHeader);


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
      .sidebar-section-title {
        font-family: var(--font-display); font-size: 11px; font-weight: 800;
        text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-4);
        margin: 24px 0 12px 10px;
      }
    `;
    document.head.appendChild(s);
  }

  // "All" button
  const allBtn = document.createElement('button');
  allBtn.className = `filter-all-btn${!filters.categoryId ? ' active' : ''}`;
  allBtn.dataset.catId = 'all';
  allBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> All Categories`;
  allBtn.addEventListener('click', () => {
    filters.categoryId   = '';
    filters.categorySlug = '';
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
      btn.dataset.catSlug = root.slug;
      btn.innerHTML = `${getSubIcon(root.name, root.slug)} ${root.name}`;
      btn.addEventListener('click', () => {
        filters.categoryId   = '';
        filters.categorySlug = root.slug;
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
    header.dataset.rootId = String(root.id);
    header.innerHTML = `
      <span>${root.name}</span>
      <svg class="cat-accordion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path d="M6 9l6 6 6-6"/></svg>
    `;
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      // Toggle accordion open/close
      acc.classList.toggle('open');
      // Selecting the parent category
      filters.categoryId   = '';
      filters.categorySlug = root.slug;
      syncActiveStates(catFilter, allBtn);
      applyAndFetch();
    });

    const body = document.createElement('div');
    body.className = 'cat-accordion-body';

    // "All [parent]" sub-item
    const allSub = document.createElement('button');
    allSub.className = `cat-sub-item${isRootActive ? ' active' : ''}`;
    allSub.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> All ${root.name}`;
    allSub.dataset.catSlug = root.slug;
    allSub.addEventListener('click', () => {
      filters.categoryId   = '';
      filters.categorySlug = root.slug;
      syncActiveStates(catFilter, allBtn);
      applyAndFetch();
    });
    body.appendChild(allSub);

    subs.forEach(sub => {
      const btn = document.createElement('button');
      btn.className = `cat-sub-item${(filters.categoryId === String(sub.id) || filters.categorySlug === sub.slug) ? ' active' : ''}`;
      btn.innerHTML = `${getSubIcon(sub.name, sub.slug)} ${sub.name}`;
      btn.dataset.catSlug = sub.slug;
      btn.addEventListener('click', () => {
        filters.categoryId   = '';
        filters.categorySlug = sub.slug;
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
    allComp.dataset.companyId = 'all';
    allComp.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> All Brands`;
    allComp.addEventListener('click', () => { filters.companyId = ''; applyAndFetch(); });
    companySection.appendChild(allComp);

    companyList.forEach(c => {
      const item = document.createElement('button');
      item.className = `filter-all-btn${filters.companyId === String(c.id) ? ' active' : ''}`;
      item.dataset.companyId = String(c.id);
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

  if (!filters.categoryId && !filters.categorySlug) {
    allBtn.classList.add('active');
    return;
  }
  // Mark matching items active (by ID or Slug)
  catFilter.querySelectorAll('[data-cat-id], [data-cat-slug]').forEach(el => {
    const matchId   = filters.categoryId   && el.dataset.catId === filters.categoryId;
    const matchSlug = filters.categorySlug && el.dataset.catSlug === filters.categorySlug;
    if (matchId || matchSlug) {
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
  console.log(`[Catalog] fetchAndRenderProducts(append=${append})`);
  if (append && allLoaded) return;
  if (loading) {
    if (!append) pendingFetch = true;
    return;
  }
  
  if (!append) allLoaded = false;
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

    const items = Array.isArray(data) ? data : (data?.content || data?.items || []);
    const total = data?.totalElements ?? data?.total ?? items.length;
    const isLast = data?.last ?? (items.length < 16);

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
      
      if (pendingFetch) {
        pendingFetch = false;
        loading = false;
        fetchAndRenderProducts(false);
      } else {
        allLoaded = true;
        loading   = false;
      }
      return;
    }

    items.forEach((product, i) => {
      const card = createProductCard(product, i);
      card.classList.add('stagger-in');
      card.style.animationDelay = `${i * 60}ms`;
      grid.appendChild(card);
    });

    if (isLast) {
      if (pendingFetch) {
        pendingFetch = false;
        loading = false;
        fetchAndRenderProducts(false);
      } else {
        allLoaded = true;
        loading   = false;
        if (endMsg) endMsg.style.display = 'block';
      }
    } else {
      if (pendingFetch) {
        pendingFetch = false;
        loading = false;
        fetchAndRenderProducts(false);
      } else {
        loading = false;
        currentPage++;
      }
    }
  } catch (err) {
    grid.querySelectorAll('.skeleton-card').forEach(s => s.remove());
    console.error('Failed to load products:', err);
    loading = false;
    pendingFetch = false;
    if (!append) {
      grid.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3>Couldn't load products</h3><p>${err.message}</p>`;
      grid.appendChild(empty);
      allLoaded = true;
    }
    showToast('Failed to load products', 'error');
  }

  if (pendingFetch) {
    pendingFetch = false;
    loading = false;
    fetchAndRenderProducts(false);
  } else {
    loading = false;
  }
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

function setupCustomFilters() {
  const typeSel = document.getElementById('type-filter');
  const blueSel = document.getElementById('blueprint-filter');

  if (typeSel) {
    typeSel.value = filters.productType || '';
    typeSel.addEventListener('change', () => {
      filters.productType = typeSel.value;
      applyAndFetch();
    });
  }

  if (blueSel) {
    const blueprints = ['Anvil', 'Angled Grip II', 'Angled Grip III', 'Aphelion', 'Barricade Kit', 'Bettina', 'Blaze Grenade', 'Blue Light Stick', 'Bobcat', 'Burletta', 'Combat Mk.3 (Aggressive)', 'Combat Mk.3 (Flanking)', 'Complex Gun Parts', 'Deadline (mine)', 'Defibrillator', 'Equalizer', 'Explosive Mine', 'Fireworks Box', 'Gas Mine', 'Green Light Stick', 'Hullcracker', 'Hullcracker Ammo (Launcher Ammo)', 'Jolt Mine', 'Jupiter', 'Looting Mk.3 (Survivor)', 'Lure Grenade', 'Osprey', 'Pulse Mine', 'Red Light Stick', 'Seeker Grenade', 'Showstopper', 'Smoke Grenade', 'Tagging Grenade', 'Tactical Mk.3 (Defensive)', 'Tempest', 'Torrente', 'Trailblazer', 'Trigger Nade', 'Vita Shot', 'Vita Spray', 'Vulcano', 'Wolfpack'];
    blueSel.innerHTML = '<option value="">Blueprint</option>' + 
      blueprints.map(b => `<option value="${b}">${b}</option>`).join('');
    
    blueSel.value = filters.blueprintTag || '';
    blueSel.addEventListener('change', () => {
      filters.blueprintTag = blueSel.value;
      applyAndFetch();
    });
  }
}

// ─── VISIBILITY ───────────────────────────────────────────────────────────────

function updateFilterVisibility() {
  const blueSel = document.getElementById('blueprint-filter');
  const typeSel = document.getElementById('type-filter');
  
  const isArc = filters.categorySlug && filters.categorySlug.includes('arc-raiders');

  if (blueSel) {
    const parent = blueSel.closest('.catalog-sort');
    if (isArc) {
      if (parent) parent.style.display = 'block';
    } else {
      if (parent) parent.style.display = 'none';
      if (filters.blueprintTag) filters.blueprintTag = '';
    }
  }

  if (typeSel) {
    const parent = typeSel.closest('.catalog-sort');
    if (isArc) {
      if (parent) parent.style.display = 'block';
    } else {
      if (parent) parent.style.display = 'none';
      if (filters.productType) filters.productType = '';
    }
  }
}

// ─── GAME TILES ───────────────────────────────────────────────────────────────

function getGameDataKey(slug) {
  if (!slug) return 'default';
  if (slug.includes('arc-raiders')) return 'arc-raiders';
  if (slug.includes('cs2') || slug.includes('counter-strike')) return 'cs2';
  if (slug.includes('delta-force')) return 'delta-force';
  if (slug.includes('windrose')) return 'windrose';
  if (slug.includes('windows')) return 'windows';
  return 'default';
}

async function renderGameTiles() {
  const container = document.getElementById('category-hero-container');
  if (!container) return;

  // Only show when no specific category is selected
  if (filters.categoryId || filters.categorySlug) {
    return; // Hero rendering handled by renderCategoryHero
  }

  if (catList.length === 0) { container.innerHTML = ''; return; }

  // Get game categories under 'Games' root
  const gamesCat = catList.find(c => c.slug === 'games');
  let gameCats = [];
  if (gamesCat) {
    gameCats = catList.filter(c => c.parentId === gamesCat.id);
  } else {
    gameCats = catList.filter(c => !c.parentId);
  }
  
  if (gameCats.length === 0) { container.innerHTML = ''; return; }

  // For each game, count children + self products
  const tiles = gameCats.map(cat => {
    const childCount = catList.filter(c => c.parentId === cat.id).length;
    const theme = getGameTheme(cat.slug);
    const dataKey = getGameDataKey(cat.slug);
    return { cat, childCount, theme, dataKey };
  });

  container.innerHTML = `
    <div class="game-tiles-section">
      <div class="game-tiles-heading">Browse by Game</div>
      <div class="game-tiles-grid">
        ${tiles.map(({ cat, childCount, theme, dataKey }) => `
          <div class="game-tile stagger-in" data-game="${dataKey}" 
               role="button" tabindex="0"
               onclick="window.dispatchEvent(new CustomEvent('nav-to-cat', {detail: '${cat.slug}'}))">
            <div class="game-tile-bg"></div>
            ${theme.svgArt || ''}
            <div class="game-tile-overlay"></div>
            <div class="game-tile-badge">${theme.badge || 'Browse'}</div>
            <div class="game-tile-icon">${theme.emoji || '🎮'}</div>
            <div class="game-tile-body">
              <div class="game-tile-name">${cat.name}</div>
              <div class="game-tile-count">${childCount > 0 ? childCount + ' sub-categories' : 'View items'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Animate tiles in with stagger
  container.querySelectorAll('.game-tile').forEach((el, i) => {
    el.style.animationDelay = `${i * 60}ms`;
  });
}

// ─── CATEGORY HERO ────────────────────────────────────────────────────────────

function renderCategoryHero() {
  const container = document.getElementById('category-hero-container');
  if (!container) return;

  const currentSlug = filters.categorySlug;
  const currentId   = filters.categoryId;
  
  const category = catList.find(c => 
    (currentSlug && c.slug === currentSlug) || 
    (currentId && String(c.id) === String(currentId))
  );

  if (!category) {
    container.innerHTML = '';
    return;
  }

  // Find parent for breadcrumbs
  const parent = category.parentId ? catList.find(c => c.id === category.parentId) : null;

  // Build breadcrumbs
  let crumbs = `
    <div class="cat-breadcrumb">
      <a href="/">Home</a>
      <span class="separator">/</span>
      <a href="/catalog.html">Catalog</a>
  `;
  if (parent) {
    crumbs += `
      <span class="separator">/</span>
      <a href="/catalog.html?category=${parent.slug}">${parent.name}</a>
    `;
  }
  crumbs += `
      <span class="separator">/</span>
      <span class="active-crumb">${category.name}</span>
    </div>
  `;

  // Stats (placeholder or real if available)
  const productCount = totalCount || 0;

    const theme = getGameTheme(category.slug);
    const heroTitle = theme.logoUrl 
      ? `<img src="${theme.logoUrl}" class="cat-hero-logo stagger-in" alt="${category.name}">` 
      : category.name;

    container.innerHTML = `
      <div class="cat-hero stagger-in">
        <div class="cat-hero-card">
          <div class="cat-hero-glow"></div>
          ${crumbs}
          <div class="cat-hero-header">
            <h1 class="cat-hero-title">${heroTitle}</h1>
          </div>
          ${category.description ? `<p class="cat-hero-desc">${category.description}</p>` : ''}
        
        <div class="cat-hero-stats">
          <div class="cat-stat-item">
            <span class="cat-stat-value">${productCount}</span>
            <span class="cat-stat-label">Products</span>
          </div>
          <div class="cat-stat-item">
            <span class="cat-stat-value">24/7</span>
            <span class="cat-stat-label">Delivery</span>
          </div>
          <div class="cat-stat-item">
            <span class="cat-stat-value">Secure</span>
            <span class="cat-stat-label">Checkout</span>
          </div>
        </div>
      </div>
    </div>

    ${renderQuickNav(category)}
  `;
}

function renderQuickNav(currentCat) {
  // If it's a root category, show its children as quick links
  // If it's a child, show its siblings
  const parentId = currentCat.parentId || currentCat.id;
  const siblings = catList.filter(c => c.parentId === parentId);

  if (siblings.length === 0) return '';

  return `
    <div class="cat-quick-nav fade-in">
      ${siblings.map(sib => `
        <button class="quick-link-btn${sib.id === currentCat.id ? ' active' : ''}" 
                onclick="window.dispatchEvent(new CustomEvent('nav-to-cat', {detail: '${sib.slug}'}))">
          ${getSubIcon(sib.name, sib.slug)}
          ${sib.name}
        </button>
      `).join('')}
    </div>
  `;
}

// Global listener for quick nav
window.addEventListener('nav-to-cat', (e) => {
  filters.categoryId = '';
  filters.categorySlug = e.detail;
  const catFilter = document.getElementById('cat-filter-list');
  const allBtn = catFilter?.querySelector('.filter-all-btn[data-cat-id="all"]');
  if (catFilter && allBtn) syncActiveStates(catFilter, allBtn);
  applyAndFetch();
});

// ─── APPLY & FETCH ────────────────────────────────────────────────────────────

async function applyAndFetch() {
  currentPage = 0;
  allLoaded   = false;
  // Convert categorySlug to 'category' for URL
  const urlFilters = { ...filters };
  if (urlFilters.categorySlug) {
    urlFilters.category = urlFilters.categorySlug;
    delete urlFilters.categorySlug;
  }
  updateURL(urlFilters);
  updateFilterVisibility();

  if (filters.categoryId || filters.categorySlug) {
    renderCategoryHero();
  } else {
    renderGameTiles();
  }

  if (loading) {
    pendingFetch = true;
    return;
  }

  await fetchAndRenderProducts(false);
  
  // Refresh hero once we have the total count
  if (filters.categoryId || filters.categorySlug) {
    renderCategoryHero();
  }
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────

export async function renderCatalog() {
  try {
    readFiltersFromURL();

    // 1. Fetch products IMMEDIATELY
    fetchAndRenderProducts(false).catch(err => {
      console.error('Initial product fetch failed:', err);
    });

    let companyList = [];
    try {
      // 2. Fetch categories and companies sequentially with cache busting
      const catData  = await getCategoriesFlat();
      catList = Array.isArray(catData) ? catData : (catData?.content || []);
      
      const compData = await getCompanies();
      companyList = Array.isArray(compData) ? compData : (compData?.content || []);

      // ── SEO REDIRECTION ──
      if (filters.categoryId) {
        const match = catList.find(c => String(c.id) === filters.categoryId);
        if (match && match.slug) {
          filters.categorySlug = match.slug;
          filters.categoryId   = '';
          const urlFilters = { ...filters };
          urlFilters.category = urlFilters.categorySlug;
          delete urlFilters.categorySlug;
          updateURL(urlFilters);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
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
      // Remove duplicated sidebar header — the sheet already has its own
      mobileSheet.querySelector('.sidebar-header')?.remove();

      // Accordion headers: toggle open/close + select root category
      mobileSheet.querySelectorAll('.cat-accordion-header[data-root-id]').forEach(header => {
        const acc = header.closest('.cat-accordion-root');
        header.addEventListener('click', (e) => {
          e.stopPropagation();
          acc?.classList.toggle('open');
          filters.categoryId = header.dataset.rootId;
          applyAndFetch();
          closeMobileSheet();
        });
      });

      // Sub-items (subcategory buttons and "All [parent]")
      mobileSheet.querySelectorAll('.cat-sub-item[data-cat-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          filters.categoryId = btn.dataset.catId;
          applyAndFetch();
          closeMobileSheet();
        });
      });

      // Standalone category buttons and "All Categories"
      mobileSheet.querySelectorAll('.filter-all-btn[data-cat-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          filters.categoryId = btn.dataset.catId === 'all' ? '' : btn.dataset.catId;
          applyAndFetch();
          closeMobileSheet();
        });
      });

      // Company filter buttons
      mobileSheet.querySelectorAll('.filter-all-btn[data-company-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          filters.companyId = btn.dataset.companyId === 'all' ? '' : btn.dataset.companyId;
          applyAndFetch();
          closeMobileSheet();
        });
      });

      // Rating stars
      mobileSheet.querySelectorAll('.rating-star-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const v = parseInt(btn.dataset.value, 10);
          filters.minRating = filters.minRating === String(v) ? '' : String(v);
          mobileSheet.querySelectorAll('.rating-star-btn').forEach(b => {
            b.classList.toggle('active',
              parseInt(b.dataset.value, 10) <= parseInt(filters.minRating || '0', 10) && !!filters.minRating);
          });
        });
      });

      // Apply Filters button reads price inputs from the mobile sheet
      mobileSheet.querySelector('.apply-filters-btn')?.addEventListener('click', () => {
        const inputs = mobileSheet.querySelectorAll('input[type="number"]');
        filters.minPrice = inputs[0]?.value?.trim() || '';
        filters.maxPrice = inputs[1]?.value?.trim() || '';
        applyAndFetch();
        closeMobileSheet();
      });

      // Clear All button
      mobileSheet.querySelector('.clear-all-btn')?.addEventListener('click', () => {
        filters = {};
        applyAndFetch();
        closeMobileSheet();
      });
    }
  }

  setupSearch();
  setupSort();
  setupCustomFilters();
  setupViewToggle();
  setupInfiniteScroll();

  updateFilterVisibility();

  if (filters.categoryId || filters.categorySlug) {
    renderCategoryHero();
  } else {
    renderGameTiles();
  }

  } catch (error) {
    console.error('CRITICAL CATALOG ERROR:', error);
  }
}
