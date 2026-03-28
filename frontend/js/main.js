import { initNavbar } from './components/navbar.js';
import { initFooter } from './components/footer.js';
import { showToast }  from './components/toast.js';
import { isLoggedIn } from './auth.js';

function initBottomNav() {
  const el = document.getElementById('bottom-nav');
  if (!el) return;

  const currentPage = window.location.pathname;
  let activePage = 'home';
  if (currentPage.endsWith('catalog.html'))  activePage = 'catalog';
  else if (currentPage.endsWith('product.html')) activePage = 'product';
  else if (currentPage.endsWith('profile.html')) activePage = 'profile';

  el.innerHTML = `
    <div class="bottom-nav-items">
      <button class="bn-item${activePage === 'home' ? ' active' : ''}" data-page="home" aria-label="Home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
        <span>Home</span>
      </button>

      <button class="bn-item${activePage === 'catalog' ? ' active' : ''}" data-page="catalog" aria-label="Search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <span>Search</span>
      </button>

      <button class="bn-item" data-page="cart" aria-label="Cart" style="position:relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span class="icon-badge" id="cart-badge-mobile" style="position:absolute;top:0;right:10px;">0</span>
        <span>Cart</span>
      </button>

      <button class="bn-item" data-page="wishlist" aria-label="Wishlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>Wishlist</span>
      </button>

      <button class="bn-item${activePage === 'profile' ? ' active' : ''}" data-page="profile" aria-label="Profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Profile</span>
      </button>
    </div>
  `;

  el.querySelectorAll('.bn-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      item.classList.add('nav-animate');
      item.addEventListener('animationend', () => item.classList.remove('nav-animate'), { once: true });

      switch (page) {
        case 'home':
          window.location.href = 'index.html';
          break;
        case 'catalog':
          window.location.href = 'catalog.html';
          break;
        case 'cart':
          if (!isLoggedIn()) {
            showToast('Please sign in first', 'info');
            setTimeout(() => { window.location.href = 'login.html'; }, 800);
          } else {
            window.location.href = 'cart.html';
          }
          break;
        case 'wishlist':
          if (!isLoggedIn()) {
            showToast('Please sign in first', 'info');
            setTimeout(() => { window.location.href = 'login.html'; }, 800);
          } else {
            window.location.href = 'wishlist.html';
          }
          break;
        case 'profile':
          window.location.href = isLoggedIn() ? 'profile.html' : 'login.html';
          break;
      }
    });
  });
}

// Sync mobile cart badge with desktop badge
function syncCartBadges() {
  const desktop = document.getElementById('cart-badge');
  const mobile  = document.getElementById('cart-badge-mobile');
  if (!desktop || !mobile) return;
  const observer = new MutationObserver(() => {
    mobile.textContent = desktop.textContent;
  });
  observer.observe(desktop, { childList: true, characterData: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', async () => {
  await initNavbar();
  initFooter();
  initBottomNav();
  syncCartBadges();
});
