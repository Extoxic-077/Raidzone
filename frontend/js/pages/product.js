import { getProduct, getProducts } from '../api.js';
import { createProductCard } from '../components/productCard.js';
import { createDetailSkeleton } from '../components/skeleton.js';
import { showToast } from '../components/toast.js';
import { getCurrentProductId } from '../router.js';

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

const CATEGORY_GRADIENTS = {
  'PC Games':       'linear-gradient(135deg, #0f0a2e, #1a0a3e)',
  'Gift Cards':     'linear-gradient(135deg, #0f0a2e, #1a0a3e)',
  'Mobile Top-Up':  'linear-gradient(135deg, #0f0a2e, #1a0a4e)',
  'Streaming':      'linear-gradient(135deg, #1a0a0a, #2a0a1a)',
  'VPN & Software': 'linear-gradient(135deg, #0a0a2a, #0a1a2e)',
  'default':        'linear-gradient(135deg, #0d0d1a, #1a1a2e)',
};

function getCatGradient(cat) {
  if (!cat) return CATEGORY_GRADIENTS.default;
  for (const [k, v] of Object.entries(CATEGORY_GRADIENTS)) {
    if (k !== 'default' && cat.toLowerCase().includes(k.toLowerCase())) return v;
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

function renderRedeemSteps(howToRedeem) {
  if (!howToRedeem) return '<p style="color:var(--text-3)">No redemption instructions available.</p>';
  const steps = howToRedeem.split(/\n+/).filter(s => s.trim());
  return steps.map((step, i) => `
    <div class="redeem-step" style="animation-delay:${i * 80}ms">
      <div class="step-num">${i + 1}</div>
      <div class="step-text">${step.trim()}</div>
    </div>
  `).join('');
}

function renderProduct(product) {
  const container = document.getElementById('product-container');
  if (!container) return;

  const catName = product.categoryName || product.category || '';
  const gradient = getCatGradient(catName);
  const rating   = product.avgRating || product.rating || 0;
  const pct      = product.originalPrice && product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  const saving   = product.originalPrice && product.price
    ? product.originalPrice - product.price
    : null;

  container.innerHTML = `
    <div class="product-page">
      <div class="product-inner">

        <!-- Breadcrumb -->
        <div class="breadcrumb" style="margin-bottom:24px">
          <a href="index.html">Home</a>
          <span class="breadcrumb-sep">/</span>
          <a href="catalog.html${product.categoryId ? '?categoryId=' + product.categoryId : ''}">${catName || 'Products'}</a>
          <span class="breadcrumb-sep">/</span>
          <span style="color:var(--text-2)">${product.name}</span>
        </div>

        <!-- Two-column layout -->
        <div class="product-layout">

          <!-- Left: Image -->
          <div class="product-image-area" style="background:${gradient}">
            <div class="product-img-emoji">${product.imageEmoji || product.emoji || '🎮'}</div>
            ${pct ? `<div class="product-discount-badge">-${pct}%</div>` : ''}
          </div>

          <!-- Right: Info -->
          <div class="product-info">
            <div class="product-title">${product.name}</div>

            <div class="product-rating-row">
              <div class="card-stars" style="font-size:14px">${renderStars(rating)}</div>
              <span class="rating-num">${rating.toFixed(1)}</span>
              <span class="rating-count-text">(${(product.reviewCount || 0).toLocaleString()} reviews)</span>
              <span class="verified-badge">✓ Verified</span>
            </div>

            <div class="price-block">
              <div class="price-row">
                <div class="price-main">₹${(product.price || 0).toLocaleString('en-IN')}</div>
                ${product.originalPrice ? `<div class="price-orig">₹${product.originalPrice.toLocaleString('en-IN')}</div>` : ''}
              </div>
              ${saving ? `<div class="price-saving">You save ₹${saving.toLocaleString('en-IN')} (${pct}%)</div>` : ''}
            </div>

            <div class="delivery-badges">
              <span class="delivery-badge instant">⚡ Instant Delivery</span>
              <span class="delivery-badge region">🌍 ${product.region || 'Global'}</span>
            </div>

            <div class="product-actions">
              <button class="btn-add-to-cart" id="add-to-cart-btn">Add to Cart</button>
              <button class="btn-buy-now" id="buy-now-btn">Buy Now</button>
              <button class="btn-wishlist-detail" id="wishlist-btn" aria-label="Add to wishlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            <div class="payment-strip">Pay with: Visa · Mastercard · UPI · GPay · Apple Pay · PayTM · Bitcoin</div>
            <div class="security-note">🔐 256-bit SSL · Digital key delivered to email instantly</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="product-tabs-section">
          <div class="tabs-bar">
            <button class="tab-btn active" data-tab="description">Description</button>
            <button class="tab-btn" data-tab="redeem">How to Redeem</button>
            <button class="tab-btn" data-tab="reviews">Reviews (${(product.reviewCount || 0).toLocaleString()})</button>
          </div>

          <div class="tab-panel active" id="tab-description">
            <div class="product-description">${product.description || 'No description available.'}</div>
          </div>

          <div class="tab-panel" id="tab-redeem">
            <div class="redeem-steps">${renderRedeemSteps(product.howToRedeem || product.instructions)}</div>
          </div>

          <div class="tab-panel" id="tab-reviews">
            <div class="reviews-placeholder">
              <div class="reviews-placeholder-icon">🔐</div>
              <p>Reviews coming soon — only verified purchasers can leave reviews.</p>
            </div>
          </div>
        </div>

        <!-- Related products -->
        <div class="related-section">
          <div class="section-header">
            <h2 class="section-title">You might also like</h2>
          </div>
          <div class="related-scroll" id="related-scroll"></div>
        </div>

      </div>
    </div>
  `;

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(`tab-${btn.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });

  // Add to cart button
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    animateCartBadge();
    showToast(`${product.name} added to cart`, 'success');
  });

  // Buy now button
  document.getElementById('buy-now-btn')?.addEventListener('click', () => {
    animateCartBadge();
    showToast('Checkout coming in Phase 4', 'info');
  });

  // Wishlist button
  const wishBtn = document.getElementById('wishlist-btn');
  wishBtn?.addEventListener('click', () => {
    wishBtn.classList.toggle('active');
    wishBtn.classList.add('pop');
    wishBtn.addEventListener('animationend', () => wishBtn.classList.remove('pop'), { once: true });
    burstParticles(wishBtn);
    const isActive = wishBtn.classList.contains('active');
    showToast(isActive ? 'Added to wishlist' : 'Removed from wishlist', isActive ? 'success' : 'info');
  });

  // Load related products
  loadRelated(product.categoryId, product.id);
}

async function loadRelated(categoryId, currentId) {
  const scroll = document.getElementById('related-scroll');
  if (!scroll || !categoryId) return;

  try {
    const data = await getProducts({ categoryId, size: 8 });
    const items = Array.isArray(data) ? data : (data.content || data.items || []);
    const filtered = items.filter(p => String(p.id) !== String(currentId)).slice(0, 4);

    if (filtered.length === 0) {
      scroll.closest('.related-section').style.display = 'none';
      return;
    }

    filtered.forEach(p => {
      const card = createProductCard(p);
      scroll.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load related products:', err);
  }
}

export async function renderProduct() {
  const id = getCurrentProductId();
  if (!id) {
    window.location.href = 'catalog.html';
    return;
  }

  const container = document.getElementById('product-container');
  if (!container) return;

  // Show skeleton
  container.innerHTML = '';
  const skel = createDetailSkeleton();
  const skelWrap = document.createElement('div');
  skelWrap.className = 'product-inner';
  skelWrap.style.paddingTop = '64px';
  skelWrap.appendChild(skel);
  container.appendChild(skelWrap);

  try {
    const product = await getProduct(id);
    renderProduct(product);

    // Update page title
    document.title = `${product.name} — NexVault`;
  } catch (err) {
    container.innerHTML = `
      <div class="product-inner" style="padding-top:80px">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Product not found</h3>
          <p>${err.message}</p>
          <a href="catalog.html" class="btn btn-primary" style="margin-top:16px;display:inline-flex">← Back to Catalog</a>
        </div>
      </div>
    `;
    showToast('Failed to load product', 'error');
  }
}
