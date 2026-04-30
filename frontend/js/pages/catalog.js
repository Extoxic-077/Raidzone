import { getProducts, apiFetch } from '../api.js?v=1.4.1';
import { parseCatalogRoute } from '../router.js?v=1.4.1';

// ─── CONFIGURATION ──────────────────────────────────────────────────────────

const GAME_LIST = [
  { name: "Arc Raiders", slug: "arc-raiders" },
  { name: "CS2", slug: "cs2" },
  { name: "Delta Force", slug: "delta-force" },
  { name: "Windrose", slug: "windrose" }
];

const GAME_TABS = {
  "arc-raiders": ["items", "coins", "accounts", "boosting"],
  "cs2": ["skins"],
  "delta-force": ["operations", "warfare"],
  "windrose": ["items", "currency"]
};

const PREFERRED_TABS = ["items", "coins", "skins", "currency"];

const GAME_THEMES = {
  'arc-raiders': { emoji: '🤖', badge: 'Featured', logoUrl: '/assets/branding/arc-raiders-logo.png' },
  'cs2': { emoji: '🎯', badge: 'Hot', logoUrl: '/assets/branding/cs2-logo.png' },
  'delta-force': { emoji: '⚔️', badge: 'New' },
  'windrose': { emoji: '🏵️', badge: 'Rising', logoUrl: '/assets/branding/windrose-logo.png' }
};

// ─── 1. STATE & CACHE LAYER ──────────────────────────────────────────────────

const MEMORY_CACHE = {};
const CACHE_TTL = 300 * 1000;

// Keys that survive a game/tab context switch and are not sent as dynamic API filters
const PERSISTENT_KEYS = new Set([
  'game', 'tab', 'page', 'search', 'sort', 'minPrice', 'maxPrice', 'rating', 'brand', 'loading', 'allLoaded'
]);

// Default reset values for user-applied filters
const FILTER_RESET_VALUES = { sort: 'popular', search: '', brand: '' };

function setState(updates) {
  Object.assign(state, updates);
  if (updates.game || updates.tab) {
    Object.keys(state).forEach(key => {
      if (!PERSISTENT_KEYS.has(key) && !key.startsWith('_')) state[key] = null;
    });
  }
  syncAndFetch();
}

function track(event, data) {
  console.log(`[ANALYTICS] ${event}:`, data);
}

const state = {
  game: null,
  tab: null,
  page: 1,
  search: "",
  sort: "popular",
  minPrice: null,
  maxPrice: null,
  rating: null,
  brand: "",
  
  _filters: [],
  _products: [],
  _bulkOptions: {},
  
  loading: false,
  allLoaded: false
};

function normalizeState() {
  if (!state.game) state.game = "arc-raiders";
  state.game = state.game.toLowerCase();
  const tabs = GAME_TABS[state.game] || [];
  if (!tabs.includes(state.tab)) {
    state.tab = tabs.find(t => PREFERRED_TABS.includes(t)) || tabs[0] || "items";
  }
}

// ─── 2. REVOLUTIONARY DATA LAYER (WITH MEMORY CACHING) ─────────────────────

async function initCatalogData() {
  const cacheKey = `init_${state.game}_${state.tab}`;
  const now = Date.now();
  
  if (MEMORY_CACHE[cacheKey] && (now - MEMORY_CACHE[cacheKey].time < CACHE_TTL)) {
     const cached = MEMORY_CACHE[cacheKey].data;
     state._filters = cached.filters || [];
     state._products = cached.products || [];
     state._bulkOptions = cached.options || {};
     state.allLoaded = state._products.length < 20;
     return;
  }

  state.loading = true;
  try {
    // apiFetch already unwraps json.data — do NOT check .success/.data
    const data = await apiFetch(`/products/init?game=${state.game}&tab=${state.tab}`);
    if (data) {
       state._filters = data.filters || [];
       state._products = data.products || [];
       state._bulkOptions = data.options || {};
       state.allLoaded = state._products.length < 20;
       MEMORY_CACHE[cacheKey] = { data, time: now };
    }
  } catch (err) {
    console.error("[INIT ERROR]:", err);
    showFallbackUI();
  } finally {
    state.loading = false;
  }
}

