import { getFeaturedProducts, getFlashDeals, getCategories, getCompanies } from '../api.js';
import { createProductCard } from '../components/productCard.js';
import { createProductSkeleton } from '../components/skeleton.js';
import { showToast } from '../components/toast.js';
import { makeDraggable } from '../utils/dragScroll.js';

// ─── PROMO SLIDER ────────────────────────────────────────────────────────────

const SLIDES = [
  {
    gradient: 'linear-gradient(135deg, #0f0a2e, #1a0a3e)',
    badge: 'FLASH SALE',
    title: 'Steam Summer Sale',
    subtitle: 'Top titles up to 90% off',
    price: 'From ₹499',
    cta: 'Shop Now →',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" width="100" height="100"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 7l2 2 4-4"/></svg>`,
  },
  {
    gradient: 'linear-gradient(135deg, #0a1a2e, #0a2a1a)',
    badge: 'NEW',
    title: 'Xbox Game Pass',
    subtitle: '100+ games, instant access',
    price: '₹1,299',
    cta: 'Get It Now →',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" width="100" height="100"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>`,
  },
  {
    gradient: 'linear-gradient(135deg, #1a1a0a, #2a180a)',
    badge: 'CRYPTO',
    title: 'Pay with Bitcoin',
    subtitle: '5% extra off with crypto',
    price: '5% Extra Off',
    cta: 'Learn More →',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" width="100" height="100"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  },
  {
    gradient: 'linear-gradient(135deg, #1a0a1a, #2e0a2e)',
    badge: 'HOT',
    title: 'Valorant VP Sale',
    subtitle: 'All regions, instant delivery',
    price: 'From ₹699',
    cta: 'Buy VP →',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" width="100" height="100"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
];

const NEWS_CARDS = [
  { type: 'PROMO',  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`, title: 'Steam Sale starts this Friday — up to 80% off',           date: 'Mar 25, 2026' },
  { type: 'NEWS',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`, title: 'NexVault now accepts USDT crypto payments',               date: 'Mar 20, 2026' },
  { type: 'UPDATE', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`, title: 'Valorant Episode 10 — new exclusive skins',               date: 'Mar 15, 2026' },
  { type: 'PROMO',  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`, title: 'Republic Day Sale — extra 10% with code INDIA26',        date: 'Jan 26, 2026' },
  { type: 'NEWS',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><circle cx="12" cy="8" r="6"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>`, title: 'NexVault reaches 2 million orders delivered',            date: 'Jan 10, 2026' },
];

const BRANDS = ['Steam', 'Xbox', 'PlayStation', 'Riot Games', 'Epic Games', 'Blizzard', 'Netflix', 'Spotify', 'NordVPN'];

function initSlider() {
  const track = document.getElementById('slider-track');
  const dotsWrap = document.getElementById('slider-dots');
  if (!track) return;

  let current = 0;
  let paused = false;

  SLIDES.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.style.background = s.gradient;
    slide.innerHTML = `
      <div class="slide-bg-icon">${s.icon}</div>
      <span class="slide-badge">${s.badge}</span>
      <div class="slide-title">${s.title}</div>
      <div class="slide-subtitle">${s.subtitle}</div>
      <div class="slide-price">${s.price}</div>
      <button class="slide-cta">${s.cta}</button>
    `;
    track.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = `slider-dot${i === 0 ? ' active' : ''}`;
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const goTo = (idx) => {
    current = (idx + SLIDES.length) % SLIDES.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  };

  document.getElementById('slider-prev')?.addEventListener('click', () => goTo(current - 1));
  document.getElementById('slider-next')?.addEventListener('click', () => goTo(current + 1));

  const wrap = document.getElementById('promo-slider');
  wrap?.addEventListener('mouseenter', () => { paused = true; });
  wrap?.addEventListener('mouseleave', () => { paused = false; });

  // Touch swipe
  let touchStartX = 0;
  wrap?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  wrap?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
  });

  setInterval(() => { if (!paused) goTo(current + 1); }, 4000);
}

// ─── FLASH DEALS TIMER ───────────────────────────────────────────────────────

function initFlashTimer() {
  const end = Date.now() + (7 * 3600 + 25 * 60) * 1000;

  const hEl = document.getElementById('timer-h');
  const mEl = document.getElementById('timer-m');
  const sEl = document.getElementById('timer-s');
  if (!hEl) return;

  const pad = n => String(n).padStart(2, '0');

  const tick = () => {
    const diff = Math.max(0, end - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    hEl.textContent = pad(h);
    mEl.textContent = pad(m);
    sEl.textContent = pad(s);
  };

  tick();
  setInterval(tick, 1000);
}

// ─── CATEGORIES CHIPS ────────────────────────────────────────────────────────

async function renderCategoryChips(activeId = null) {
  const container = document.getElementById('categories-row');
  if (!container) return;

  // Add "All" chip
  const allChip = createChip({ id: '', name: 'All' }, !activeId);
  allChip.addEventListener('click', () => {
    window.location.href = 'catalog.html';
  });
  container.appendChild(allChip);

  try {
    const cats = await getCategories();
    const list = Array.isArray(cats) ? cats : (cats.content || cats.items || []);
    list.forEach(cat => {
      const chip = createChip(cat, cat.id === activeId);
      chip.addEventListener('click', () => {
        window.location.href = `catalog.html?categoryId=${cat.id}`;
      });
      container.appendChild(chip);
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

const CAT_ICONS = {
  games:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M7 8h1m4 0h1"/><path d="M8 7v2"/></svg>`,
  'gift card':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  'top-up':   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  streaming:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  vpn:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  software:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
};

function getCatEmoji(name) {
  if (!name) return CAT_ICONS.software;
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
}

function createChip(cat, active) {
  const chip = document.createElement('button');
  chip.className = `cat-chip${active ? ' active' : ''}`;
  const icon = getCatEmoji(cat.name || cat.slug || '');
  chip.innerHTML = `<span class="cat-icon">${icon}</span><span class="cat-label">${cat.name || 'All'}</span>`;
  return chip;
}

// ─── FEATURED PRODUCTS ────────────────────────────────────────────────────────

async function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  // Show skeletons
  const skeletons = Array.from({ length: 8 }, () => createProductSkeleton());
  skeletons.forEach(s => grid.appendChild(s));

  try {
    const data = await getFeaturedProducts();
    const products = Array.isArray(data) ? data : (data.content || data.items || []);

    grid.innerHTML = '';
    products.forEach((product, i) => {
      const card = createProductCard(product);
      card.classList.add('stagger-in');
      card.style.animationDelay = `${i * 60}ms`;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '';
    console.error('Failed to load featured products:', err);
    showToast('Failed to load featured products', 'error');
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><h3>Couldn't load products</h3><p>${err.message}</p>`;
    grid.appendChild(empty);
  }
}

// ─── FLASH DEALS PRODUCTS ─────────────────────────────────────────────────────

const DEAL_GRADIENTS = {
  'PC Games':       'linear-gradient(135deg, #0f0a2e, #1a0a3e)',
  'Gift Cards':     'linear-gradient(135deg, #0f0a2e, #1a0a3e)',
  'Mobile Top-Up':  'linear-gradient(135deg, #0f0a2e, #1a0a4e)',
  'Streaming':      'linear-gradient(135deg, #1a0a0a, #2a0a1a)',
  'VPN & Software': 'linear-gradient(135deg, #0a0a2a, #0a1a2e)',
  'default':        'linear-gradient(135deg, #0d0d1a, #1a1a2e)',
};

function getDealGradient(cat) {
  if (!cat) return DEAL_GRADIENTS.default;
  for (const [k, v] of Object.entries(DEAL_GRADIENTS)) {
    if (k !== 'default' && cat.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return DEAL_GRADIENTS.default;
}

async function renderFlashDeals() {
  const scroll = document.getElementById('deals-scroll');
  if (!scroll) return;

  // Skeleton deals
  for (let i = 0; i < 6; i++) {
    const skel = document.createElement('div');
    skel.className = 'deal-card';
    skel.innerHTML = `
      <div class="skeleton-btn" style="width:54px;height:54px;border-radius:12px;flex-shrink:0;background:linear-gradient(90deg,var(--bg2) 0%,var(--bg3) 50%,var(--bg2) 100%);background-size:200%;animation:shimmer 1.8s infinite;"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
        <div class="skeleton-line w-80"></div>
        <div class="skeleton-line w-60"></div>
        <div class="skeleton-line w-40"></div>
      </div>
    `;
    scroll.appendChild(skel);
  }

  try {
    const data = await getFlashDeals();
    const deals = Array.isArray(data) ? data : (data.content || data.items || []);

    scroll.innerHTML = '';
    deals.forEach(p => {
      const card = document.createElement('div');
      card.className = 'deal-card';
      card.style.cursor = 'pointer';

      const grad = getDealGradient(p.categoryName || '');
      const pct = p.originalPrice && p.price
        ? Math.round((1 - p.price / p.originalPrice) * 100)
        : null;

      const dealIconHTML = p.imageUrl
        ? `<div class="deal-icon" style="background:${grad};overflow:hidden;"><img src="${p.imageUrl}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;"/></div>`
        : `<div class="deal-icon" style="background:${grad};display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" width="28" height="28"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div>`;

      card.innerHTML = `
        ${dealIconHTML}
        <div class="deal-info">
          <div class="deal-name" title="${p.name}">${p.name}</div>
          <div class="deal-delivery"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Instant Delivery</div>
          <div class="deal-price-row">
            <span class="deal-price">₹${(p.price || 0).toLocaleString('en-IN')}</span>
            ${p.originalPrice ? `<span class="deal-orig">₹${p.originalPrice.toLocaleString('en-IN')}</span>` : ''}
            ${pct ? `<span class="deal-discount">-${pct}%</span>` : ''}
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        window.location.href = `product.html?id=${p.id}`;
      });

      scroll.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load flash deals:', err);
    scroll.innerHTML = `<div class="empty-state" style="padding:32px"><p>Couldn't load deals</p></div>`;
  }
}

// ─── NEWS SECTION ─────────────────────────────────────────────────────────────

function renderNews() {
  const container = document.getElementById('news-scroll');
  if (!container) return;

  NEWS_CARDS.forEach(item => {
    const card = document.createElement('div');
    card.className = 'news-card';

    const newsGrads = {
      PROMO:  'linear-gradient(135deg, #1a0a0a, #2e1a0a)',
      NEWS:   'linear-gradient(135deg, #0a1a2e, #0a2a3e)',
      UPDATE: 'linear-gradient(135deg, #0f0a2e, #1a0a3e)',
    };

    card.innerHTML = `
      <div class="news-img" style="background:${newsGrads[item.type] || newsGrads.NEWS}">
        <span class="news-icon">${item.icon}</span>
        <div class="news-img-overlay"></div>
        <span class="news-type-badge ${item.type}">${item.type}</span>
      </div>
      <div class="news-body">
        <div class="news-title">${item.title}</div>
        <div class="news-date">${item.date}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ─── BRANDS SECTION ───────────────────────────────────────────────────────────

async function renderBrands() {
  const row = document.getElementById('brands-row');
  if (!row) return;

  let companies = [];
  try {
    const data = await getCompanies();
    companies = Array.isArray(data) ? data : [];
  } catch { /* fallback to static */ }

  if (companies.length === 0) {
    BRANDS.forEach(brand => {
      const chip = document.createElement('button');
      chip.className = 'brand-chip';
      chip.textContent = brand;
      chip.addEventListener('click', () => {
        const q = encodeURIComponent(brand);
        window.location.href = `catalog.html?search=${q}`;
      });
      row.appendChild(chip);
    });
    return;
  }

  companies.forEach(company => {
    const chip = document.createElement('button');
    chip.className = 'brand-chip';
    if (company.logoUrl) {
      chip.innerHTML = `<img src="${company.logoUrl}" alt="${company.name}" style="width:20px;height:20px;object-fit:contain;border-radius:3px;margin-right:6px;"> ${company.name}`;
    } else {
      chip.textContent = company.name;
    }
    chip.addEventListener('click', () => {
      window.location.href = `catalog.html?companyId=${company.id}`;
    });
    row.appendChild(chip);
  });
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────

export async function renderHome() {
  initSlider();
  initFlashTimer();
  renderCategoryChips();
  renderNews();
  // renderBrands is called async in Promise.all below

  // Enable drag-scroll on all horizontal scroll strips
  makeDraggable(document.querySelector('.trust-bar-inner'));
  makeDraggable(document.getElementById('categories-row'));
  makeDraggable(document.getElementById('deals-scroll'));
  makeDraggable(document.getElementById('news-scroll'));
  makeDraggable(document.getElementById('brands-row'));

  // Parallel fetches
  await Promise.all([
    renderFeatured(),
    renderFlashDeals(),
    renderBrands(),
  ]);
}
