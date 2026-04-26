import { showToast } from './toast.js';
import { initAuth, isLoggedIn, getUser, isAdmin, clearAuth, isLikelyLoggedIn } from '../auth.js';
import { logout, getCartCount, getCategories, getNotificationCount, getNotifications, markAllNotificationsRead, markNotificationRead } from '../api.js';
import { NotificationBroker } from './NotificationBroker.js';
import { SocialProof } from './SocialProof.js';

const GAME_EMOJIS = {
  'arc-raiders': '🤖',
  'cs2': '🎯',
  'delta-force': '⚔️',
  'windrose': '🏵️',
  'games': '🎮'
};

function initParticles(container) {
  if (!container) return;
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position: absolute;
      width: 2px;
      height: 2px;
      background: var(--neon-blue);
      border-radius: 50%;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      opacity: ${0.1 + Math.random() * 0.4};
      box-shadow: 0 0 10px var(--neon-blue);
      animation: nav-particle-move ${3 + Math.random() * 5}s infinite linear;
    `;
    container.appendChild(p);
  }
}

const PARTICLE_STYLE = `
@keyframes nav-particle-move {
  0%   { transform: translate(0,0); opacity: 0; }
  20%  { opacity: 0.5; }
  80%  { opacity: 0.5; }
  100% { transform: translate(${Math.random() * 50 - 25}px, ${Math.random() * 20 - 10}px); opacity: 0; }
}
`;
if (!document.getElementById('nav-particle-styles')) {
  const s = document.createElement('style');
  s.id = 'nav-particle-styles';
  s.textContent = PARTICLE_STYLE;
  document.head.appendChild(s);
}

// ── Mega-menu builder ─────────────────────────────────────────────────────────

function buildMegaMenuHTML(categories) {
  // categories is recursive tree
  return categories.map(cat => {
    const hasChildren = cat.children && cat.children.length > 0;
    if (!hasChildren) {
      return `<button class="nav-cat-btn" data-id="${cat.id}" data-slug="${cat.slug}">${cat.name}</button>`;
    }

    // Level 2 Grouping
    const groupsHTML = cat.children.map(sub => {
      const hasGrandchildren = sub.children && sub.children.length > 0;
      
      if (!hasGrandchildren) {
        return `<a class="mega-sub-link" href="/catalog.html?category=${sub.slug}" data-id="${sub.id}" data-slug="${sub.slug}">${sub.name}</a>`;
      }

      // If it has grandchildren, render as a specialized group
      const grandchildLinks = sub.children.map(g =>
        `<a class="mega-sub-link nested" href="/catalog.html?category=${g.slug}" data-id="${g.id}" data-slug="${g.slug}">${g.name}</a>`
      ).join('');

      return `
        <div class="mega-nested-group">
          <a class="mega-nested-title" href="/catalog.html?category=${sub.slug}">${sub.name}</a>
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
            <a class="mega-sub-link mega-sub-all" href="/catalog.html?category=${cat.slug}" data-id="${cat.id}" data-slug="${cat.slug}">
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
      <a href="/login.html" class="btn btn-primary" style="text-decoration:none;padding:8px 18px;font-size:14px;font-weight:700;border-radius:var(--r-md);text-transform:uppercase">
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
      <a href="/orders.html"   class="dropdown-item">My Orders</a>
      <a href="/profile.html" class="dropdown-item">Profile</a>
      <a href="/wishlist.html" class="dropdown-item">Wishlist</a>
      ${isAdmin() ? `<a href="admin/index.html" class="dropdown-item dropdown-item-admin">Admin Panel</a>` : ''}
      <div class="dropdown-divider"></div>
      <button class="dropdown-item dropdown-item-danger" id="logout-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        LOGOUT
      </button>
    </div>
  `;
}

// ── Desktop navbar ────────────────────────────────────────────────────────────

function renderDesktopNavbar(el, categories, activeCatId) {
  const user = getUser();
  const logged = isLoggedIn();
  const initial = (user?.name || 'U')[0].toUpperCase();

  el.innerHTML = `
    <header class="rz-header" id="header-main">
      <div class="glow-edge-bottom"></div>
      <div class="particles-container" id="nav-particles"></div>

      <div class="navbar-left">
        <a href="/index.html" class="rz-logo">
          ${hexagonSVG()}
          <span class="logo-text">RAIDZONE</span>
        </a>
      </div>

      <div class="navbar-center" id="navbar-center-tabs">
        <!-- Pill nav injected by renderGameTabs -->
      </div>

      <div class="navbar-right">
        <div class="notif-wrap">
          <button class="glass-btn" id="notif-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="cart-count-badge notif-badge" id="notif-badge" style="display:none">0</span>
          </button>
          <div class="notif-dropdown" id="notif-dropdown" role="menu" aria-hidden="true" style="display:none">
            <div class="notif-dropdown-header">
              <span class="notif-dropdown-title">Notifications</span>
              <button class="notif-mark-all" id="notif-mark-all">Mark all read</button>
            </div>
            <div class="notif-dropdown-list" id="notif-dropdown-list">
               <!-- injected by js -->
            </div>
            <a href="/profile.html?tab=notifications" class="notif-view-all">View All</a>
          </div>
        </div>

        <button class="glass-btn" id="wishlist-btn" aria-label="Wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <button class="glass-btn" id="cart-btn" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span class="cart-count-badge" id="cart-badge">0</span>
        </button>

        <div class="user-btn-wrap">
          ${logged ? `
            <button class="user-btn glass-btn" id="user-btn" style="width:auto; padding: 0 12px; border-radius: var(--r-full); gap:8px;">
              <div class="user-avatar" style="background:var(--gradient-cyber);width:24px;height:24px;font-size:11px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${initial}</div>
              <span style="font-weight:700;font-size:13px;">${user?.name?.split(' ')[0] || 'User'}</span>
            </button>
          ` : `
            <a href="/login.html" class="pill-tab active" style="padding: 8px 16px; border-radius: var(--r-full); text-decoration:none;">SIGN IN</a>
          `}
          <div class="user-dropdown" id="user-dropdown" role="menu" aria-hidden="true">
            <div class="dropdown-header">
              <div class="dropdown-name">${user?.name || 'User'}</div>
              <div class="dropdown-email">${user?.email || ''}</div>
            </div>
            <div class="dropdown-divider"></div>
            <a href="/orders.html"   class="dropdown-item">My Orders</a>
            <a href="/profile.html" class="dropdown-item">Profile</a>
            <a href="/wishlist.html" class="dropdown-item">Wishlist</a>
            ${isAdmin() ? `<a href="admin/index.html" class="dropdown-item dropdown-item-admin">Admin Panel</a>` : ''}
            <div class="dropdown-divider"></div>
            <button class="dropdown-item dropdown-item-danger" id="logout-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </header>
  `;

  // Init particles
  initParticles(document.getElementById('nav-particles'));
  // Render tabs into center
  renderGameTabs(categories);
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
          <a href="/orders.html"   class="dropdown-item">My Orders</a>
          <a href="/profile.html" class="dropdown-item">Profile</a>
          <a href="/wishlist.html" class="dropdown-item">Wishlist</a>
          ${isAdmin() ? `<a href="admin/index.html" class="dropdown-item dropdown-item-admin">Admin Panel</a>` : ''}
          <div class="dropdown-divider"></div>
          <button class="dropdown-item dropdown-item-danger" id="logout-btn-mobile">SIGN OUT</button>
        </div>
      </div>
    `;
  } else if (likely) {
    actionsContent = `
      <div class="user-btn-skeleton" style="width:36px;height:36px;background:rgba(255,255,255,0.05);border-radius:50%;animation:pulse 2s infinite"></div>
    `;
  } else {
    actionsContent = `
      <a href="/login.html" class="btn btn-primary" style="text-decoration:none;padding:7px 16px;font-size:13px;font-weight:600;border-radius:var(--r-md)">
        SIGN IN
      </a>
    `;
  }

  el.innerHTML = `
    <nav class="navbar-inner navbar-mobile-top">
      <a href="/index.html" class="navbar-logo">
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
    <a href="/index.html"   class="bottom-nav-item ${page === 'home'    ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>Home</span>
    </a>
    <a href="/catalog.html" class="bottom-nav-item ${page === 'catalog'  ? 'active' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
      <span>Catalog</span>
    </a>
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

  document.getElementById('bottom-nav-cart')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = '/login.html'; }, 600);
      return;
    }
    window.location.href = '/cart.html';
  });
}

// ── Inject shared styles ──────────────────────────────────────────────────────

function injectDropdownStyles() {
  if (document.getElementById('dropdown-styles')) return;
  const style = document.createElement('style');
  style.id = 'dropdown-styles';
  style.textContent = `
    #navbar, .navbar-inner, .navbar-cats, .navbar-left, .navbar-center, .navbar-right, .user-btn-wrap, .notif-wrap { 
      overflow: visible !important; 
    }

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
    
    .user-dropdown, .notif-dropdown {
      position: absolute; 
      top: calc(100% + 12px); 
      right: 0; 
      min-width: 220px;
      background: rgba(10, 10, 20, 0.98); 
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--r-lg); 
      padding: 8px; 
      z-index: 2000;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(34, 211, 238, 0.1);
      opacity: 0; 
      pointer-events: none; 
      transform: translateY(-12px);
      transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
      visibility: hidden;
    }
    
    .user-dropdown.open, .notif-dropdown.open { 
      opacity: 1; 
      pointer-events: all; 
      transform: translateY(0); 
      visibility: visible;
    }
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
    .bottom-nav-item svg { display: block; stroke: currentColor; transition: stroke 0.15s ease; }

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
      right: -10px;
      width: 360px;
      padding: 0;
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
    .notif-dropdown.open {
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
      window.location.href = slug ? `/catalog.html?category=${slug}` : '/catalog.html';
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
        window.location.href = `/catalog.html?category=${slug}`;
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
      setTimeout(() => { window.location.href = '/login.html'; }, 800);
      return;
    }
    window.location.href = '/wishlist.html';
  });

  document.getElementById('cart-btn')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = '/login.html'; }, 800);
      return;
    }
    window.location.href = '/cart.html';
  });

  el.querySelectorAll('#logout-btn, #logout-btn-mobile').forEach(btn => {
    btn.addEventListener('click', async () => {
      await logout();
      clearAuth();
      window.location.href = '/login.html?logout=true';
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

  // Unified Dropdown Toggles (User & Notifs)
  el.querySelectorAll('#user-btn, #user-btn-mobile, #notif-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      let targetId = '';
      if (btn.id === 'user-btn') targetId = 'user-dropdown';
      else if (btn.id === 'user-btn-mobile') targetId = 'user-dropdown-mobile';
      else if (btn.id === 'notif-btn') targetId = 'notif-dropdown';

      const dropdown = document.getElementById(targetId);
      if (!dropdown) return;

      const isOpen = dropdown.classList.contains('open');
      
      // Close all other dropdowns
      document.querySelectorAll('.user-dropdown.open, .notif-dropdown.open').forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('open');
          d.setAttribute('aria-hidden', 'true');
        }
      });
      
      if (!isOpen) {
        dropdown.classList.add('open');
        dropdown.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        if (btn.id === 'notif-btn') loadNotifs();
      } else {
        dropdown.classList.remove('open');
        dropdown.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

async function updateBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (!isLoggedIn()) {
    badge.style.display = 'none';
    return;
  }
  try {
    const count = await getNotificationCount();
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch {}
}

async function loadNotifs() {
  const list = document.getElementById('notif-dropdown-list');
  if (!list) return;
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
}

async function bindNotifDropdown() {
  const list = document.getElementById('notif-dropdown-list');
  const markAll = document.getElementById('notif-mark-all');

  markAll?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await markAllNotificationsRead();
    list?.querySelectorAll('.notif-item--unread').forEach(item => item.classList.remove('notif-item--unread'));
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

  const isMobile = window.innerWidth < 768;
  const path = window.location.pathname;
  
  let activeCatId = null;
  let activeCatSlug = null;
  if (path.includes('catalog')) {
    const params = new URLSearchParams(window.location.search);
    activeCatId   = params.get('categoryId');
    activeCatSlug = params.get('category');
  }

  injectDropdownStyles();

  // PASS 1: Synchronous Optimistic Render
  let categories = [];
  try {
    const cached = localStorage.getItem('hv_categories');
    if (cached) categories = JSON.parse(cached);
  } catch(e) {}

  if (isMobile) {
    renderMobileNavbar(el);
    renderBottomNav();
  } else {
    renderDesktopNavbar(el, categories, activeCatId || activeCatSlug);
  }
  bindDesktopEvents(el);

  // PASS 2: Asynchronous Background Update
  Promise.all([
    initAuth(),
    getCategories().catch(() => [])
  ]).then(([authRes, newCats]) => {
    if (newCats && newCats.length > 0) {
      localStorage.setItem('hv_categories', JSON.stringify(newCats));
      categories = newCats;
      window.currentCategories = newCats;
    }
    
    // Re-render to reflect new categories and exact user auth state
    if (isMobile) {
      renderMobileNavbar(el);
      // bottom nav doesn't need re-rendering
    } else {
      renderDesktopNavbar(el, categories, activeCatId || activeCatSlug);
    }
    bindDesktopEvents(el);

    if (isLoggedIn()) {
      NotificationBroker.init();
      SocialProof.init();
      window.addEventListener('refresh-notifications', () => {
        const drop = document.getElementById('notif-dropdown');
        if (drop && drop.classList.contains('open')) {
             loadNotifs();
        }
        updateBadge();
      });
    }
  }).catch(err => {
    console.warn('Navbar background refresh failed:', err);
  });
}

import { getCurrentFilters } from '../router.js';

function renderGameTabs(categories) {
  const container = document.getElementById('navbar-center-tabs');
  if (!container) return;

  const gamesCat = categories.find(c => c && (c.slug === 'games' || (c.name && c.name.toLowerCase() === 'games')));
  const games = gamesCat ? (gamesCat.children || []) : categories.filter(c => c && !c.parentId && c.slug !== 'games');

  const filters = getCurrentFilters();
  const currentSlug = filters.categorySlug || new URLSearchParams(window.location.search).get('category');

  container.innerHTML = `
    <div class="pill-nav">
      <a href="/catalog.html" class="pill-tab ${!currentSlug ? 'active' : ''}">
        🌐 All
      </a>
      ${games.map(game => {
        const emoji = GAME_EMOJIS[game.slug] || '🎮';
        const isActive = currentSlug === game.slug || (currentSlug && currentSlug.startsWith(game.slug));
        return `
          <a href="/catalog.html?category=${game.slug}" class="pill-tab ${isActive ? 'active' : ''}" data-slug="${game.slug}">
            ${emoji} ${game.name}
          </a>
        `;
      }).join('')}
    </div>
  `;

  // Sub-tabs are now managed by catalog.v5.js (CATEGORY_CONFIG system)
  // Do NOT inject sub-tabs-container here — it conflicts with the dynamic hierarchy
}

function renderSubTabs(subs) {
  const bar = document.getElementById('sub-tabs-bar');
  if (!bar) return;
  bar.style.display = 'flex';
  
  const currentSlug = new URLSearchParams(window.location.search).get('category');

  bar.innerHTML = subs.map(sub => {
    const isActive = currentSlug === sub.slug;
    return `
      <a href="/catalog.html?category=${sub.slug}" class="game-tab sub-tab ${isActive ? 'active' : ''}" style="font-size:11px; padding:4px 12px; border-radius:8px;">
        ${sub.name}
      </a>
    `;
  }).join('');
}

window.addEventListener('popstate', () => {
  if (document.getElementById('game-tabs-bar') && window.currentCategories) {
    renderGameTabs(window.currentCategories);
  }
});

// Set a global variable for categories to allow re-rendering from anywhere
window.renderGameTabs = renderGameTabs;
