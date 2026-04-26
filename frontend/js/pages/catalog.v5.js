'use strict';

const BLUEPRINT_GROUPS = {
  "🔫 Weapon Mods": ["Angled Grip II", "Angled Grip III", "Compensator II", "Compensator III", "Extended Light Magazine II", "Extended Light Magazine III", "Extended Medium Magazine II", "Extended Medium Magazine III", "Muzzle Brake II", "Muzzle Brake III", "Vertical Grip II", "Vertical Grip III", "Extended Barrel", "Extended Light Magazine", "Extended Medium Magazine", "Vertical Grip", "Angled Grip", "Compensator", "Muzzle Brake"],
  "💣 Explosives": ["Gas Mine", "Smoke Grenade", "Explosive Mine", "Blaze Grenade", "Bettina", "Detonator"],
  "⚙️ Crafting": ["Complex Gun Parts", "Heavy Gun Parts", "Gun Parts", "Electronics", "Chemicals", "Scrap Metal"],
  "💉 Utility": ["Vita Shot", "Defibrillator", "Stimulant", "Medkit", "Adrenaline"],
  "📦 Other": ["Anvil", "Aphelion", "Barricade Kit", "Bobcat", "Burletta", "Canto"]
};


import { getProducts, getCategoriesFlat, getCompanies } from '../api.js?v=11.0.0';
import { createProductCard } from '../components/productCard.v8.js?v=11.0.0';
import { createProductSkeleton } from '../components/skeleton.js?v=11.0.0';
import { showToast } from '../components/toast.js?v=11.0.0';
import { getCurrentFilters, updateURL } from '../router.js?v=12.8.0';
import { SEO } from '../seo.js?v=11.0.0';
import { CATEGORY_CONFIG } from '../category-config.js';

let filters = {};
let currentPage = 0;
let loading = false;
let allLoaded = false;
let totalCount = 0;
let pendingFetch = false;
let catList = [];
let currentGameKey = null;
let currentTabKey = null;
let currentSubTabKey = null;

// ─── STATE HELPERS ───────────────────────────────────────────────────────────

function readFiltersFromURL() {
  const f = getCurrentFilters();
  filters = {
    categoryId: f.categoryId,
    categorySlug: f.categorySlug,
    companyId: f.companyId,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    minRating: f.minRating,
    search: f.search,
    sort: f.sort,
    productType: f.productType,
    itemType: f.itemType || '',
    blueprintTag: f.blueprintTag,
  };
  currentPage = 0;
  allLoaded = false;
  pendingFetch = false;
}

function getFilterParams() {
  const p = { page: currentPage, size: 16 };
  if (filters.categorySlug) {
    p.categorySlug = filters.categorySlug;
  } else if (filters.categoryId) {
    p.categoryId = filters.categoryId;
  }
  if (filters.companyId) p.companyId = filters.companyId;
  if (filters.minPrice) p.minPrice = filters.minPrice;
  if (filters.maxPrice) p.maxPrice = filters.maxPrice;
  if (filters.minRating) p.minRating = filters.minRating;
  if (filters.search) p.search = filters.search;
  if (filters.sort) p.sort = filters.sort;

  // SMART productType mapping
  let pt = filters.productType || '';
  const broadTabs = ['coins', 'items', 'accounts', 'boosting', 'weapons'];
  if (broadTabs.includes(pt.toLowerCase())) pt = '';

  // Rule: Item Type maps to productType
  if (filters.blueprintTag && filters.blueprintTag.startsWith('SubTab:Item Type:')) {
     pt = filters.blueprintTag.replace('SubTab:Item Type:', '');
  } else if (filters.itemType) {
     pt = filters.itemType;
  } else if (currentSubTabKey === 'Blueprints' || currentSubTabKey === 'Weapons') {
     pt = currentSubTabKey;
  }
  
  if (pt) p.productType = pt;
  
  // Combine Sub-Tab and other filters for the backend
  let tags = filters.blueprintTag || '';
  if (tags.startsWith('SubTab:')) {
    tags = ''; // Do NOT send internal UI state to backend
  }
  if (tags) {
    p.blueprintTag = tags;
  }
  
  return p;
}

// ─── SUBCATEGORY ICONS ───────────────────────────────────────────────────────

