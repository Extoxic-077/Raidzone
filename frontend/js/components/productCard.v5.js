import { showToast } from './toast.js';
import { isLoggedIn } from '../auth.js';
import { addToCart, toggleWishlist } from '../api.js';

const CATEGORY_GRADIENTS = {
  'PC Games': 'linear-gradient(135deg, #050510, #0a1f1a)',
  'Gift Cards': 'linear-gradient(135deg, #050510, #0a1f1a)',
  'Mobile Top-Up': 'linear-gradient(135deg, #050510, #0a1f1a)',
  'Streaming': 'linear-gradient(135deg, #050510, #0a1f1a)',
  'VPN & Software': 'linear-gradient(135deg, #050510, #0a1f1a)',
  'default': 'linear-gradient(135deg, #050510, #0a1f1a)',
};

function getCategoryGradient(category) {
  if (!category) return CATEGORY_GRADIENTS.default;
  for (const [key, val] of Object.entries(CATEGORY_GRADIENTS)) {
    if (key !== 'default' && category.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return CATEGORY_GRADIENTS.default;
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = (rating - full) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    '<span class="star-filled">★</span>'.repeat(full) +
    (half ? '<span class="star-filled">½</span>' : '') +
    '<span style="color:var(--text-4)">★</span>'.repeat(empty)
  );
}

function burstParticles(btn) {
  const rect = btn.getBoundingClientRect();
  for (let i = 0; i < 4; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 4) * 2 * Math.PI;
    const dist = 20 + Math.random() * 10;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    p.style.left = `${rect.left + rect.width / 2}px`;
    p.style.top = `${rect.top + rect.height / 2}px`;
    p.style.position = 'fixed';
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

function animateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const current = parseInt(badge.textContent || '0', 10);
  badge.textContent = current + 1;
  badge.classList.remove('pop');
  void badge.offsetWidth;
  badge.classList.add('pop');
  badge.addEventListener('animationend', () => badge.classList.remove('pop'), { once: true });
}

export function createProductCard(product, index = 0) {
  const card = document.createElement('div');
  card.className = 'product-card stagger-in';
  card.style.animationDelay = `${50 * (index % 12)}ms`;

  // Delivery Badge (Live feeling)
  const deliveryTimes = ['Instant', '< 15 min', '< 30 min', '1h'];
  const delivery = deliveryTimes[index % deliveryTimes.length];

  // Image area
  const imgArea = document.createElement('div');
  imgArea.className = 'card-image';

  if (product.imageUrl) {
    const img = document.createElement('img');
    img.src = product.imageUrl;
    img.alt = product.name;
    img.loading = 'lazy';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    imgArea.appendChild(img);
  } else {
    imgArea.style.background = 'var(--bg3)';
    imgArea.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:0.3;">🎮</div>`;
  }

  const deliveryBadge = document.createElement('div');
  deliveryBadge.className = 'card-delivery-badge';
  deliveryBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> ${delivery}`;
  imgArea.appendChild(deliveryBadge);

  // Card body
  const body = document.createElement('div');
  body.className = 'card-body';

  // Seller info
  const sellers = ['RaidZonePro', 'EliteTrader', 'GameMaster', 'VaultKeeper'];
  const seller = sellers[index % sellers.length];
  const sellerInfo = document.createElement('div');
  sellerInfo.className = 'card-seller-info';
  sellerInfo.innerHTML = `
    <div class="seller-avatar">${seller[0]}</div>
    <span>${seller}</span>
  `;
  body.appendChild(sellerInfo);

  const name = document.createElement('div');
  name.className = 'card-name';
  name.title = product.name;
  name.textContent = product.name;
  body.appendChild(name);

  // Stats
  // Social Proof Enhancement (Temporary Vanity Metrics)
  const seed = (product.id || index) * 12345;
  const pseudoRandom = (n) => Math.abs(Math.sin(seed + n));
  
  const genRating = (4.7 + (pseudoRandom(1) * 0.3)).toFixed(1);
  const genReviews = Math.floor(pseudoRandom(2) * 200) + 42;

  const rating = product.avgRating && product.avgRating > 0 ? product.avgRating.toFixed(1) : genRating;
  const reviews = product.reviewCount && product.reviewCount > 0 ? product.reviewCount : genReviews;
  const statsRow = document.createElement('div');
  statsRow.className = 'card-stats-row';
  statsRow.innerHTML = `
    <div class="card-stat">
      <svg class="stat-icon-star" viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      <span class="stat-value">${rating}</span>
      <span>(${reviews})</span>
    </div>
    <div class="card-stat">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 12h.01"/><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/></svg>
      <span class="stat-value">${product.stockCount || 'In Stock'}</span>
    </div>
  `;
  body.appendChild(statsRow);

  // Price & Buy button
  const priceRow = document.createElement('div');
  priceRow.className = 'card-price-row';

  const priceWrap = document.createElement('div');
  priceWrap.className = 'card-price-wrap';
  priceWrap.innerHTML = `
    <span class="card-label-small">Instant Delivery</span>
    <div class="card-price">$${(product.price || 0).toLocaleString('en-US')}</div>
  `;

  const buyBtn = document.createElement('button');
  buyBtn.className = 'card-buy-btn';
  buyBtn.textContent = 'Buy Now';
  const handleBuy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/product.html?slug=${encodeURIComponent(product.slug || product.id)}`;
  };
  buyBtn.addEventListener('click', handleBuy);
  buyBtn.addEventListener('touchstart', handleBuy, { passive: false });

  priceRow.appendChild(priceWrap);
  priceRow.appendChild(buyBtn);
  body.appendChild(priceRow);

  card.appendChild(imgArea);
  card.appendChild(body);

  const handleGo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/product.html?slug=${encodeURIComponent(product.slug || product.id)}`;
  };

  card.addEventListener('click', handleGo);
  card.addEventListener('touchstart', handleGo, { passive: false });

  return card;
}
