import { showToast } from './toast.js';
import { initAuth, isLoggedIn, getUser, isAdmin, clearAuth } from '../auth.js';
import { logout, getCartCount, getCategories } from '../api.js';

function hexagonSVG() {
  return `<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#C084FC"/>
        <stop offset="100%" stop-color="#22D3EE"/>
      </linearGradient>
    </defs>
    <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" fill="url(#hg)"/>
    <path d="M14 6L21.26 10.5V19.5L14 24L6.74 19.5V10.5L14 6Z" fill="rgba(7,7,15,0.6)"/>
  </svg>`;
}

// ── Current page detection ────────────────────────────────────────────────────

function currentPage() {
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path === '') return 'home';
  if (path.includes('catalog')) return 'catalog';
  if (path.includes('cart'))    return 'cart';
  if (path.includes('profile') || path.includes('orders') || path.includes('wishlist')) return 'profile';
  return '';
}

// ── Desktop user button ───────────────────────────────────────────────────────

function userButtonHTML() {
  if (isLoggedIn()) {
    const user    = getUser();
    const initial = (user?.name || 'U')[0].toUpperCase();
    const name    = user?.name?.split(' ')[0] || 'Account';
    return `
      <button class="user-btn" id="user-btn" aria-label="Profile" aria-expanded="false">
        <div class="user-avatar" style="background:linear-gradient(135deg,#7C3AED,#22D3EE)">${initial}</div>
        <span class="user-name">${name}</span>
        <svg class="user-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div class="user-dropdown" id="user-dropdown" role="menu" aria-hidden="true">
        <div class="dropdown-header">
          <div class="dropdown-name">${user?.name || 'User'}</div>
          <div class="dropdown-email">${user?.email || ''}</div>
        </div>
        <div class="dropdown-divider"></div>
        <a href="profile.html" class="dropdown-item" role="menuitem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          My Profile
        </a>
        <a href="orders.html" class="dropdown-item" role="menuitem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          My Orders
        </a>
        <a href="wishlist.html" class="dropdown-item" role="menuitem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          My Wishlist
        </a>
        ${isAdmin() ? `
        <div class="dropdown-divider"></div>
        <a href="admin/index.html" class="dropdown-item dropdown-item-admin" role="menuitem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Admin Panel
        </a>` : ''}
        <div class="dropdown-divider"></div>
        <button class="dropdown-item dropdown-item-danger" id="logout-btn" role="menuitem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </div>
    `;
  }
  return `
    <a href="login.html" class="btn btn-primary btn-signin" id="user-btn" style="text-decoration:none;padding:8px 18px;font-size:14px;font-weight:600;border-radius:var(--r-md)">
      Sign In
    </a>
  `;
}

// ── Desktop navbar ────────────────────────────────────────────────────────────

function renderDesktopNavbar(el, categories, activeCatId) {
  el.innerHTML = `
    <nav class="navbar-inner">
      <a href="index.html" class="navbar-logo">
        ${hexagonSVG()}
        NexVault
      </a>

      <div class="navbar-cats">
        <button class="nav-cat-btn${!activeCatId ? ' active' : ''}" data-id="">All</button>
        ${categories.map(c => `
          <button class="nav-cat-btn${activeCatId === c.id ? ' active' : ''}" data-id="${c.id}">
            ${c.emoji ? c.emoji + ' ' : ''}${c.name}
          </button>
        `).join('')}
      </div>

      <div class="navbar-spacer"></div>

      <div class="navbar-actions">
        <button class="icon-btn" id="notif-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="icon-badge">3</span>
        </button>

        <button class="icon-btn" id="wishlist-btn" aria-label="Wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <button class="icon-btn" id="cart-btn" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span class="icon-badge" id="cart-badge">0</span>
        </button>

        <div class="user-btn-wrap" style="position:relative">
          ${userButtonHTML()}
        </div>
      </div>
    </nav>
  `;
}

// ── Mobile top navbar ─────────────────────────────────────────────────────────