async function loadInitialData(append = false) {
  if (append) {
     state.loading = true;
     try {
       const data = await getProducts(state);
       const items = data.content || data.products || [];
       state._products = [...state._products, ...items];
       state.allLoaded = items.length < 20;
     } finally {
       state.loading = false;
     }
  } else {
     await initCatalogData();
  }
}

// ─── 3. RENDERING LAYER (DIFF & FRAGMENT) ───────────────────────────────────

function renderAll() {
  updateSEO();
  renderSidebar();
  renderHero();
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const fragment = document.createDocumentFragment();
  
  if (state.loading && state._products.length === 0) {
    grid.innerHTML = '<div class="search-spinner" style="display:block;margin:50px auto"></div>';
    return;
  }

  if (state._products.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>No results found</h3><button id="clear-filters-btn">Clear All</button></div>';
    document.getElementById('clear-filters-btn')?.addEventListener('click', clearAllFilters);
    return;
  }

  state._products.forEach(p => fragment.appendChild(createProductCard(p)));
  grid.innerHTML = '';
  grid.appendChild(fragment);
}

function updateSEO() {
  const game = (state.game || '').toUpperCase();
  const tab = (state.tab || '').toUpperCase();
  const title = `${game} ${tab} - RaidZone`.trim();
  document.title = title;
  track("page_view", { title });
}

function renderSidebar() {
  const container = document.getElementById('cat-filter-list');
  if (!container) return;
  container.innerHTML = '';

  container.appendChild(createHeader('Games'));
  GAME_LIST.forEach(game => {
     const btn = document.createElement('button');
     btn.className = `filter-cat-item${state.game === game.slug ? ' active' : ''}`;
     btn.dataset.action = 'game';
     btn.dataset.slug = game.slug;
     btn.innerHTML = `<span>${GAME_THEMES[game.slug]?.emoji || '🎮'}</span> <span>${game.name}</span>`;
     container.appendChild(btn);
  });

  if (state.game) {
    container.appendChild(createHeader('Categories'));
     (GAME_TABS[state.game] || []).forEach(tab => {
        const btn = document.createElement('button');
        btn.className = `filter-cat-item${state.tab === tab ? ' active' : ''}`;
        btn.style.paddingLeft = "24px"; // Indent categories under games
        btn.dataset.action = 'tab';
        btn.dataset.tab = tab;
        btn.textContent = tab;
        container.appendChild(btn);
     });
  }

  if (state._filters.length > 0) {
    container.appendChild(createHeader('Refine'));
    state._filters.forEach(f => {
       const opts = state._bulkOptions[f.key] || [];
       if (!opts.length) return;
       const div = document.createElement('div');
       div.innerHTML = `<div class="sidebar-section-title" style="font-size:10px">${f.label}</div>`;
       const sel = document.createElement('select');
       sel.className = 'catalog-select-elite';
       sel.innerHTML = `<option value="">All</option>` + opts.map(o => `<option value="${o}" ${state[f.key]===o?'selected':''}>${o}</option>`).join('');
       
       // 3. SECURE MUTATION (ITEM 2)
       sel.onchange = (e) => { setState({ [f.key]: e.target.value, page: 1 }); };
       
       div.appendChild(sel);
       container.appendChild(div);
    });
  }
}

// ─── 4. LIFECYCLE ────────────────────────────────────────────────────────────

let fetchTimeout;
function syncAndFetch(append = false) {
  clearTimeout(fetchTimeout);
  const scrollY = window.scrollY;
  
  // 1. HARD STATE NORMALIZATION (ITEM 1)
  normalizeState();

  fetchTimeout = setTimeout(async () => {
    updateURL();
    await loadInitialData(append);
    renderAll();
    
    // 4. BROWSER SAFE SCROLL (ITEM 3)
    if (scrollY > 300) window.scrollTo(0, scrollY);
  }, 100);
}

function onGameChange(slug) {
  setState({ game: slug, tab: null, page: 1 });
}

function onTabChange(tab) {
  setState({ tab, page: 1 });
}

function showFallbackUI() {
  const grid = document.getElementById('products-grid');
  if (grid) grid.innerHTML = '<div class="empty-state"><h3>Offline Mode</h3><p>Could not connect to API.</p></div>';
}

