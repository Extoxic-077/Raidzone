import { showToast } from './toast.js';
import { initAuth, isLoggedIn, getUser, isAdmin, clearAuth } from '../auth.js';
import { logout, getCartCount, getCategories, getNotificationCount, getNotifications, markAllNotificationsRead, markNotificationRead } from '../api.js';

// ── Mega-menu builder ─────────────────────────────────────────────────────────

function buildMegaMenuHTML(categories) {
  // categories is tree: root items with .children arrays
  return categories.map(cat => {
    const hasChildren = cat.children && cat.children.length > 0;
    if (!hasChildren) {
      return `<button class="nav-cat-btn" data-id="${cat.id}" data-slug="${cat.slug}">${cat.name}</button>`;
    }
    const childLinks = cat.children.map(sub =>
      `<a class="mega-sub-link" href="catalog.html?categoryId=${sub.id}" data-id="${sub.id}">${sub.name}</a>`
    ).join('');
    return `
      <div class="mega-group" data-group-id="${cat.id}">
        <button class="nav-cat-btn has-mega" data-id="${cat.id}" data-slug="${cat.slug}" aria-haspopup="true" aria-expanded="false">
          ${cat.name}
          <svg class="mega-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="mega-dropdown">
          <div class="mega-dropdown-inner">
            <a class="mega-sub-link mega-sub-all" href="catalog.html?categoryId=${cat.id}" data-id="${cat.id}">
              <span style="font-weight:700">All ${cat.name}</span>
            </a>
            ${childLinks}
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
        Raidzone
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
  const initial = isLoggedIn() ? (user?.name || 'U')[0].toUpperCase() : null;

  el.innerHTML = `
    <nav class="navbar-inner navbar-mobile-top">
      <a href="index.html" class="navbar-logo">
        ${hexagonSVG()}
        Raidzone
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
              <a href="orders.html"   class="dropdown-item">My Orders</a>
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
      setTimeout(() => { window.location.href = 'login.html'; }, 600);
      return;
    }
    window.location.href = 'cart.html';
  });
}

// ── Inject shared styles ──────────────────────────────────────────────────────

function injectDropdownStyles() {
  if (document.getElementById('dropdown-styles')) return;
  const style = document.createElement('style');
  style.id = 'dropdown-styles';
  style.textContent = `
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
    .mega-dropdown-inner { display: flex; flex-direction: column; gap: 4px; }
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
  `;
  document.head.appendChild(style);
}

// ── Bind desktop events ───────────────────────────────────────────────────────

function bindDesktopEvents(el) {
  const onScroll = () => el.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Plain category buttons (no children)
  el.querySelectorAll('.nav-cat-btn:not(.has-mega)').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      window.location.href = id ? `catalog.html?categoryId=${id}` : 'catalog.html';
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

    group.addEventListener('mouseenter', open);
    group.addEventListener('mouseleave', close);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        // If it's already open (likely from hover), we keep it open or toggle it
        // based on whether it was a "fresh" click or a hover-click.
        // User wants TOGGLE, so we force close.
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        open();
      }
    });
  });

  // Close mega on outside click
  document.addEventListener('click', () => {
    el.querySelectorAll('.mega-dropdown.open').forEach(d => {
      d.classList.remove('open');
      const parentBtn = d.closest('.mega-group')?.querySelector('.nav-cat-btn');
      if (parentBtn) parentBtn.setAttribute('aria-expanded', 'false');
    });
  });

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

// ── Notification helpers ──────────────────────────────────────────────────────

const NOTIF_ICONS = {
  LOGIN_NEW_DEVICE: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  ORDER_CONFIRMED:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  ORDER_DELIVERED:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  PAYMENT_SUCCESS:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  PAYMENT_FAILED:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  WELCOME:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

function timeAgoNotif(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)    return 'Just now';
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

function renderNotifList(notifications) {
  const el = document.getElementById('notif-dropdown-list');
  if (!el) return;
  if (!notifications.length) {
    el.innerHTML = '<div class="notif-empty">No notifications yet</div>';
    return;
  }
  el.innerHTML = notifications.slice(0, 5).map(n => `
    <div class="notif-item ${n.isRead ? '' : 'notif-item--unread'}" data-id="${n.id}"
         onclick="window.__notifMarkRead && window.__notifMarkRead('${n.id}', this)">
      <span class="notif-icon">${NOTIF_ICONS[n.type] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`}</span>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${timeAgoNotif(n.createdAt)}</div>
      </div>
    </div>`).join('');
}

function updateNotifBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

function bindNotifDropdown() {
  if (!isLoggedIn()) return;
  const btn      = document.getElementById('notif-btn');
  const dropdown = document.getElementById('notif-dropdown');
  if (!btn || !dropdown) return;

  let open = false;
  let notifications = [];

  async function loadAndShow() {
    dropdown.style.display = '';
    dropdown.setAttribute('aria-hidden', 'false');
    open = true;
    try {
      notifications = await getNotifications();
      renderNotifList(notifications);
    } catch { /* silent */ }
  }

  function close() {
    dropdown.style.display = 'none';
    dropdown.setAttribute('aria-hidden', 'true');
    open = false;
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    open ? close() : loadAndShow();
  });

  document.addEventListener('click', () => { if (open) close(); });
  dropdown.addEventListener('click', e => e.stopPropagation());

  document.getElementById('notif-mark-all')?.addEventListener('click', async () => {
    try {
      await markAllNotificationsRead();
      updateNotifBadge(0);
      notifications = notifications.map(n => ({ ...n, isRead: true }));
      renderNotifList(notifications);
    } catch { /* silent */ }
  });

  window.__notifMarkRead = async (id, el) => {
    try {
      await markNotificationRead(id);
      el.classList.remove('notif-item--unread');
      notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
      const unread = notifications.filter(n => !n.isRead).length;
      updateNotifBadge(unread);
    } catch { /* silent */ }
  };
}

async function loadNotifCount() {
  if (!isLoggedIn()) return;
  try {
    const data = await getNotificationCount();
    updateNotifBadge(data?.count ?? 0);
  } catch { /* silent */ }
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

// ── Browser push notifications ────────────────────────────────────────────────

function initBrowserNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    // Ask on first login — slight delay so it doesn't feel intrusive
    setTimeout(() => {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') localStorage.setItem('notifPermission', 'granted');
      });
    }, 3000);
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch { /* ignore if AudioContext blocked */ }
}

function showBrowserNotification(title, body, url) {
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, icon: '/favicon.ico', tag: title });
    n.onclick = () => { window.focus(); if (url) window.location.href = url; n.close(); };
    playBeep();
  } catch { /* ignore */ }
}

let lastNotifCount = -1;

async function startNotificationPolling() {
  const poll = async () => {
    try {
      const data = await getNotificationCount();
      const count = data?.count ?? data ?? 0;
      if (lastNotifCount >= 0 && count > lastNotifCount) {
        // Fetch new notifications to get their titles
        const notifs = await getNotifications();
        const newOnes = Array.isArray(notifs) ? notifs.filter(n => !n.read) : [];
        for (const n of newOnes.slice(0, count - lastNotifCount)) {
          showBrowserNotification(n.title || 'New notification', n.message || '', 'notifications.html');
        }
      }
      lastNotifCount = count;
    } catch { /* silent — don't break UI */ }
  };
  await poll();
  setInterval(poll, 30000);
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
  loadNotifCount();
  setInterval(loadNotifCount, 60000);

  // Browser push notifications + 30s polling for new notifications
  if (isLoggedIn()) {
    initBrowserNotifications();
    startNotificationPolling();
  }

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
