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

function userButtonHTML() {
  if (isLoggedIn()) {
    const user = getUser();
    const initial = (user?.name || 'U')[0].toUpperCase();
    const name = user?.name?.split(' ')[0] || 'Account';
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

export async function initNavbar() {
  await initAuth();
  const el = document.getElementById('navbar');
  if (!el) return;

  const params    = new URLSearchParams(window.location.search);
  const activeCatId = params.get('categoryId') || '';

  // Fetch categories from the API so slugs/IDs are always in sync with the backend
  let categories = [];
  try {
    categories = await getCategories();
  } catch { /* render without categories if API fails */ }

  el.innerHTML = `
    <nav class="navbar-inner">
      <a href="index.html" class="navbar-logo">
        ${hexagonSVG()}
        NexVault
      </a>

      <div class="navbar-cats">
        <button class="nav-cat-btn${!activeCatId ? ' active' : ''}" data-id="">
          All
        </button>
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

  // Scroll handler
  const onScroll = () => el.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Category nav — use categoryId (UUID) so catalog.js filters correctly
  el.querySelectorAll('.nav-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      window.location.href = id ? `catalog.html?categoryId=${id}` : 'catalog.html';
    });
  });

  // Notification button
  document.getElementById('notif-btn')?.addEventListener('click', () => {
    showToast('No new notifications', 'info');
  });

  // Wishlist button
  document.getElementById('wishlist-btn')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 800);
      return;
    }
    window.location.href = 'wishlist.html';
  });

  // Cart button
  document.getElementById('cart-btn')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 800);
      return;
    }
    window.location.href = 'cart.html';
  });

  // Load live cart count if logged in
  if (isLoggedIn()) {
    getCartCount()
      .then(data => {
        const count = data?.count ?? 0;
        const badges = document.querySelectorAll('#cart-badge, #cart-badge-mobile');
        badges.forEach(b => { if (b) b.textContent = count; });
      })
      .catch(() => {});
  }

  // User dropdown toggle
  if (isLoggedIn()) {
    const userBtn      = document.getElementById('user-btn');
    const userDropdown = document.getElementById('user-dropdown');

    if (userBtn && userDropdown) {
      // Inject dropdown styles (once)
      if (!document.getElementById('dropdown-styles')) {
        const style = document.createElement('style');
        style.id = 'dropdown-styles';
        style.textContent = `
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
          .user-dropdown.open {
            opacity: 1; pointer-events: all; transform: translateY(0);
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
            transition: background var(--ease-fast), color var(--ease-fast);
            text-align: left;
          }
          .dropdown-item:hover { background: var(--glass); color: var(--text-1); }
          .dropdown-item.disabled { opacity: 0.4; cursor: not-allowed; }
          .dropdown-item.disabled:hover { background: none; }
          .dropdown-item-danger { color: var(--danger); }
          .dropdown-item-danger:hover { background: rgba(239,68,68,0.1); color: var(--danger); }
          .dropdown-item-admin { color: var(--cyan); }
        `;
        document.head.appendChild(style);
      }

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

      // Logout
      document.getElementById('logout-btn')?.addEventListener('click', async () => {
        try {
          await logout();
        } catch { /* ignore */ }
        clearAuth();
        showToast('Logged out successfully', 'info');
        setTimeout(() => { window.location.href = 'index.html'; }, 600);
      });
    }
  }
}