const SUB_ICONS = {
  // Games — platforms
  'pc': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  'computer': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  'playstation': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M9 21V8.5c0-1.1.9-1.5 1.8-1.2l1.2.4c.7.3 1 .9 1 1.6V21"/><path d="M9 17l-4.5-1.5c-.8-.3-1.5-.9-1.5-1.8 0-.9.7-1.3 1.5-1l4.5 1.5"/><path d="M15 7.5V17l4.5-1.5c.8-.3 1.5-.9 1.5-1.8V9c0-.5-.3-.9-.8-1.1L15 6"/></svg>`,
  'xbox': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M6.5 8c1.5 2.5 2.5 4.5 5.5 5.5 3-1 4-3 5.5-5.5M8 7c1.2 1.8 2.8 3 4 3s2.8-1.2 4-3"/></svg>`,
  'nintendo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="6" width="18" height="12" rx="6"/><circle cx="8.5" cy="12" r="2.5"/><path d="M14.5 9.5h3M14.5 14.5h3M16 9.5v5"/></svg>`,
  'switch': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="6" width="18" height="12" rx="6"/><circle cx="8.5" cy="12" r="2.5"/><path d="M14.5 9.5h3M14.5 14.5h3M16 9.5v5"/></svg>`,
  'mobile': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  'android': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  'ios': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  'webgame': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`,
  'web': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`,
  // Cards / gift
  'steam': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  'gift': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  'wallet': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 12h.01"/><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/></svg>`,
  'google': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M21.805 10.023H12v3.955h5.627c-.254 1.286-1.016 2.376-2.16 3.107v2.583h3.496c2.047-1.884 3.228-4.66 3.228-7.962a9.6 9.6 0 0 0-.386-1.683z"/><path d="M12 22c2.7 0 4.965-.895 6.623-2.422l-3.236-2.518c-.897.601-2.044.956-3.387.956-2.605 0-4.81-1.76-5.598-4.122H3.064v2.594A9.998 9.998 0 0 0 12 22z"/><path d="M6.402 13.894A5.984 5.984 0 0 1 6.09 12c0-.659.113-1.3.312-1.894V7.512H3.064A9.998 9.998 0 0 0 2 12c0 1.614.387 3.14 1.064 4.488l3.338-2.594z"/><path d="M12 6.004c1.468 0 2.786.504 3.822 1.493l2.87-2.87C16.96 2.99 14.695 2 12 2A9.998 9.998 0 0 0 3.064 7.512l3.338 2.594C7.19 7.764 9.395 6.004 12 6.004z"/></svg>`,
  'amazon': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M4 4h16v16H4z"/><path d="M8 10h8M8 14h5"/></svg>`,
  // Streaming / subscriptions
  'netflix': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  'spotify': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M8 13.5c2.5-1 5.5-.5 7.5 1M7 10.5c3-1.5 7-1 9.5 1.5M9 16.5c2-1 4.5-.5 6 .5"/></svg>`,
  'streaming': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  'subscription': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  // Top-up / direct pop-up
  'topup': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'top-up': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'popup': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'pop-up': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'valorant': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'pubg': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`,
  'freefire': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'cod': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'mlbb': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`,
  'roblox': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  // VPN / security
  'vpn': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  'security': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  // Software
  'software': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  'antivirus': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
  'office': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h1m4 0h1M8 7v2"/></svg>`,
  'windows': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
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

  // 1. Sidebar Header
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'sidebar-group sidebar-header-clean';
  sidebarHeader.innerHTML = `
    <div class="sidebar-header-main">
      <h3 class="sidebar-title-main">Filters</h3>
      <button class="clear-all-btn-new" id="clear-all-filters-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
        Clear All
      </button>
    </div>
  `;
  catFilter.appendChild(sidebarHeader);

  // 2. Sidebar Discovery Logic refactored to remove redundant 'Popular Games'
  // High-level navigation is now handled exclusively by the Topbar and Discovery Chips.

  // 3. All Categories (Accordion) Group
  const catsGroup = document.createElement('div');
  catsGroup.className = 'sidebar-group';
  catsGroup.id = 'cat-accordion-group';
  catsGroup.innerHTML = `<div class="sidebar-group-title">Browse Categories</div>`;

  const allBtnRoot = document.createElement('button');
  allBtnRoot.className = `filter-all-btn-new ${!filters.categoryId && !filters.categorySlug ? 'active' : ''}`;
  allBtnRoot.dataset.catId = 'all';
  allBtnRoot.innerHTML = `
    <div class="s-cat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
    <span>All Products</span>
  `;
  allBtnRoot.addEventListener('click', () => {
    filters.categoryId = '';
    filters.categorySlug = '';
    applyAndFetch();
  });
  catsGroup.appendChild(allBtnRoot);

  const roots = catList.filter(c => !c.parentId);
  const children = {};
  catList.filter(c => c.parentId).forEach(c => {
    if (!children[c.parentId]) children[c.parentId] = [];
    children[c.parentId].push(c);
  });

  roots.forEach(root => {
    const subs = children[root.id] || [];
    const isRootActive = filters.categoryId === String(root.id) || filters.categorySlug === root.slug;
    const isAnyChildActive = subs.some(s => filters.categoryId === String(s.id) || filters.categorySlug === s.slug);

    const acc = document.createElement('div');
    acc.className = `cat-accordion-root-new ${isRootActive || isAnyChildActive ? 'open has-active' : ''}`;

    const header = document.createElement('button');
    header.className = `cat-accordion-header-new ${isRootActive ? 'active' : ''}`;
    header.dataset.rootSlug = root.slug;
    header.innerHTML = `
      <div class="s-acc-info">
        <div class="s-acc-icon">${getSubIcon(root.name, root.slug)}</div>
        <span>${root.name}</span>
      </div>
      <svg class="s-acc-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path d="M6 9l6 6 6-6"/></svg>
    `;

    header.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('.s-acc-arrow')) {
        acc.classList.toggle('open');
        return;
      }
      filters.categoryId = '';
      filters.categorySlug = root.slug;
      applyAndFetch();
    });

    const body = document.createElement('div');
    body.className = 'cat-accordion-body-new';

    const allSub = document.createElement('button');
    allSub.className = `cat-sub-item-new ${isRootActive ? 'active' : ''}`;
    allSub.dataset.catSlug = root.slug;
    allSub.innerHTML = `<span class="s-sub-bullet"></span> All ${root.name}`;
    allSub.addEventListener('click', () => {
      filters.categoryId = '';
      filters.categorySlug = root.slug;
      applyAndFetch();
    });
    body.appendChild(allSub);

    subs.forEach(sub => {
      const active = filters.categoryId === String(sub.id) || filters.categorySlug === sub.slug;
      const subBtn = document.createElement('button');
      subBtn.className = `cat-sub-item-new ${active ? 'active' : ''}`;
      subBtn.dataset.catSlug = sub.slug;
      subBtn.innerHTML = `<span class="s-sub-bullet"></span> ${sub.name}`;
      subBtn.addEventListener('click', () => {
        filters.categoryId = '';
        filters.categorySlug = sub.slug;
        applyAndFetch();
      });
      body.appendChild(subBtn);
    });

    acc.appendChild(header);
    acc.appendChild(body);
    catsGroup.appendChild(acc);
  });
  catFilter.appendChild(catsGroup);

  const otherGroup = document.createElement('div');
  otherGroup.className = 'sidebar-group';
  otherGroup.innerHTML = `<div class="sidebar-group-title">Price Range ($)</div>`;

  const prWrap = document.createElement('div');
  prWrap.className = 'price-range-inputs-new';
  prWrap.innerHTML = `
    <input type="number" id="f-min" placeholder="Min" class="price-input-new" value="${filters.minPrice || ''}">
    <input type="number" id="f-max" placeholder="Max" class="price-input-new" value="${filters.maxPrice || ''}">
  `;
  otherGroup.appendChild(prWrap);

  const applyBtn = document.createElement('button');
  applyBtn.className = 'apply-filters-btn-new';
  applyBtn.id = 'apply-filters-btn-sidebar';
  applyBtn.textContent = 'Apply Filters';
  applyBtn.addEventListener('click', () => {
    filters.minPrice = document.getElementById('f-min')?.value || '';
    filters.maxPrice = document.getElementById('f-max')?.value || '';
    applyAndFetch();
  });
  otherGroup.appendChild(applyBtn);


  const ratingLabel = document.createElement('div');
  ratingLabel.className = 'sidebar-group-title';
  ratingLabel.style.marginTop = '20px';
  ratingLabel.textContent = 'Minimum Rating';
  otherGroup.appendChild(ratingLabel);

  const starRow = document.createElement('div');
  starRow.className = 'sidebar-star-row';
  const currentRating = parseInt(filters.minRating || '0', 10);

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('button');
    star.className = `star-btn-new ${i <= currentRating ? 'active' : ''}`;
    star.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
    star.addEventListener('click', () => {
      filters.minRating = filters.minRating === String(i) ? '' : String(i);
      applyAndFetch();
    });
    starRow.appendChild(star);
  }
  otherGroup.appendChild(starRow);

  catFilter.appendChild(otherGroup);

  // NEW: Contextual Filters (Eldorado Style)
  if (typeof renderContextualFilters === 'function') renderContextualFilters();

  document.getElementById('clear-all-filters-btn')?.addEventListener('click', () => {
    filters = {};
    applyAndFetch();
  });
}

