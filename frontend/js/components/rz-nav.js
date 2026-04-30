import { showToast } from './toast.js';
import { initAuth, isLoggedIn, getUser, isAdmin, clearAuth, isLikelyLoggedIn } from '../auth.js';
import { logout, getCartCount, getCategories, getNotificationCount, getNotifications, markAllNotificationsRead, markNotificationRead } from '../api.js';
import { NotificationBroker } from './NotificationBroker.js';
import { SocialProof } from './SocialProof.js';

// ── Static game list used as fallback before API loads ────────────────────────

const STATIC_GAMES = [
  { id: '', name: 'Arc Raiders', slug: 'arc-raiders', children: [] },
  { id: '', name: 'CS2',         slug: 'cs2',         children: [] },
  { id: '', name: 'Delta Force', slug: 'delta-force', children: [] },
  { id: '', name: 'Windrose',    slug: 'windrose',    children: [] }
];

// ── Mega-menu builder ─────────────────────────────────────────────────────────

function buildMegaMenuHTML(categories) {
  return categories.map(cat => {
    const hasChildren = cat.children && cat.children.length > 0;
    if (!hasChildren) {
      return `<button class="nav-cat-btn" data-id="${cat.id}" data-slug="${cat.slug}">${cat.name}</button>`;
    }

    const groupsHTML = cat.children.map(sub => {
      const hasGrandchildren = sub.children && sub.children.length > 0;

      if (!hasGrandchildren) {
        return `<a class="mega-sub-link" href="/catalog.html?game=${cat.slug}&tab=${sub.slug}" data-id="${sub.id}" data-slug="${sub.slug}">${sub.name}</a>`;
      }

      const grandchildLinks = sub.children.map(g =>
        `<a class="mega-sub-link nested" href="/catalog.html?game=${cat.slug}&tab=${g.slug}" data-id="${g.id}" data-slug="${g.slug}">${g.name}</a>`
      ).join('');

      return `
        <div class="mega-nested-group">
          <a class="mega-nested-title" href="/catalog.html?game=${cat.slug}&tab=${sub.slug}">${sub.name}</a>
          <div class="mega-nested-links">${grandchildLinks}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="mega-group" data-group-id="${cat.id}">
        <button class="nav-cat-btn has-mega" data-id="${cat.id}" data-slug="${cat.slug}" aria-haspopup="true" aria-expanded="false">
          ${cat.name}
          <svg class="mega-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="mega-dropdown">
          <div class="mega-dropdown-inner">
            <a class="mega-sub-link mega-sub-all" href="/catalog.html?game=${cat.slug}" data-id="${cat.id}" data-slug="${cat.slug}">
              <span style="font-weight:700">All ${cat.name}</span>
            </a>
            <div class="mega-groups-container">
              ${groupsHTML}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function hexagonSVG() {
  return `<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#C084FC"/>
        <stop offset="100%" stop-color="#22D3EE"/>
      </linearGradient>
    </defs>
    <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" fill="url(#hg)"/>
    <path d="M14 6L21.26 10.5V19.5L14 24L6.74 19.5V10.5L14 6Z" fill="rgba(255,255,255,0.1)"/>
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
  if (!isLoggedIn()) {
    // Optimistic: if we think they are logged in, show a skeleton avatar instead of SIGN IN
    if (isLikelyLoggedIn()) {
      return `
        <div class="user-btn-skeleton" style="width:120px;height:36px;background:rgba(255,255,255,0.05);border-radius:var(--r-md);animation:pulse 2s infinite"></div>
      `;
    }
    return `
      <a href="login.html" class="btn btn-primary" style="text-decoration:none;padding:8px 18px;font-size:14px;font-weight:700;border-radius:var(--r-md);text-transform:uppercase">
        SIGN IN
      </a>
    `;
  }
  const user = getUser();
  const initial = (user?.name || 'U')[0].toUpperCase();
  
  return `
    <button class="user-btn" id="user-btn" aria-haspopup="true" aria-expanded="false">
      <div class="user-avatar" style="background:linear-gradient(135deg,#7C3AED,#22D3EE);width:32px;height:32px;font-size:13px">${initial}</div>
      <span class="user-name-span" style="font-weight:600;font-size:14px;color:var(--text-1)">${user?.name || 'User'}</span>
      <svg class="user-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="user-dropdown" id="user-dropdown" role="menu" aria-hidden="true">
      <div class="dropdown-header">
        <div class="dropdown-name">${user?.name || 'User'}</div>
        <div class="dropdown-email">${user?.email || ''}</div>
      </div>
      <div class="dropdown-divider"></div>
      <a href="orders.html"   class="dropdown-item">My Orders</a>
      <a href="profile.html" class="dropdown-item">Profile</a>
      <a href="wishlist.html" class="dropdown-item">Wishlist</a>
      ${isAdmin() ? `<a href="admin/index.html" class="dropdown-item dropdown-item-admin">Admin Panel</a>` : ''}
      <div class="dropdown-divider"></div>
      <button class="dropdown-item dropdown-item-danger" id="logout-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </button>
    </div>
  `;
}

// ── Desktop navbar ────────────────────────────────────────────────────────────

function renderDesktopNavbar(el, categories, activeCatId) {
  el.innerHTML = `
    <nav class="navbar-inner">
      <a href="index.html" class="navbar-logo">
        ${hexagonSVG()}
        RAIDZONE
      </a>

      <div class="navbar-cats">
        <button class="nav-cat-btn${!activeCatId ? ' active' : ''}" data-id="">All</button>
        ${buildMegaMenuHTML(categories)}
      </div>

      <div class="navbar-spacer"></div>

      <div class="navbar-actions">
        <div class="notif-wrap" style="position:relative">
          <button class="icon-btn" id="notif-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="icon-badge notif-badge" id="notif-badge" style="display:none">0</span>
          </button>
          <div class="notif-dropdown" id="notif-dropdown" role="menu" aria-hidden="true" style="display:none">
            <div class="notif-dropdown-header">
              <span class="notif-dropdown-title">Notifications</span>
              <button class="notif-mark-all" id="notif-mark-all">Mark all as read</button>
            </div>
            <div class="notif-dropdown-list" id="notif-dropdown-list">
              <div class="notif-empty">Loading…</div>
            </div>
            <a href="notifications.html" class="notif-view-all">View all notifications →</a>
          </div>
        </div>

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
  const logged  = isLoggedIn();
  const likely  = isLikelyLoggedIn();
  const initial = (user?.name || 'U')[0].toUpperCase();

  let actionsContent = '';
  if (logged) {
    actionsContent = `
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
          <a href="orders.html"   class="dropdown-item">My Orders</a>
          <a href="profile.html" class="dropdown-item">Profile</a>
          <a href="wishlist.html" class="dropdown-item">Wishlist</a>
          ${isAdmin() ? `<a href="admin/index.html" class="dropdown-item dropdown-item-admin">Admin Panel</a>` : ''}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item dropdown-item-danger" id="logout-btn-mobile">Logout</button>
        </div>
      </div>
    `;
  } else if (likely) {
    actionsContent = `
      <div class="user-btn-skeleton" style="width:36px;height:36px;background:rgba(255,255,255,0.05);border-radius:50%;animation:pulse 2s infinite"></div>
    `;
  } else {
    actionsContent = `
      <span class="mobile-signin-wrap">
        <a href="login.html" class="btn btn-primary mobile-signin-btn">
          SIGN IN
        </a>
      </span>
    `;
  }

  el.innerHTML = `
    <nav class="navbar-inner navbar-mobile-top">
      <a href="index.html" class="navbar-logo">
        ${hexagonSVG()}
        RAIDZONE
      </a>
      <div class="navbar-spacer"></div>
      <div class="navbar-actions" style="gap:8px">
        ${actionsContent}
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
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
      <span>Catalog</span>
    </a>
    <button class="bottom-nav-item" id="bottom-nav-search" aria-label="Search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <span>Search</span>
    </button>
    <button class="bottom-nav-item" id="bottom-nav-wishlist" aria-label="Wishlist">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <span>Wishlist</span>
    </button>
    <button class="bottom-nav-item ${page === 'cart' ? 'active' : ''}" id="bottom-nav-cart">
      <span class="bottom-nav-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span class="mobile-cart-badge" id="cart-badge-mobile"></span>
      </span>
      <span>Cart</span>
    </button>
  `;

  document.body.style.paddingBottom = '80px';
  document.body.appendChild(nav);

  // Bind bottom nav click events with useCapture for better mobile support
  const bindBottomNavEvents = () => {
    const cartBtn = document.getElementById('bottom-nav-cart');
    const searchBtn = document.getElementById('bottom-nav-search');
    const wishBtn = document.getElementById('bottom-nav-wishlist');

    cartBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn()) {
        showToast('Please sign in first', 'info');
        setTimeout(() => { window.location.href = 'login.html'; }, 600);
        return;
      }
      window.location.href = 'cart.html';
    }, { passive: false });

    searchBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = 'catalog.html';
    }, { passive: false });

    wishBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn()) {
        showToast('Please sign in first', 'info');
        setTimeout(() => { window.location.href = 'login.html'; }, 600);
        return;
      }
      window.location.href = 'wishlist.html';
    }, { passive: false });
  };

  // Immediate binding for instant click response
  bindBottomNavEvents();
}

// ── Inject shared styles ──────────────────────────────────────────────────────

function injectDropdownStyles() {
  if (document.getElementById('dropdown-styles')) return;
  const style = document.createElement('style');
  style.id = 'dropdown-styles';
  style.textContent = `
    #navbar, .navbar-inner, .navbar-cats { overflow: visible !important; }

    /* ── Mega menu ────────────────────────────────────────────────────────── */
    .mega-group { position: relative; display: inline-flex; height: 100%; align-items: center; }
    .has-mega { display: flex; align-items: center; gap: 6px; cursor: pointer; }
    .mega-chevron { transition: transform 0.25s ease; flex-shrink: 0; pointer-events: none; }
    .has-mega[aria-expanded="true"] .mega-chevron { transform: rotate(180deg); }

    .mega-dropdown {
      position: absolute;
      top: calc(100% - 10px);
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      min-width: 200px;
      background: #121220;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 10px;
      z-index: 99999;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .mega-dropdown.open {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
      pointer-events: all;
    }
    /* Simple scale in animation for modern feel */
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.98); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }
    .mega-dropdown.open {
      animation: dropdownIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .mega-sub-link {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #b0b0c0;
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .mega-sub-link:hover { background: rgba(255,255,255,0.06); color: #fff; transform: translateX(4px); }
    .mega-sub-all { border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px; color: #7c3aed; font-weight: 700; }

    .mega-dropdown-inner { min-width: 250px; }
    .mega-groups-container { display: flex; flex-direction: column; gap: 12px; }
    .mega-nested-group { display: flex; flex-direction: column; gap: 4px; padding: 4px 0; }
    .mega-nested-title { 
      font-size: 13px; font-weight: 700; color: #fff; 
      text-decoration: none; padding: 4px 16px; 
      text-transform: uppercase; letter-spacing: 0.5px;
      opacity: 0.9;
    }
    .mega-nested-title:hover { color: var(--primary); }
    .mega-nested-links { display: flex; flex-direction: column; gap: 2px; padding-left: 12px; }
    .mega-sub-link.nested { font-size: 13px; padding: 6px 16px; opacity: 0.8; }
    .mega-sub-link.nested:hover { opacity: 1; }
    .nav-cat-btn, .icon-btn, .user-btn { will-change: transform, filter; transform: translateZ(0); }
    .nav-cat-btn:hover, .icon-btn:hover, .user-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }

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
    .mobile-signin-wrap { display: flex; align-items: center; }
    .mobile-signin-btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      text-decoration: none;
      border-radius: var(--r-md);
      background: var(--gradient);
      color: #fff;
    }

    /* Bottom nav */
    #bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0; height: 64px;
      background: var(--bg2); border-top: 1px solid var(--glass-border);
      display: flex; align-items: stretch; z-index: 1300;
      backdrop-filter: blur(12px);
      padding-bottom: env(safe-area-inset-bottom, 8px);
    }
    .bottom-nav-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 4px; color: var(--text-4); font-size: 10px;
      font-family: var(--font-body); font-weight: 500; text-decoration: none;
      background: none; border: none; cursor: pointer;
      transition: color 0.15s ease;
      padding: 6px 4px;
      min-height: 44px;
      min-width: 44px;
      touch-action: manipulation;
    }
    .bottom-nav-item:active { transform: scale(0.95); opacity: 0.7; }
    .bottom-nav-item.active { color: var(--primary); }
    .bottom-nav-item:hover  { color: var(--text-2); }
    .bottom-nav-item svg { display: block; stroke: currentColor; transition: stroke 0.15s ease; width: 22px; height: 22px; }

    .bottom-nav-icon-wrap {
      position: relative; display: inline-flex; align-items: center; justify-content: center;
    }

    .mobile-cart-badge {
      position: absolute; top: -6px; right: -8px;
      min-width: 16px; height: 16px;
      background: var(--primary); color: #fff; border-radius: 8px;
      font-size: 10px; font-weight: 700; line-height: 16px;
      padding: 0 4px; text-align: center;
    }
    .mobile-cart-badge:empty { display: none; }

    @media (min-width: 768px) {
      #bottom-nav { display: none; }
      body { padding-bottom: 0 !important; }
    }

    /* Notification dropdown */
    .notif-wrap { position: relative; }
    .notif-dropdown {
      position: absolute; top: calc(100% + 10px); right: -60px;
      width: 360px; background: var(--bg2); border: 1px solid var(--glass-border);
      border-radius: var(--r-lg); z-index: 200; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .notif-dropdown-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px; border-bottom: 1px solid var(--glass-border);
    }
    .notif-dropdown-title { font-weight: 700; font-size: 14px; color: var(--text-1); }
    .notif-mark-all {
      font-size: 11px; color: var(--violet-light); background: none; border: none;
      cursor: pointer; font-family: var(--font-body); padding: 0;
    }
    .notif-mark-all:hover { text-decoration: underline; }
    .notif-dropdown-list { max-height: 320px; overflow-y: auto; }
    .notif-item {
      display: flex; gap: 10px; padding: 10px 16px; cursor: pointer;
      transition: background var(--ease-fast); border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .notif-item:hover { background: var(--glass); }
    .notif-item--unread {
      background: rgba(124,58,237,0.06);
      border-left: 3px solid var(--primary);
    }
    .notif-item--unread:hover { background: rgba(124,58,237,0.1); }
    .notif-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--glass); color: var(--violet-light); }
    .notif-content { flex: 1; min-width: 0; }
    .notif-title { font-size: 12px; font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
    .notif-msg   { font-size: 11px; color: var(--text-3); line-height: 1.4; white-space: normal; }
    .notif-time  { font-size: 10px; color: var(--text-4); margin-top: 3px; }
    .notif-empty { padding: 24px 16px; text-align: center; font-size: 12px; color: var(--text-4); }
    .notif-view-all {
      display: block; text-align: center; padding: 10px; font-size: 12px;
      color: var(--violet-light); text-decoration: none; border-top: 1px solid var(--glass-border);
    }
    .notif-view-all:hover { background: var(--glass); }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .mega-dropdown.open,
    .user-dropdown.open,
    .notif-dropdown[aria-hidden="false"] {
      animation: dropdownIn 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
      transform-origin: top center;
    }

    @media (prefers-reduced-motion: reduce) {
      .nav-cat-btn, .icon-btn, .user-btn, .mega-dropdown, .user-dropdown, .notif-dropdown {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

let globalsBound = false;

function bindDesktopEvents(el) {
  if (!globalsBound) {
    const onScroll = () => {
      const navEl = document.getElementById('navbar');
      if (navEl) navEl.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Plain category buttons (no children)
  el.querySelectorAll('.nav-cat-btn:not(.has-mega)').forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = btn.dataset.slug;
      window.location.href = slug ? `/catalog.html?game=${slug}` : '/catalog.html';
    });
  });

  // Mega menu groups
  el.querySelectorAll('.mega-group').forEach(group => {
    const btn      = group.querySelector('.nav-cat-btn.has-mega');
    const dropdown = group.querySelector('.mega-dropdown');
    let closeTimer;

    const open = () => {
      clearTimeout(closeTimer);
      el.querySelectorAll('.mega-dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });
      el.querySelectorAll('.nav-cat-btn.has-mega[aria-expanded="true"]').forEach(b => {
        if (b !== btn) b.setAttribute('aria-expanded','false');
      });
      dropdown.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      closeTimer = setTimeout(() => {
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }, 150);
    };

    if (supportsHover) {
      group.addEventListener('mouseenter', open);
      group.addEventListener('mouseleave', close);
      dropdown.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      dropdown.addEventListener('mouseleave', close);
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const isOpen = dropdown.classList.contains('open');
      
      // If it's a mobile touch or already open, navigate
      if (isOpen && btn.getAttribute('aria-expanded') === 'true') {
        const slug = btn.dataset.slug;
        window.location.href = `/catalog.html?game=${slug}`;
        return;
      }

      open();
    });

    dropdown.addEventListener('click', e => e.stopPropagation());
  });

  // Close mega on outside click
  if (!globalsBound) {
    document.addEventListener('click', () => {
      const navEl = document.getElementById('navbar');
      if (!navEl) return;
      navEl.querySelectorAll('.mega-dropdown.open').forEach(d => {
        d.classList.remove('open');
        const parentBtn = d.closest('.mega-group')?.querySelector('.nav-cat-btn');
        if (parentBtn) parentBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  bindNotifDropdown();

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

  el.querySelectorAll('#logout-btn, #logout-btn-mobile').forEach(btn => {
    btn.addEventListener('click', async () => {
      await logout();
      clearAuth();
      window.location.href = 'login.html?logout=true';
    });
  });

  // Handle outside click for user and notif dropdowns
  if (!globalsBound) {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-btn-wrap')) {
        document.getElementById('user-dropdown')?.classList.remove('open');
        document.getElementById('user-dropdown-mobile')?.classList.remove('open');
        document.getElementById('user-btn')?.setAttribute('aria-expanded', 'false');
        document.getElementById('user-btn-mobile')?.setAttribute('aria-expanded', 'false');
      }
      if (!e.target.closest('.notif-wrap')) {
        const drop = document.getElementById('notif-dropdown');
        if (drop) {
          drop.style.display = 'none';
          drop.setAttribute('aria-hidden', 'true');
        }
      }
    });
    globalsBound = true;
  }

  // User dropdown toggle
  el.querySelectorAll('#user-btn, #user-btn-mobile').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.id === 'user-btn' ? 'user-dropdown' : 'user-dropdown-mobile';
      const dropdown = document.getElementById(targetId);
      const isOpen = dropdown.classList.contains('open');
      
      // Close others
      document.querySelectorAll('.user-dropdown.open').forEach(d => d.classList.remove('open'));
      
      if (!isOpen) {
        dropdown.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

async function bindNotifDropdown() {
  const btn = document.getElementById('notif-btn');
  const dropdown = document.getElementById('notif-dropdown');
  const badge = document.getElementById('notif-badge');
  const list = document.getElementById('notif-dropdown-list');
  const markAll = document.getElementById('notif-mark-all');

  if (!btn || !dropdown) return;

  const updateBadge = async () => {
    if (!isLoggedIn()) return;
    try {
      const count = await getNotificationCount();
      if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    } catch {}
  };

  const loadNotifs = async () => {
    if (!isLoggedIn()) {
      list.innerHTML = '<div class="notif-empty">Please sign in to view notifications</div>';
      return;
    }
    try {
      const notifs = await getNotifications(0, 5); // top 5
      if (!notifs || notifs.length === 0) {
        list.innerHTML = '<div class="notif-empty">No new notifications</div>';
        return;
      }
      list.innerHTML = notifs.map(n => `
        <div class="notif-item ${!n.isRead ? 'notif-item--unread' : ''}" data-id="${n.id}">
          <div class="notif-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${formatTime(n.createdAt)}</div>
          </div>
        </div>
      `).join('');

      // Bind individual clicks
      list.querySelectorAll('.notif-item').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = item.dataset.id;
          await markNotificationRead(id);
          item.classList.remove('notif-item--unread');
          updateBadge();
        });
      });
    } catch {
      list.innerHTML = '<div class="notif-empty">Failed to load</div>';
    }
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = dropdown.getAttribute('aria-hidden') === 'true';
    if (isHidden) {
      dropdown.style.display = 'block';
      dropdown.setAttribute('aria-hidden', 'false');
      loadNotifs();
    } else {
      dropdown.style.display = 'none';
      dropdown.setAttribute('aria-hidden', 'true');
    }
  });

  markAll?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await markAllNotificationsRead();
    list.querySelectorAll('.notif-item--unread').forEach(item => item.classList.remove('notif-item--unread'));
    updateBadge();
  });

  // Initial
  if (isLoggedIn()) {
    updateBadge();
    setInterval(updateBadge, 60000); // every min
  }
}

function formatTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return date.toLocaleDateString();
}

/**
 * Initializes the global navbar and bottom nav.
 * Call this once on each page.
 */
export function initNavbar() {
  const el = document.getElementById('navbar');
  if (!el) return;

  const getIsMobile = () => window.innerWidth < 768;
  let currentIsMobile = getIsMobile();
  const path = window.location.pathname;
  
  let activeCatId = null;
  let activeCatSlug = null;
  if (path.includes('catalog')) {
    const params = new URLSearchParams(window.location.search);
    activeCatId   = params.get('categoryId');
    activeCatSlug = params.get('category');
  }

  injectDropdownStyles();

  // PASS 1: Synchronous Optimistic Render — always start with static games
  let categories = STATIC_GAMES;
  try {
    const cached = localStorage.getItem('hv_categories');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) categories = parsed;
    }
  } catch(e) {}

  const renderMobile = () => {
    renderMobileNavbar(el);
    renderBottomNav();
  };
  const renderDesktop = () => {
    renderDesktopNavbar(el, categories, activeCatId || activeCatSlug);
  };

  if (currentIsMobile) {
    renderMobile();
  } else {
    renderDesktop();
  }
  bindDesktopEvents(el);

  // Resize listener to re-render on responsive break
  const handleResize = () => {
    const newIsMobile = getIsMobile();
    if (newIsMobile !== currentIsMobile) {
      currentIsMobile = newIsMobile;
      if (currentIsMobile) {
        renderMobile();
      } else {
        renderDesktop();
      }
    }
  };
  window.addEventListener('resize', handleResize);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('resize', handleResize);
  });

  // PASS 2: Asynchronous Background Update
  Promise.all([
    initAuth().catch(err => { console.warn('Auth init failed:', err); return null; }),
    getCategories().catch(() => [])
  ]).then(([authRes, newCats]) => {
    if (newCats && newCats.length > 0) {
      localStorage.setItem('hv_categories', JSON.stringify(newCats));
      categories = newCats;
    }
    
    // Re-render to reflect new categories and exact user auth state
    if (currentIsMobile) {
      renderMobileNavbar(el);
    } else {
      renderDesktopNavbar(el, categories, activeCatId || activeCatSlug);
    }
    bindDesktopEvents(el);

    if (isLoggedIn()) {
      NotificationBroker.init();
      SocialProof.init();
      window.addEventListener('refresh-notifications', async () => {
        const drop = document.getElementById('notif-dropdown');
        const isOpen = drop && drop.getAttribute('aria-hidden') === 'false';
        if (isOpen) {
          const list = document.getElementById('notif-dropdown-list');
          if (list) list.innerHTML = '<div class="notif-empty">Loading…</div>';
          try {
            const notifs = await getNotifications(0, 5);
            if (list && notifs && notifs.length > 0) {
              list.innerHTML = notifs.map(n => `
                <div class="notif-item ${!n.isRead ? 'notif-item--unread' : ''}" data-id="${n.id}">
                  <div class="notif-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>
                  <div class="notif-content">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-msg">${n.message}</div>
                    <div class="notif-time">${formatTime(n.createdAt)}</div>
                  </div>
                </div>
              `).join('');
            } else if (list) {
              list.innerHTML = '<div class="notif-empty">No new notifications</div>';
            }
          } catch {
            if (list) list.innerHTML = '<div class="notif-empty">Failed to load</div>';
          }
        }
        const badge = document.getElementById('notif-badge');
        try {
          const count = await getNotificationCount();
          if (badge) {
            if (count > 0) {
              badge.textContent = count > 9 ? '9+' : count;
              badge.style.display = 'flex';
            } else {
              badge.style.display = 'none';
            }
          }
        } catch {}
      });
    }
  }).catch(err => {
    console.warn('Navbar background refresh failed:', err);
  });
}