function renderMobileNavbar(el) {
  const user    = getUser();
  const initial = isLoggedIn() ? (user?.name || 'U')[0].toUpperCase() : null;

  el.innerHTML = `
    <nav class="navbar-inner navbar-mobile-top">
      <a href="index.html" class="navbar-logo">
        ${hexagonSVG()}
        NexVault
      </a>
      <div class="navbar-spacer"></div>
      <div class="navbar-actions" style="gap:8px">
        ${isLoggedIn() ? `
          <div class="user-btn-wrap" style="position:relative">
            <button class="user-btn" id="user-btn-mobile" aria-label="Profile" aria-expanded="false">
              <div class="user-avatar" style="background:linear-gradient(135deg,#7C3AED,#22D3EE);width:32px;height:32px;font-size:13px">${initial}</div>
            </button>
            <div class="user-dropdown" id="user-dropdown-mobile" role="menu" aria-hidden="true">
              <div class="dropdown-header">
                <div class="dropdown-name">${user?.name || 'User'}</div>
                <div class="dropdown-email">${user?.email || ''}</div>
              </div>
              <div class="dropdown-divider"></div>
              <a href="orders.html"  class="dropdown-item">My Orders</a>
              <a href="profile.html" class="dropdown-item">Profile</a>
              <a href="wishlist.html" class="dropdown-item">Wishlist</a>
              ${isAdmin() ? `<a href="admin/index.html" class="dropdown-item dropdown-item-admin">Admin Panel</a>` : ''}
              <div class="dropdown-divider"></div>
              <button class="dropdown-item dropdown-item-danger" id="logout-btn-mobile">Sign Out</button>
            </div>
          </div>
        ` : `
          <a href="login.html" class="btn btn-primary" style="text-decoration:none;padding:7px 16px;font-size:13px;font-weight:600;border-radius:var(--r-md)">
            Sign In
          </a>
        `}
      </div>
    </nav>
  `;
}

// ── Mobile bottom navigation bar ──────────────────────────────────────────────

function renderBottomNav() {
  if (document.getElementById('bottom-nav')) return; // already rendered
  const page = currentPage();

  const nav = document.createElement('nav');
  nav.id = 'bottom-nav';
  nav.innerHTML = `
    <a href="index.html"   class="bottom-nav-item ${page === 'home'    ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>Home</span>
    </a>
    <a href="catalog.html" class="bottom-nav-item ${page === 'catalog'  ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <span>Catalog</span>
    </a>
    <button class="bottom-nav-item ${page === 'cart' ? 'active' : ''}" id="bottom-nav-cart">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <span>Cart <span id="cart-badge-mobile" style="display:none"></span></span>
    </button>
    <button class="bottom-nav-item ${page === 'profile' ? 'active' : ''}" id="bottom-nav-profile">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span>Profile</span>
    </button>
  `;

  // Add body bottom padding so content isn't hidden behind bottom nav
  document.body.style.paddingBottom = '64px';
  document.body.appendChild(nav);

  document.getElementById('bottom-nav-cart')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 600);
      return;
    }
    window.location.href = 'cart.html';
  });

  document.getElementById('bottom-nav-profile')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 600);
      return;
    }
    window.location.href = 'profile.html';
  });
}

// ── Inject shared styles ──────────────────────────────────────────────────────

function injectDropdownStyles() {
  if (document.getElementById('dropdown-styles')) return;
  const style = document.createElement('style');
  style.id = 'dropdown-styles';
  style.textContent = `
    /* Desktop dropdown */
    .user-btn-wrap { position: relative; }
    .user-btn { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .user-chevron { transition: transform 0.2s ease; }
    .user-btn[aria-expanded="true"] .user-chevron { transform: rotate(180deg); }
    .user-dropdown {
      position: absolute; top: calc(100% + 10px); right: 0; min-width: 200px;
      background: var(--bg2); border: 1px solid var(--glass-border);
      border-radius: var(--r-lg); padding: 6px; z-index: 200;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      opacity: 0; pointer-events: none; transform: translateY(-8px);
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .user-dropdown.open { opacity: 1; pointer-events: all; transform: translateY(0); }
    .dropdown-header { padding: 10px 12px 8px; }
    .dropdown-name { font-weight: 600; font-size: 14px; color: var(--text-1); }
    .dropdown-email { font-size: 12px; color: var(--text-4); margin-top: 2px; }
    .dropdown-divider { height: 1px; background: var(--glass-border); margin: 4px 0; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 9px 12px; border-radius: var(--r-md); font-size: 13px;
      color: var(--text-2); font-weight: 500; text-decoration: none;
      cursor: pointer; background: none; border: none; font-family: var(--font-body);
      transition: background var(--ease-fast), color var(--ease-fast); text-align: left;
    }
    .dropdown-item:hover { background: var(--glass); color: var(--text-1); }
    .dropdown-item-danger { color: var(--danger); }
    .dropdown-item-danger:hover { background: rgba(239,68,68,0.1); color: var(--danger); }
    .dropdown-item-admin { color: var(--cyan); }

    /* Mobile top navbar */
    .navbar-mobile-top { padding: 0 16px; }

    /* Bottom nav */
    #bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0; height: 60px;
      background: var(--bg2); border-top: 1px solid var(--glass-border);
      display: flex; align-items: stretch; z-index: 100;
      backdrop-filter: blur(12px);
    }
    .bottom-nav-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 3px; color: var(--text-4); font-size: 10px;
      font-family: var(--font-body); font-weight: 500; text-decoration: none;
      background: none; border: none; cursor: pointer;
      transition: color 0.15s ease;
    }
    .bottom-nav-item.active { color: var(--primary); }
    .bottom-nav-item:hover  { color: var(--text-2); }
    .bottom-nav-item.active svg { stroke: var(--primary); }

    @media (min-width: 768px) {
      #bottom-nav { display: none; }
      body { padding-bottom: 0 !important; }
    }
  `;
  document.head.appendChild(style);
}