function clearAllFilters() {
  const reset = { page: 1 };
  Object.keys(state).forEach(k => {
    if (!PERSISTENT_KEYS.has(k) && !k.startsWith('_')) reset[k] = null;
    else if (k in FILTER_RESET_VALUES) reset[k] = FILTER_RESET_VALUES[k];
  });
  setState(reset);
}

const CARD_GRADIENTS = {
  'arc-raiders':  'linear-gradient(135deg, #0a1628, #1a3a5c)',
  'cs2':          'linear-gradient(135deg, #1a0a00, #3d1a00)',
  'delta-force':  'linear-gradient(135deg, #0a160a, #1a3a1a)',
  'windrose':     'linear-gradient(135deg, #160a28, #2a1050)',
};

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────

let _sidebarListenerAttached = false;

export async function renderCatalog() {
  // parseCatalogRoute correctly handles /buy/game/tab, /buy/game, and legacy paths
  const route = parseCatalogRoute();
  state.game = route.game || "arc-raiders";
  state.tab  = route.subcategory || null;

  normalizeState();

  await initCatalogData();
  renderAll();

  // Attach sidebar listener only once — prevents duplicate handlers on re-renders
  if (!_sidebarListenerAttached) {
    document.getElementById('cat-filter-list')?.addEventListener('click', (e) => {
       const btn = e.target.closest('button');
       if (!btn) return;
       if (btn.dataset.action === 'game') onGameChange(btn.dataset.slug);
       if (btn.dataset.action === 'tab') onTabChange(btn.dataset.tab);
    });
    _sidebarListenerAttached = true;
  }
}

function createHeader(text) {
  const div = document.createElement('div');
  div.className = 'sidebar-section-title';
  div.textContent = text;
  return div;
}

function createProductCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const isOutOfStock = p.stock === 0;
  const discount = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
  const imgGradient = CARD_GRADIENTS[p.game] || 'linear-gradient(135deg, #0d0922, #160d35)';
  const gameEmoji = GAME_THEMES[p.game]?.emoji || '📦';

  card.innerHTML = `
    <div class="card-image" style="background:${imgGradient}">
      ${p.imageUrl ?
        `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" onerror="this.style.display='none'">` :
        `<div class="card-emoji">${gameEmoji}</div>`
      }
      ${p.badge ? `<div class="card-badge ${p.badge.toLowerCase()}">${p.badge}</div>` : ''}
      ${discount > 0 ? `<div class="card-badge sale" style="left: auto; right: 8px;">-${discount}%</div>` : ''}
      ${isOutOfStock ? `<div class="card-badge card-oos-badge">OUT OF STOCK</div>` : ''}
      <button class="card-wish" aria-label="Add to wishlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    </div>
    <div class="card-body">
      <div class="card-name">${p.name}</div>
      <div class="card-meta">
        <span class="card-type-tag">${p.itemType || 'Item'}</span>
        ${p.subType ? ` • ${p.subType}` : ''}
      </div>
      <div class="card-footer">
        <div class="card-price-block">
          <span class="card-price">$${p.price}</span>
          ${p.originalPrice > p.price ? `<span class="card-orig-price">$${p.originalPrice}</span>` : ''}
        </div>
        <button class="card-add-btn ${isOutOfStock ? 'card-oos-btn' : ''}" ${isOutOfStock ? 'disabled' : ''} aria-label="Add to cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Attach events
  card.querySelector('.card-add-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const btn = e.currentTarget;
    btn.classList.add('click');
    setTimeout(() => btn.classList.remove('click'), 400);
    window.dispatchEvent(new CustomEvent('add-to-cart', { detail: p }));
  });

  card.querySelector('.card-wish')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.toggle('active');
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 300);
    window.dispatchEvent(new CustomEvent('wishlist-toggle', { detail: p }));
  });

  card.onclick = () => {
    track("product_click", { id: p._id, name: p.name });
    window.location.href = `/product.html?id=${p._id}`;
  };

  return card;
}

function updateURL() {
  const p = new URLSearchParams();
  if (state.game) p.set("game", state.game);
  if (state.tab)  p.set("tab", state.tab);
  window.history.replaceState({}, "", `/catalog.html?${p.toString()}`);
}

function renderHero() { /* simplified */ }
