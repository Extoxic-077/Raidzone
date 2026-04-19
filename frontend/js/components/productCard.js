import { showToast } from './toast.js';
import { isLoggedIn } from '../auth.js';
import { addToCart, toggleWishlist } from '../api.js';

const CATEGORY_GRADIENTS = {
  'PC Games':       'linear-gradient(135deg, #0f0a2e, #1a0a3e)',
  'Gift Cards':     'linear-gradient(135deg, #0f0a2e, #1a0a3e)',
  'Mobile Top-Up':  'linear-gradient(135deg, #0f0a2e, #1a0a4e)',
  'Streaming':      'linear-gradient(135deg, #1a0a0a, #2a0a1a)',
  'VPN & Software': 'linear-gradient(135deg, #0a0a2a, #0a1a2e)',
  'default':        'linear-gradient(135deg, #0d0d1a, #1a1a2e)',
};

function getCategoryGradient(category) {
  if (!category) return CATEGORY_GRADIENTS.default;
  for (const [key, val] of Object.entries(CATEGORY_GRADIENTS)) {
    if (key !== 'default' && category.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return CATEGORY_GRADIENTS.default;
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = (rating - full) >= 0.5 ? 1 : 0;
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
    const dist  = 20 + Math.random() * 10;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    p.style.left = `${rect.left + rect.width  / 2}px`;
    p.style.top  = `${rect.top  + rect.height / 2}px`;
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

export function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  // Image area
  const imgArea = document.createElement('div');
  imgArea.className = 'card-image';
  const gradient = getCategoryGradient(product.categoryName || product.category || '');
  imgArea.style.background = gradient;

  // Out of stock overlay badge
  const isOutOfStock = product.isActive === false || product.stockCount === 0;
  if (isOutOfStock) {
    const oosLabel = document.createElement('div');
    oosLabel.className = 'card-badge card-oos-badge';
    oosLabel.textContent = 'OUT OF STOCK';
    imgArea.appendChild(oosLabel);
    imgArea.style.opacity = '0.6';
  } else if (product.badge) {
    // Regular badge only when in stock
    const badge = document.createElement('div');
    const badgeType = product.badge.toLowerCase();
    badge.className = `card-badge ${badgeType}`;
    badge.textContent = product.badge;
    imgArea.appendChild(badge);
  }

  // Image or emoji fallback
  if (product.imageUrl) {
    const img = document.createElement('img');
    img.src = '' + product.imageUrl;
    img.alt = product.name;
    img.loading = 'lazy';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:inherit;';
    imgArea.style.position = 'relative';
    imgArea.appendChild(img);
  } else {
    const emoji = document.createElement('div');
    emoji.className = 'card-emoji';
    const emojiVal = product.imageEmoji || product.emoji;
    if (emojiVal) {
      emoji.textContent = emojiVal;
    } else {
      emoji.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h1m4 0h1"/><path d="M8 7v2"/></svg>`;
    }
    imgArea.appendChild(emoji);
  }

  // Wishlist button
  const wishBtn = document.createElement('button');
  wishBtn.className = 'card-wish';
  wishBtn.setAttribute('aria-label', 'Add to wishlist');
  wishBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

  wishBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      showToast('Please sign in first', 'info');
      setTimeout(() => { window.location.href = 'login.html'; }, 800);
      return;
    }
    try {
      const result = await toggleWishlist(product.id);
      const added = result?.added ?? !wishBtn.classList.contains('active');
      wishBtn.classList.toggle('active', added);
      wishBtn.classList.add('pop');
      wishBtn.addEventListener('animationend', () => wishBtn.classList.remove('pop'), { once: true });
      burstParticles(wishBtn);
      showToast(added ? 'Added to wishlist' : 'Removed from wishlist', added ? 'success' : 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  imgArea.appendChild(wishBtn);

  // Card body
  const body = document.createElement('div');
  body.className = 'card-body';

  const name = document.createElement('div');
  name.className = 'card-name';
  name.title = product.name;
  name.textContent = product.name;

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const parts = [];
  if (product.categoryName) parts.push(product.categoryName);
  if (product.brand)        parts.push(product.brand);
  meta.textContent = parts.join(' · ') || '—';

  const starsRow = document.createElement('div');
  starsRow.className = 'card-stars';
  const rating = product.avgRating || product.rating || 0;
  starsRow.innerHTML = `<span class="stars-row">${renderStars(rating)}</span><span class="rating-count">(${product.reviewCount || 0})</span>`;

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const priceBlock = document.createElement('div');
  priceBlock.className = 'card-price-block';

  const price = document.createElement('div');
  price.className = 'card-price';
  price.textContent = `₹${(product.price || 0).toLocaleString('en-IN')}`;

  priceBlock.appendChild(price);

  if (product.originalPrice && product.originalPrice > product.price) {
    const orig = document.createElement('div');
    orig.className = 'card-orig-price';
    orig.textContent = `₹${product.originalPrice.toLocaleString('en-IN')}`;
    priceBlock.appendChild(orig);
  }

  const isOutOfStockBtn = product.isActive === false || product.stockCount === 0;
  const addBtn = document.createElement('button');
  if (isOutOfStockBtn) {
    addBtn.className = 'card-add-btn card-oos-btn';
    addBtn.setAttribute('aria-label', 'Out of stock');
    addBtn.disabled = true;
    addBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  } else {
    addBtn.className = 'card-add-btn';
    addBtn.setAttribute('aria-label', 'Add to cart');
    addBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`;
    addBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!isLoggedIn()) {
        showToast('Please sign in first', 'info');
        setTimeout(() => { window.location.href = 'login.html'; }, 800);
        return;
      }
      try {
        await addToCart(product.id, 1);
        addBtn.classList.add('click');
        addBtn.addEventListener('animationend', () => addBtn.classList.remove('click'), { once: true });
        animateCartBadge();
        showToast(`${product.name} added to cart`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  footer.appendChild(priceBlock);
  footer.appendChild(addBtn);

  body.appendChild(name);
  body.appendChild(meta);
  body.appendChild(starsRow);
  body.appendChild(footer);

  card.appendChild(imgArea);
  card.appendChild(body);

  card.addEventListener('click', () => {
    window.location.href = `product.html?id=${product.id}`;
  });

  return card;
}