function syncActiveStates(catFilter, allBtn) {
  catFilter.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
  catFilter.querySelectorAll('.has-active').forEach(el => el.classList.remove('has-active'));
  if (allBtn) allBtn.classList.remove('active');

  if (!filters.categoryId && !filters.categorySlug) {
    if (allBtn) allBtn.classList.add('active');
    catFilter.querySelector('.filter-all-btn-new')?.classList.add('active');
    return;
  }

  catFilter.querySelectorAll('[data-cat-id], [data-cat-slug]').forEach(el => {
    const matchId = filters.categoryId && el.dataset.catId === filters.categoryId;
    const matchSlug = filters.categorySlug && el.dataset.catSlug === filters.categorySlug;
    if (matchId || matchSlug) {
      el.classList.add('active');
      el.closest('.cat-accordion-root-new')?.classList.add('has-active');
    }
  });

  catFilter.querySelectorAll('.cat-accordion-header-new').forEach(h => {
    const matchSlug = filters.categorySlug && h.dataset.rootSlug === filters.categorySlug;
    const matchId = filters.categoryId && h.dataset.rootId === filters.categoryId;
    if (matchSlug || matchId) {
      h.classList.add('active');
    }
  });
}


function setupSidebarEvents() {
  // Price slider sync
  const slider = document.getElementById('filter-price-slider');
  const maxInput = document.getElementById('filter-max-price');
  if (slider && maxInput) {
    slider.addEventListener('input', () => {
      maxInput.value = slider.value;
      filters.maxPrice = slider.value;
    });
    maxInput.addEventListener('input', () => {
      slider.value = maxInput.value || 0;
      filters.maxPrice = maxInput.value;
    });
  }

  // Delivery & Platform checkboxes
  document.querySelectorAll('.badge-filter input').forEach(input => {
    input.addEventListener('change', () => {
      if (input.name === 'delivery') {
        filters.delivery = input.value; // Simplification for demo
      }
      applyAndFetch();
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

  const grid = document.getElementById('products-grid');
  const endMsg = document.getElementById('end-message');
  const countEl = document.getElementById('product-count');

  if (!grid) { loading = false; return; }

  if (!append) {
    renderActiveFilterBadges();
    grid.innerHTML = '';
    currentPage = 0;
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
      let base = `Showing ${totalCount > 0 ? totalCount : items.length} product${(totalCount || items.length) !== 1 ? 's' : ''}`;

      const currentCat = filters.categorySlug || filters.categoryId;
      let catName = '';
      if (currentCat && catList.length > 0) {
        const found = catList.find(c => c.slug === filters.categorySlug || String(c.id) === String(filters.categoryId));
        if (found) catName = found.name;
      }

      if (filters.search) {
        countEl.innerHTML = `${base} for "<strong>${filters.search}</strong>" ${catName ? `in <strong>${catName}</strong>` : ''}
          <button id="clear-search-btn" style="margin-left:8px;background:none;border:none;color:var(--violet-light);cursor:pointer;font-size:0.8rem;text-decoration:underline;">clear</button>`;
        document.getElementById('clear-search-btn')?.addEventListener('click', () => {
          filters.search = '';
          const si = document.getElementById('catalog-search');
          if (si) si.value = '';
          applyAndFetch();
        });
      } else if (catName) {
        countEl.innerHTML = `${base} for <strong>${catName}</strong>`;
      } else {
        countEl.textContent = base;
      }
      
      // Sync Hero Stats
      const heroStat = document.querySelector('.cat-stat-item .cat-stat-value');
      if (heroStat) heroStat.textContent = totalCount;
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
        loading = false;
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
        loading = false;
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
  const input = document.getElementById('catalog-search');
  const spinner = document.getElementById('search-spinner');
  if (!input) return;

  input.value = filters.search || '';

  input.addEventListener('input', () => {
    if (spinner) spinner.style.display = 'block';
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.search = input.value.trim();
      currentPage = 0;
      allLoaded = false;
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

// setupCustomFilters: replaced by renderTagPills + renderContextualSidebar (contextual per game+tab)
function setupCustomFilters() {
  // Hide the old static dropdowns — they are replaced by dynamic tag chips
  document.querySelectorAll('#type-filter, #blueprint-filter').forEach(el => {
    const wrap = el.closest('.catalog-sort');
    if (wrap) wrap.style.display = 'none';
  });
}

// updateFilterVisibility: replaced — filters now contextual via renderContextualSidebar
function updateFilterVisibility() {
  // No-op: static dropdowns are hidden; dynamic system handles visibility
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
          <div class="game-tile stagger-in" data-game="${dataKey}" data-slug="${cat.slug}"
               role="button" tabindex="0">
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

  // Bind events
  container.querySelectorAll('.game-tile').forEach((el, i) => {
    el.style.animationDelay = `${i * 60}ms`;
    const slug = el.dataset.slug;
    const handleNav = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('nav-to-cat', { detail: slug }));
    };
    el.addEventListener('click', handleNav);
    el.addEventListener('touchstart', handleNav, { passive: false });
  });
}

// ─── CATEGORY HERO ────────────────────────────────────────────────────────────

function renderCategoryHero() {
  const container = document.getElementById('category-hero-container');
  if (!container) return;

  const currentSlug = filters.categorySlug;
  const currentId = filters.categoryId;

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
  const heroTitle = category.name; // Removed logo image banner as per "remove 2nd pic"


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

    <!-- QuickNav removed: deprecated in favor of dynamic tabs -->
  `;
}

// renderQuickNav removed: conflicted with the dynamic tab config system


// Global listener for quick nav
window.addEventListener('nav-to-cat', (e) => {
  filters.categoryId = '';
  filters.categorySlug = e.detail;
  const catFilter = document.getElementById('cat-filter-list');
  const allBtn = catFilter?.querySelector('.filter-all-btn[data-cat-id="all"]');
  if (catFilter && allBtn) syncActiveStates(catFilter, allBtn);
  applyAndFetch();
});


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
      const catData = await getCategoriesFlat();
      catList = Array.isArray(catData) ? catData : (catData?.content || []);

      const compData = await getCompanies();
      companyList = Array.isArray(compData) ? compData : (compData?.content || []);

      // ── SEO REDIRECTION ──
      if (filters.categoryId) {
        const match = catList.find(c => String(c.id) === filters.categoryId);
        if (match && match.slug) {
          filters.categorySlug = match.slug;
          filters.categoryId = '';
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

    setupMobileFilters();

    setupSearch();
    setupSort();
    setupCustomFilters();
    setupViewToggle();
    setupInfiniteScroll();
    setupInstantNavigation();

    updateFilterVisibility();

    // ── CRITICAL: Run the full hierarchy system on initial load ──────────────
    detectHierarchy();
    if (filters.categoryId || filters.categorySlug) {
      renderCategoryHero();
      renderDynamicTabs();
      renderSubTabPills();
      renderTagPills();
      renderContextualSidebar();
    } else {
      renderGameTiles();
    }

  } catch (error) {
    console.error('CRITICAL CATALOG ERROR:', error);
  }
}

function setupMobileFilters() {
  const mobileFilterBtn = document.getElementById('mobile-filter-btn');
  if (mobileFilterBtn) {
    mobileFilterBtn.addEventListener('click', openMobileSheet);
  }

  const overlay = document.getElementById('filter-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeMobileSheet();
      if (history.state?.filterOpen) history.back();
    });
  }

  const closeBtn = document.getElementById('close-filter-sheet');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeMobileSheet();
      if (history.state?.filterOpen) history.back();
    });
  }

  setupSwipeToClose();

  // Populate mobile sheet sidebar from desktop sidebar
  const mobileSheet = document.getElementById('filter-sheet-content');
  if (!mobileSheet) return;

  const desktopSidebar = document.querySelector('.catalog-sidebar');
  if (!desktopSidebar) return;

  // Sync HTML
  mobileSheet.innerHTML = desktopSidebar.innerHTML;

  // Clean up sheet-specific elements if needed
  mobileSheet.querySelector('.sidebar-header-clean')?.remove();

  // ─── RE-BIND MOBILE EVENTS ───

  // Accordion headers in mobile sheet
  mobileSheet.querySelectorAll('.cat-accordion-header-new').forEach(header => {
    const acc = header.closest('.cat-accordion-root-new');
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('.s-acc-arrow')) {
        acc?.classList.toggle('open');
        return;
      }
      acc?.classList.add('open');
      filters.categorySlug = header.dataset.rootSlug;
      filters.categoryId = '';
      applyAndFetch();
      closeMobileSheet();
    });
  });

  // Sub-items and Game buttons in mobile sheet
  mobileSheet.querySelectorAll('.cat-sub-item-new, .sidebar-game-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filters.categorySlug = btn.dataset.catSlug;
      filters.categoryId = '';
      applyAndFetch();
      closeMobileSheet();
    });
  });

  // All Products button in mobile sheet
  mobileSheet.querySelectorAll('.filter-all-btn-new').forEach(btn => {
    btn.addEventListener('click', () => {
      filters.categoryId = '';
      filters.categorySlug = '';
      applyAndFetch();
      closeMobileSheet();
    });
  });

  // Brand chips in mobile sheet
  mobileSheet.querySelectorAll('.brand-chip-new').forEach(btn => {
    btn.addEventListener('click', () => {
      const compId = btn.dataset.companyId;
      filters.companyId = filters.companyId === compId ? '' : compId;
      applyAndFetch();
      closeMobileSheet();
    });
  });

  // Rating stars in mobile sheet
  mobileSheet.querySelectorAll('.star-btn-new').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const v = String(idx + 1);
      filters.minRating = filters.minRating === v ? '' : v;
      applyAndFetch();
      closeMobileSheet();
    });
  });

  // Apply Price Filters in mobile sheet
  mobileSheet.querySelector('.apply-filters-btn-new')?.addEventListener('click', () => {
    const minIn = mobileSheet.querySelector('#f-min');
    const maxIn = mobileSheet.querySelector('#f-max');
    filters.minPrice = minIn?.value || '';
    filters.maxPrice = maxIn?.value || '';
    applyAndFetch();
    closeMobileSheet();
  });

  // Clear All button in mobile sheet (using the header button if present in innerHTML)
  mobileSheet.querySelector('#clear-all-filters-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    filters = {};
    applyAndFetch();
    closeMobileSheet();
  });
}


function setupInstantNavigation() {
  // Global click interceptor for no-reload catalog browsing
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    try {
      const url = new URL(link.href);
      if (url.origin === window.location.origin && url.pathname.includes('catalog.html')) {
        e.preventDefault();
        window.history.pushState({}, '', link.href);

        // Instant update logic
        readFiltersFromURL();
        applyAndFetch(false);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update Game Tabs (if navbar is initialized)
        if (window.renderGameTabs && window.currentCategories) {
          window.renderGameTabs(window.currentCategories);
        }
      }
    } catch (err) {
      // Ignore invalid URLs
    }
  });

  window.addEventListener('popstate', () => {
    readFiltersFromURL();
    applyAndFetch(false);
  });
}

/**
 * Re-fetches products and updates the UI state (URLs, sidebar, etc.)
 * @param {boolean} updateHistory - Whether to push a new state to history
 */
async function applyAndFetch(updateHistory = true) {
  currentPage = 0;
  allLoaded = false;

  // Detect hierarchy before fetching
  detectHierarchy();

  if (updateHistory) {
    const urlFilters = { ...filters };
    if (urlFilters.categorySlug) {
      urlFilters.category = urlFilters.categorySlug;
      delete urlFilters.categorySlug;
    }
    updateURL(urlFilters);
  }

  await fetchAndRenderProducts(false);

  if (filters.categoryId || filters.categorySlug) {
    renderCategoryHero();
    renderDynamicTabs();     // Game-specific tabs
    renderSubTabPills();     // Only if tabConfig has .subTabs
    renderTagPills();        // Contextual tag chips (never global)
    renderContextualSidebar(); // Clears stale and builds fresh per game+tab
  } else {
    // Back to game tiles — hide all hierarchy UI
    renderGameTiles();
    ['game-tabs', 'sub-tabs-container', 'tag-pills-container'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    // Clear any dynamic sidebar filters
    document.querySelectorAll('.dynamic-filter-group').forEach(el => el.remove());
  }

  // Sync sidebar category active states
  const catFilter = document.getElementById('cat-filter-list');
  const allBtn = document.getElementById('filter-all-btn');
  if (catFilter && allBtn) {
    syncActiveStates(catFilter, allBtn);
  }
}

// ─── DYNAMIC HIERARCHY SYSTEM v2 (strict Game→Tab→SubTab→Filters) ──────────

function _slug(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function detectHierarchy() {
  const slug = filters.categorySlug || '';
  currentGameKey = null;

  for (const [name, config] of Object.entries(CATEGORY_CONFIG)) {
    if (slug === config.slug || slug.includes(config.slug)) {
      currentGameKey = name;
      break;
    }
  }

  if (!currentGameKey && filters.categoryId) {
    const cat = catList.find(c => String(c.id) === String(filters.categoryId));
    if (cat) {
      for (const [name] of Object.entries(CATEGORY_CONFIG)) {
        if (cat.name.toLowerCase().includes(name.toLowerCase())) {
          currentGameKey = name;
          break;
        }
      }
    }
  }

  if (currentGameKey && !filters.productType) {
    filters.productType = CATEGORY_CONFIG[currentGameKey].defaultTab;
  } else if (filters.productType) {
     // Normalize case for comparison
     const config = CATEGORY_CONFIG[currentGameKey];
     if (config && config.tabs) {
        const exactMatch = Object.keys(config.tabs).find(k => k.toLowerCase() === filters.productType.toLowerCase());
        if (exactMatch) filters.productType = exactMatch;
     }
  }

  currentTabKey = filters.productType || null;
  
  // Sub-Tab & Item Type Persistence
  if (filters.blueprintTag && filters.blueprintTag.startsWith('SubTab:')) {
    const val = filters.blueprintTag.replace('SubTab:', '');
    if (val.includes('Item Type:')) {
       filters.itemType = val.replace('Item Type:', '');
       currentSubTabKey = 'Item Type';
    } else {
       currentSubTabKey = val;
    }
  } else if (filters.blueprintTag && currentGameKey && currentTabKey) {
    const tabConfig = CATEGORY_CONFIG[currentGameKey].tabs[currentTabKey];
    if (tabConfig.filters && !Array.isArray(tabConfig.filters)) {
      for (const [group, tags] of Object.entries(tabConfig.filters)) {
        if (tags.includes(filters.blueprintTag)) {
          currentSubTabKey = group; 
          break;
        }
      }
    }
  } else {
    currentSubTabKey = null;
  }
  
  // Logic: Blueprint only shows if Item Type is Blueprints
  if (currentTabKey === 'Items' && filters.itemType !== 'Blueprints' && currentSubTabKey === 'Blueprint') {
     currentSubTabKey = 'Item Type';
  }

  // Auto-select first sub-tab if none selected
  if (currentGameKey && currentTabKey) {
    const tabConfig = CATEGORY_CONFIG[currentGameKey].tabs[currentTabKey];
    if (tabConfig && tabConfig.subTabs && tabConfig.subTabs.length > 0 && !currentSubTabKey && !filters.blueprintTag) {
      currentSubTabKey = tabConfig.subTabs[0];
      filters.blueprintTag = `SubTab:${currentSubTabKey}`;
    }
  }
}

// ── 1. TABS: always from CATEGORY_CONFIG[game].tabs keys ─────────────────────
function renderDynamicTabs() {
  const container = document.getElementById('game-tabs');
  if (!container) return;

  const tabs = Object.keys(CATEGORY_CONFIG[currentGameKey].tabs);
  container.style.display = 'flex';

  container.innerHTML = tabs.map(tab =>
    `<div class="dynamic-tab ${currentTabKey === tab ? 'active' : ''}" data-tab="${tab}">${tab}</div>`
  ).join('');

  container.querySelectorAll('.dynamic-tab').forEach(el => {
    el.addEventListener('click', () => {
      filters.productType = el.dataset.tab;
      filters.blueprintTag = '';
      applyAndFetch();
    });
  });
}

function renderSubTabPills() {
  const container = document.getElementById('sub-tabs-container');
  if (!container) return;

  const tabConfig = CATEGORY_CONFIG[currentGameKey].tabs[currentTabKey];
  
  // Rule: Do NOT show sub-tab pills for "Items" anymore (using dropdowns now)
  if (!tabConfig || !tabConfig.subTabs || currentTabKey === 'Items') {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = tabConfig.subTabs.map(st =>
    `<div class="sub-tab-pill ${currentSubTabKey === st ? 'active' : ''}" data-sub="${st}">${st}</div>`
  ).join('');

  container.querySelectorAll('.sub-tab-pill').forEach(el => {
    el.addEventListener('click', () => {
      const val = el.dataset.sub;
      filters.blueprintTag = (currentSubTabKey === val) ? '' : `SubTab:${val}`;
      applyAndFetch();
    });
  });
}

function renderTagPills() {
  let container = document.getElementById('tag-pills-container');
  const anchor = document.getElementById('sub-tabs-container');
  if (!container && anchor) {
    container = document.createElement('div');
    container.id = 'tag-pills-container';
    container.className = 'tag-pills-grid';
    anchor.after(container);
  }
  if (!container) return;

  // STRICT RESET: Always clear the container first
  container.innerHTML = '';
  container.style.display = 'none';

  const hide = () => { container.style.display = 'none'; container.innerHTML = ''; };

  if (!currentGameKey || !currentTabKey) return hide();

  const tabConfig = CATEGORY_CONFIG[currentGameKey].tabs[currentTabKey];

  if (tabConfig.subTabs && !currentSubTabKey) return hide();
  if (!tabConfig.filters) return hide();

  // CASE A: Array filters (simple chips)
  // Ensure these ONLY show for the intended tabs (Coins/Accounts)
  if (Array.isArray(tabConfig.filters)) {
    if (currentTabKey === 'Items') return hide(); // No simple chips on complex Items tab
    
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.innerHTML = tabConfig.filters.map(tag => {
      const isActive = filters.blueprintTag === tag;
      return `<div class="tag-pill ${isActive ? 'active' : ''}" data-tag="${tag}">${tag}</div>`;
    }).join('');
    container.querySelectorAll('.tag-pill').forEach(el => {
      el.addEventListener('click', () => {
        filters.blueprintTag = (filters.blueprintTag === el.dataset.tag) ? '' : el.dataset.tag;
        applyAndFetch();
      });
    });
    return;
  }

    // SPECIAL CASE: Items tab logic moved to side-bar for Eldorado UX
    const isItemsTab = currentTabKey && currentTabKey.toLowerCase() === 'items';
    if (isItemsTab) {
        container.innerHTML = ''; 
        return;
    }

  // Find if any group matches currentSubTabKey ("Blueprints" → "Blueprint")
  let activeGroupKey = null;
  if (currentSubTabKey) {
    const singular = currentSubTabKey.replace(/s$/, '');
    activeGroupKey = filterGroups[currentSubTabKey] ? currentSubTabKey
      : filterGroups[singular] ? singular : null;
  }

  if (activeGroupKey) {
    // Show individual tag chips inside the selected group
    const tags = filterGroups[activeGroupKey];
    container.style.display = 'flex';
    container.innerHTML = tags.map(tag => {
      const isActive = filters.blueprintTag === tag;
      return `<div class="tag-pill ${isActive ? 'active' : ''}" data-tag="${tag}">${tag}</div>`;
    }).join('');
    container.querySelectorAll('.tag-pill').forEach(el => {
      el.addEventListener('click', () => {
        filters.blueprintTag = (filters.blueprintTag === el.dataset.tag)
          ? `SubTab:${currentSubTabKey}`
          : el.dataset.tag;
        applyAndFetch();
      });
    });
  } else {
    // Show group name chips as sub-tab-pill style (e.g. Blueprint / Category)
    const groupKeys = Object.keys(filterGroups);
    container.style.display = 'flex';
    container.innerHTML = groupKeys.map(gk =>
      `<div class="sub-tab-pill" data-group="${gk}">${gk}</div>`
    ).join('');
    container.querySelectorAll('[data-group]').forEach(el => {
      el.addEventListener('click', () => {
        const group = el.dataset.group;
        filters.blueprintTag = `SubTab:${group}`;
        applyAndFetch();
      });
    });
  }
}

// ── 4. CONTEXTUAL SIDEBAR: Eldorado Marketplace Command Center ────────────────
function renderContextualSidebar() {
    const sidebar = document.getElementById('cat-filter-list');
    if (!sidebar) return;
    sidebar.querySelectorAll('.dynamic-filter-group').forEach(el => el.remove());

    const tabConfig = CATEGORY_CONFIG[currentGameKey].tabs[currentTabKey];
    const filterGroups = tabConfig.filters || {};
    const itemTypes = filterGroups["Item Type"] || [];
    const blueprints = filterGroups["Blueprint"] || [];

    const lcTab = (currentTabKey || '').toLowerCase();

    // Items Sidebar Hierarchy (Eldorado Style)
    if (lcTab === 'items') {
        const group = document.createElement('div');
        group.className = 'sidebar-group dynamic-filter-group';
        group.innerHTML = `<div class="sidebar-group-title" style="margin-bottom:8px">Narrow Results</div>`;
        
        // 1. ITEM TYPE
        const typeLabel = document.createElement('div');
        typeLabel.className = 'filter-section-title';
        typeLabel.style.cssText = 'font-size:10px;text-transform:uppercase;color:var(--text-4)';
        typeLabel.textContent = 'Item Type';
        group.appendChild(typeLabel);

        let activeItemType = filters.itemType || (filters.blueprintTag === 'Blueprints' ? 'Blueprints' : '');
        
        const typeDropdown = createCustomDropdown(itemTypes, activeItemType, (val) => {
            filters.itemType = val;
            filters.blueprintTag = ''; 
            applyAndFetch();
        });
        group.appendChild(typeDropdown);

        // 2. BLUEPRINT (Only if Blueprints selected)
        if (activeItemType === 'Blueprints') {
            const bpLabel = document.createElement('div');
            bpLabel.className = 'filter-section-title';
            bpLabel.style.cssText = 'font-size:10px;margin-top:12px;text-transform:uppercase;color:var(--text-4)';
            bpLabel.textContent = 'Blueprint (Searchable)';
            group.appendChild(bpLabel);

            const bpDropdown = createSearchableGroupedDropdown(blueprints, filters.blueprintTag, (val) => {
                filters.blueprintTag = val;
                applyAndFetch();
            });
            group.appendChild(bpDropdown);
        }

        sidebar.appendChild(group);
        return; 
    }

    // Default sidebar for other tabs (Coins/Accounts)
    if (tabConfig.subTabs) return;
    
    // ... rest of legacy sidebar logic if needed ...
}

// ─── HELPERS: PREMIUM COMPONENTS ─────────────────────────────────────────────

function createCustomDropdown(options, active, onSelect) {
    const wrap = document.createElement('div');
    wrap.className = 'custom-dropdown';
    wrap.innerHTML = `
      <div class="custom-dropdown-curr">${active || 'Select...'}</div>
      <div class="custom-dropdown-list">
        ${options.map(opt => `<div class="custom-dropdown-opt ${active===opt?'active':''}" data-val="${opt}">${opt}</div>`).join('')}
      </div>
    `;
    wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        wrap.classList.toggle('open');
    });
    wrap.querySelectorAll('.custom-dropdown-opt').forEach(el => {
        el.addEventListener('click', () => onSelect(el.dataset.val));
    });
    document.addEventListener('click', () => wrap.classList.remove('open'), { once:true });
    return wrap;
}

function createSearchableGroupedDropdown(options, active, onSelect) {
    const wrap = document.createElement('div');
    wrap.className = 'custom-dropdown searchable-dropdown';
    
    // Categorize
    const groups = {};
    options.forEach(opt => {
        let found = false;
        for (const [gname, olist] of Object.entries(BLUEPRINT_GROUPS)) {
            if (olist.includes(opt)) {
                if (!groups[gname]) groups[gname] = [];
                groups[gname].push(opt);
                found = true; break;
            }
        }
        if (!found) {
            if (!groups["Other"]) groups["Other"] = [];
            groups["Other"].push(opt);
        }
    });

    let listHtml = `<div class="search-input-wrap"><input type="text" placeholder="Search blueprints..." onclick="event.stopPropagation()"></div>`;
    for (const [gname, olist] of Object.entries(groups)) {
        listHtml += `<div class="dropdown-group-title">${gname}</div>`;
        listHtml += olist.map(opt => `<div class="custom-dropdown-opt ${active===opt?'active':''}" data-val="${opt}">${opt}</div>`).join('');
    }

    wrap.innerHTML = `
      <div class="custom-dropdown-curr">${active || 'All Blueprints'}</div>
      <div class="custom-dropdown-list">${listHtml}</div>
    `;

    const input = wrap.querySelector('input');
    input.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        wrap.querySelectorAll('.custom-dropdown-opt').forEach(opt => {
            const match = opt.textContent.toLowerCase().includes(q);
            opt.style.display = match ? 'block' : 'none';
        });
    });

    wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        wrap.classList.toggle('open');
    });
    wrap.querySelectorAll('.custom-dropdown-opt').forEach(el => {
        el.addEventListener('click', () => onSelect(el.dataset.val));
    });
    document.addEventListener('click', () => wrap.classList.remove('open'), { once:true });
    return wrap;
}

function renderActiveFilterBadges() {
    let container = document.getElementById('active-filters-container');
    if (!container) {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        container = document.createElement('div');
        container.id = 'active-filters-container';
        container.className = 'active-filters-row';
        grid.parentNode.insertBefore(container, grid);
    }
    container.innerHTML = '';

    const list = [];
    if (filters.itemType) list.push({ label: filters.itemType, key: 'itemType' });
    if (filters.blueprintTag && !filters.blueprintTag.startsWith('SubTab:')) {
        list.push({ label: filters.blueprintTag, key: 'blueprintTag' });
    }

    list.forEach(f => {
        const badge = document.createElement('div');
        badge.className = 'filter-badge stagger-in';
        badge.innerHTML = `
            <span>${f.label}</span>
            <div class="filter-badge-remove" data-key="${f.key}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </div>
        `;
        badge.querySelector('.filter-badge-remove').addEventListener('click', () => {
            filters[f.key] = '';
            applyAndFetch();
        });
        container.appendChild(badge);
    });
}

// ─── HELPERS: PREMIUM COMPONENTS ─────────────────────────────────────────────
