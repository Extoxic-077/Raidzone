import { showToast } from './toast.js';

const CATEGORIES = [
  { label: 'All',         slug: '' },
  { label: 'Games',       slug: 'games' },
  { label: 'Gift Cards',  slug: 'gift-cards' },
  { label: 'Top-Up',      slug: 'top-up' },
  { label: 'Streaming',   slug: 'streaming' },
  { label: 'Software',    slug: 'software' },
];

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

export function initNavbar() {
  const el = document.getElementById('navbar');
  if (!el) return;

  const currentPage = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const activeCat = params.get('category') || '';

  el.innerHTML = `
    <nav class="navbar-inner">
      <a href="/" class="navbar-logo">
        ${hexagonSVG()}
        NexVault
      </a>

      <div class="navbar-cats">
        ${CATEGORIES.map(c => `
          <button class="nav-cat-btn${activeCat === c.slug ? ' active' : ''}" data-slug="${c.slug}">
            ${c.label}
          </button>
        `).join('')}
      </div>

      <div class="navbar-search">
        <span class="search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input type="search" id="navbar-search-input" placeholder="Search products..." autocomplete="off"/>
        <span class="search-shortcut">⌘K</span>
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

        <button class="user-btn" id="user-btn" aria-label="Profile">
          <div class="user-avatar">G</div>
          <span class="user-name">Guest</span>
        </button>
      </div>
    </nav>
  `;

  // Scroll handler
  const onScroll = () => {
    el.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Category nav
  el.querySelectorAll('.nav-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slug = btn.dataset.slug;
      if (slug === '') {
        window.location.href = 'catalog.html';
      } else {
        window.location.href = `catalog.html?category=${slug}`;
      }
    });
  });

  // Search keyboard shortcut
  const searchInput = document.getElementById('navbar-search-input');
  if (searchInput) {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q) window.location.href = `catalog.html?search=${encodeURIComponent(q)}`;
      }
      if (e.key === 'Escape') searchInput.blur();
    });
  }

  // Notification button
  document.getElementById('notif-btn')?.addEventListener('click', () => {
    showToast('No new notifications', 'info');
  });

  // Wishlist button
  document.getElementById('wishlist-btn')?.addEventListener('click', () => {
    showToast('Wishlist coming in Phase 3', 'info');
  });

  // Cart button
  document.getElementById('cart-btn')?.addEventListener('click', () => {
    showToast('Cart coming in Phase 3', 'info');
  });

  // User button
  document.getElementById('user-btn')?.addEventListener('click', () => {
    showToast('Login coming in Phase 3', 'info');
  });
}