// ── Bind desktop events ───────────────────────────────────────────────────────

function bindDesktopEvents(el) {
  const onScroll = () => el.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  el.querySelectorAll('.nav-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      window.location.href = id ? `catalog.html?categoryId=${id}` : 'catalog.html';
    });
  });

  document.getElementById('notif-btn')?.addEventListener('click', () => {
    showToast('No new notifications', 'info');
  });

  document.getElementById('wishlist-btn')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 800);
      return;
    }
    window.location.href = 'wishlist.html';
  });

  document.getElementById('cart-btn')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 800);
      return;
    }
    window.location.href = 'cart.html';
  });

  bindDropdown('user-btn', 'user-dropdown', 'logout-btn');
}

// ── Bind mobile events ────────────────────────────────────────────────────────

function bindMobileEvents() {
  bindDropdown('user-btn-mobile', 'user-dropdown-mobile', 'logout-btn-mobile');
}

// ── Shared dropdown logic ─────────────────────────────────────────────────────

function bindDropdown(btnId, dropdownId, logoutId) {
  const userBtn      = document.getElementById(btnId);
  const userDropdown = document.getElementById(dropdownId);
  if (!userBtn || !userDropdown) return;

  let dropdownOpen = false;

  function openDropdown() {
    dropdownOpen = true;
    userDropdown.classList.add('open');
    userDropdown.setAttribute('aria-hidden', 'false');
    userBtn.setAttribute('aria-expanded', 'true');
  }
  function closeDropdown() {
    dropdownOpen = false;
    userDropdown.classList.remove('open');
    userDropdown.setAttribute('aria-hidden', 'true');
    userBtn.setAttribute('aria-expanded', 'false');
  }

  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownOpen ? closeDropdown() : openDropdown();
  });
  document.addEventListener('click', () => { if (dropdownOpen) closeDropdown(); });
  userDropdown.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById(logoutId)?.addEventListener('click', async () => {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    showToast('Logged out successfully', 'info');
    setTimeout(() => { window.location.href = 'index.html'; }, 600);
  });
}

// ── Load cart count ───────────────────────────────────────────────────────────

function loadCartCount() {
  if (!isLoggedIn()) return;
  getCartCount()
    .then(data => {
      const count = data?.count ?? 0;
      document.querySelectorAll('#cart-badge, #cart-badge-mobile').forEach(b => {
        if (b) b.textContent = count;
      });
    })
    .catch(() => {});
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function initNavbar() {
  await initAuth();
  const el = document.getElementById('navbar');
  if (!el) return;

  const params      = new URLSearchParams(window.location.search);
  const activeCatId = params.get('categoryId') || '';

  let categories = [];
  try { categories = await getCategories(); } catch { /* silent */ }

  injectDropdownStyles();

  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  if (isMobile) {
    renderMobileNavbar(el);
    bindMobileEvents();
    renderBottomNav();
  } else {
    renderDesktopNavbar(el, categories, activeCatId);
    bindDesktopEvents(el);
  }

  loadCartCount();

  // Re-render on resize crossing the 768px breakpoint
  let wasMobile = isMobile;
  window.addEventListener('resize', () => {
    const nowMobile = window.matchMedia('(max-width: 767px)').matches;
    if (nowMobile !== wasMobile) {
      wasMobile = nowMobile;
      if (nowMobile) {
        renderMobileNavbar(el);
        bindMobileEvents();
        renderBottomNav();
      } else {
        renderDesktopNavbar(el, categories, activeCatId);
        bindDesktopEvents(el);
        document.getElementById('bottom-nav')?.remove();
        document.body.style.paddingBottom = '';
      }
      loadCartCount();
    }
  });
}
