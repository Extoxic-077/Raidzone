import { getProduct, getProducts, addToCart, toggleWishlist, getWishlistStatus, getProductReviews, createReview, recordPurchase, hasPurchased } from '../api.js';
import { createProductCard } from '../components/productCard.js';
import { createDetailSkeleton } from '../components/skeleton.js';
import { showToast } from '../components/toast.js';
import { getCurrentProductId } from '../router.js';
import { isLoggedIn, getUser } from '../auth.js';
import { makeDraggable } from '../utils/dragScroll.js';

// ── Sign-in prompt modal ──────────────────────────────────────────────────────

function showSignInPrompt(action = 'continue') {
  document.getElementById('signin-prompt-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'signin-prompt-modal';
  Object.assign(modal.style, {
    position: 'fixed', inset: '0', zIndex: '9999',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(8px)',
  });

  modal.innerHTML = `
    <div style="
      background:#0F0F1A;border:1px solid #2D2D44;border-radius:20px;
      padding:44px 36px;max-width:360px;width:90%;text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,0.6);
      animation:slideUp 0.22s ease;
    ">
      <div style="margin-bottom:16px;display:flex;justify-content:center"><svg viewBox="0 0 24 24" fill="none" stroke="#C084FC" stroke-width="1.5" width="48" height="48"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
      <h2 style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#F1F0F7;margin:0 0 10px">
        Sign in required
      </h2>
      <p style="color:#9CA3AF;font-size:14px;line-height:1.6;margin:0 0 28px">
        Please sign in to ${action}.
      </p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button id="signin-prompt-cancel" style="
          padding:10px 24px;border:1px solid #2D2D44;border-radius:10px;
          background:transparent;color:#9CA3AF;font-family:'DM Sans',sans-serif;
          font-size:14px;font-weight:500;cursor:pointer;transition:border-color 0.15s;
        ">Cancel</button>
        <a href="login.html" style="
          padding:10px 28px;background:linear-gradient(135deg,#7C3AED,#22D3EE);
          border-radius:10px;color:#fff;font-family:'DM Sans',sans-serif;
          font-size:14px;font-weight:600;text-decoration:none;
          display:inline-flex;align-items:center;gap:6px;
        ">Sign In →</a>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.getElementById('signin-prompt-cancel').addEventListener('click', () => modal.remove());

  // Save redirect so login sends them back here
  sessionStorage.setItem('redirectAfterLogin', window.location.href.replace(window.location.origin + '/', ''));
}

function animateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const current = parseInt(badge.textContent || '0', 10);
    badge.textContent = current + 1;
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
    badge.addEventListener('animationend', () => badge.classList.remove('pop'), { once: true });
  }
  const mobileBadge = document.getElementById('cart-badge-mobile');
  if (mobileBadge) {
    const current = parseInt(mobileBadge.textContent || '0', 10);
    mobileBadge.textContent = current + 1;
  }
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

// ── Reviews tab ───────────────────────────────────────────────────────────────

function renderReviewStars(rating, interactive = false) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (interactive) {
      html += `<span class="review-star-btn${i <= rating ? ' active' : ''}" data-star="${i}">★</span>`;
    } else {
      html += `<span class="${i <= rating ? 'star-filled' : ''}" style="${i > rating ? 'color:var(--text-4)' : ''}">★</span>`;
    }
  }
  return html;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function loadAndRenderReviews(productId) {
  const panel = document.getElementById('tab-reviews');
  if (!panel) return;

  panel.innerHTML = '<div class="reviews-loading"><div class="reviews-spinner"></div></div>';

  const loggedIn    = isLoggedIn();
  const currentUser = getUser();

  // Fetch reviews + purchase status in parallel
  const [reviews, purchased] = await Promise.all([
    getProductReviews(productId).catch(() => []),
    loggedIn ? hasPurchased(productId).then(r => r?.purchased ?? false).catch(() => false) : Promise.resolve(false),
  ]);

  // Check if user already reviewed
  const myReview = loggedIn && currentUser
    ? reviews.find(r => r.userId === currentUser.id)
    : null;

  // Auto-open form if the user just came back from "Buy Now"
  const pendingKey = `pendingReview_${productId}`;
  const hasPendingFlag = localStorage.getItem(pendingKey) === '1';
  if (hasPendingFlag) localStorage.removeItem(pendingKey);

  const writeFormOpen = hasPendingFlag || !myReview;

  panel.innerHTML = `
    ${loggedIn && purchased
        ? renderWriteReviewSection(myReview, writeFormOpen)
        : loggedIn
          ? `<div class="review-locked-notice">
               <span class="review-locked-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
               <span>Purchase this product to leave a review.</span>
             </div>`
          : ''
    }
    <div id="reviews-list">
      ${reviews.length === 0
        ? `<div class="reviews-placeholder">
             <div class="reviews-placeholder-icon">💬</div>
             <p>No reviews yet — be the first to review after purchasing!</p>
           </div>`
        : reviews.map(r => renderReviewCard(r, currentUser)).join('')
      }
    </div>
  `;

  // Wire up the write-review form only if purchase is confirmed
  if (loggedIn && purchased) {
    wireReviewForm(productId, panel, currentUser);
  }
}

function renderWriteReviewSection(existingReview, openByDefault) {
  const rating  = existingReview?.rating  ?? 0;
  const comment = existingReview?.comment ?? '';
  const label   = existingReview ? 'Update Your Review' : 'Write a Review';

  return `
    <div class="review-write-wrap${openByDefault ? ' open' : ''}" id="review-write-wrap">
      <button class="review-write-toggle" id="review-toggle-btn">
        <span>${label}</span>
        <svg class="review-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div class="review-form-body" id="review-form-body">
        <form id="review-form" class="review-form" novalidate>
          <div class="review-stars-row" id="review-stars-input">
            ${[1,2,3,4,5].map(i =>
              `<span class="review-star-btn${i <= rating ? ' active' : ''}" data-star="${i}">★</span>`
            ).join('')}
            <span class="review-stars-hint" id="stars-hint">${rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}</span>
          </div>
          <textarea
            id="review-comment"
            class="review-textarea"
            placeholder="Share your experience (optional, max 255 characters)"
            maxlength="255"
            rows="3"
          >${comment}</textarea>
          <div class="review-form-footer">
            <span class="review-char-count" id="review-char-count">${comment.length}/255</span>
            <button type="submit" class="btn-review-submit" id="review-submit-btn">
              ${existingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function memberSinceText(iso) {
  if (!iso) return '';
  try {
    return 'Member since ' + new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
  } catch { return ''; }
}

function renderReviewCard(review, currentUser) {
  const isOwn = currentUser && review.userId === currentUser.id;
  const displayName = review.userNickname || review.userName || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();
  const since = memberSinceText(review.userMemberSince);
  return `
    <div class="review-card${isOwn ? ' review-card-own' : ''}">
      <div class="review-card-header">
        <div class="review-avatar">${initials}</div>
        <div class="review-meta">
          <div class="review-author">${displayName}${isOwn ? ' <span class="review-you-badge">You</span>' : ''}</div>
          <div class="review-date">${timeAgo(review.createdAt)}${since ? ' · ' + since : ''}</div>
        </div>
        <div class="review-stars-display">${renderReviewStars(review.rating)}</div>
      </div>
      ${review.comment ? `<p class="review-comment">${review.comment}</p>` : ''}
    </div>
  `;
}

function wireReviewForm(productId, panel, currentUser) {
  let selectedRating = 0;

  // Toggle open/close
  const toggleBtn  = panel.querySelector('#review-toggle-btn');
  const formBody   = panel.querySelector('#review-form-body');
  const wrapEl     = panel.querySelector('#review-write-wrap');
  if (toggleBtn && formBody) {
    toggleBtn.addEventListener('click', () => {
      wrapEl.classList.toggle('open');
    });
  }

  // Star input
  const starsRow  = panel.querySelector('#review-stars-input');
  const starsHint = panel.querySelector('#stars-hint');
  if (starsRow) {
    const labels = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
    // Read initial value: take the highest-numbered active star (not the first)
    starsRow.querySelectorAll('.review-star-btn.active[data-star]').forEach(b => {
      const v = parseInt(b.dataset.star, 10);
      if (v > selectedRating) selectedRating = v;
    });

    starsRow.querySelectorAll('.review-star-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.dataset.star, 10);
        starsRow.querySelectorAll('.review-star-btn').forEach(b => {
          b.classList.toggle('active', parseInt(b.dataset.star, 10) <= selectedRating);
        });
        if (starsHint) starsHint.textContent = `${selectedRating} star${selectedRating > 1 ? 's' : ''} — ${labels[selectedRating - 1]}`;
      });

      btn.addEventListener('mouseenter', () => {
        const hov = parseInt(btn.dataset.star, 10);
        starsRow.querySelectorAll('.review-star-btn').forEach(b => {
          b.classList.toggle('hover', parseInt(b.dataset.star, 10) <= hov);
        });
      });

      btn.addEventListener('mouseleave', () => {
        starsRow.querySelectorAll('.review-star-btn').forEach(b => b.classList.remove('hover'));
      });
    });
  }

  // Char counter
  const textarea  = panel.querySelector('#review-comment');
  const charCount = panel.querySelector('#review-char-count');
  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      charCount.textContent = `${textarea.value.length}/255`;
    });
  }

  // Form submit
  const form      = panel.querySelector('#review-form');
  const submitBtn = panel.querySelector('#review-submit-btn');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (selectedRating < 1) {
        showToast('Please select a star rating', 'info');
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';
      try {
        await createReview(productId, {
          rating:  selectedRating,
          comment: textarea?.value.trim() || null,
        });
        showToast('Review saved!', 'success');
        // Reload the reviews section
        await loadAndRenderReviews(productId);
        // Refresh the reviews tab count in the tab button
        const tabBtn = document.querySelector('.tab-btn[data-tab="reviews"]');
        if (tabBtn) {
          try {
            const fresh = await getProductReviews(productId);
            tabBtn.textContent = `Reviews (${fresh.length})`;
          } catch { /* ok */ }
        }
      } catch (err) {
        showToast(err.message || 'Failed to save review', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
      }
    });
  }
}

// ── Main render ───────────────────────────────────────────────────────────────

function renderProductUI(product) {
  const container = document.getElementById('product-container');
  if (!container) return;

  const catName  = product.categoryName || product.category || '';
  const gradient = getCatGradient(catName);
  const rating   = product.avgRating || product.rating || 0;
  const pct      = product.originalPrice && product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  const saving   = product.originalPrice && product.price
    ? product.originalPrice - product.price
    : null;

  // Image block — uses cover img if available, falls back to emoji
  const imageBlock = product.imageUrl
    ? `<img
        src="${product.imageUrl}"
        alt="${product.name}"
        class="product-detail-img"
        loading="eager"
      />`
    : `<div class="product-img-emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h1m4 0h1"/><path d="M8 7v2"/></svg></div>`;

  container.innerHTML = `
    <div class="product-page">
      <div class="product-inner">

        <!-- Breadcrumb -->
        <nav class="breadcrumb" aria-label="breadcrumb">
          <a href="index.html">Home</a>
          <span class="breadcrumb-sep">/</span>
          <a href="catalog.html${product.categoryId ? '?categoryId=' + product.categoryId : ''}">${catName || 'Products'}</a>
          <span class="breadcrumb-sep">/</span>
          <span style="color:var(--text-2)">${product.name}</span>
        </nav>

        <!-- Two-column layout -->
        <div class="product-layout">

          <!-- Left: Image -->
          <div class="product-image-wrap">
            <div class="product-image-area" style="background:${gradient}">
              ${imageBlock}
              ${pct ? `<div class="product-discount-badge">-${pct}%</div>` : ''}
            </div>
          </div>

          <!-- Right: Info -->
          <div class="product-info">
            <h1 class="product-title">${product.name}</h1>

            <div class="product-rating-row">
              <div class="card-stars" style="font-size:14px">${renderStars(rating)}</div>
              <span class="rating-num">${Number(rating).toFixed(1)}</span>
              <span class="rating-count-text">(${(product.reviewCount || 0).toLocaleString()} reviews)</span>
              <span class="verified-badge">✓ Verified</span>
            </div>

            <div class="price-block">
              <div class="price-row">
                <div class="price-main">₹${(product.price || 0).toLocaleString('en-IN')}</div>
                ${product.originalPrice ? `<div class="price-orig">₹${product.originalPrice.toLocaleString('en-IN')}</div>` : ''}
              </div>
              ${saving ? `<div class="price-saving">You save ₹${Number(saving).toLocaleString('en-IN')} (${pct}%)</div>` : ''}
            </div>

            <div class="delivery-badges">
              <span class="delivery-badge instant"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Instant Delivery</span>
              <span class="delivery-badge region"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> ${product.region || 'Global'}</span>
            </div>

            <div class="product-actions">
              ${product.isActive === false || product.stockCount === 0
                ? `<button class="btn-add-to-cart btn-oos" disabled>Out of Stock</button>
                   <button class="btn-buy-now btn-oos" disabled>Out of Stock</button>`
                : `<button class="btn-add-to-cart" id="add-to-cart-btn">Add to Cart</button>
                   <button class="btn-buy-now" id="buy-now-btn">Buy Now</button>`
              }
              <button class="btn-wishlist-detail" id="product-wishlist-btn" aria-label="Add to wishlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            <div class="payment-strip">Pay with: Visa · Mastercard · UPI · GPay · Apple Pay · PayTM · Bitcoin</div>
            <div class="security-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle;margin-right:4px"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>256-bit SSL · Digital key delivered to email instantly</div>
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
            <!-- Populated by loadAndRenderReviews() when the tab is first opened -->
            <div class="reviews-placeholder">
              <div class="reviews-placeholder-icon">💬</div>
              <p>Click the Reviews tab to load reviews.</p>
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

  // Drag-scroll for tabs bar and related scroll
  makeDraggable(document.querySelector('.tabs-bar'));

  // Tab switching — lazy-load reviews on first open
  let reviewsLoaded = false;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(`tab-${btn.dataset.tab}`);
      if (panel) panel.classList.add('active');

      if (btn.dataset.tab === 'reviews' && !reviewsLoaded) {
        reviewsLoaded = true;
        loadAndRenderReviews(product.id);
      }
    });
  });

  // Add to cart
  document.getElementById('add-to-cart-btn')?.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showSignInPrompt('add items to your cart');
      return;
    }
    try {
      await addToCart(product.id, 1);
      animateCartBadge();
      showToast(`${product.name} added to cart`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Buy now — record purchase, set pending review flag, redirect to cart
  document.getElementById('buy-now-btn')?.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showSignInPrompt('buy this product');
      return;
    }
    try {
      await addToCart(product.id, 1);
      animateCartBadge();
      // Record purchase so the user can later leave a review
      await recordPurchase(product.id);
      // Flag used to auto-open the review form when user returns to this page
      localStorage.setItem(`pendingReview_${product.id}`, '1');
      showToast('Purchase recorded! Leave a review after you receive your key.', 'success');
      setTimeout(() => { window.location.href = 'cart.html'; }, 1200);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Check for pending review on page load — auto-open Reviews tab
  const pendingKey = `pendingReview_${product.id}`;
  if (isLoggedIn() && localStorage.getItem(pendingKey) === '1') {
    // Switch to reviews tab automatically
    const reviewTabBtn = document.querySelector('.tab-btn[data-tab="reviews"]');
    if (reviewTabBtn) {
      setTimeout(() => {
        reviewTabBtn.click();
        showToast('How was your experience? Leave a review below!', 'info');
      }, 500);
    }
  }

  // Wishlist
  const wishBtn = document.getElementById('product-wishlist-btn');
  if (isLoggedIn() && wishBtn) {
    getWishlistStatus(product.id)
      .then(res => { if (res?.wishlisted) wishBtn.classList.add('active'); })
      .catch(() => {});
  }

  wishBtn?.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showSignInPrompt('save items to your wishlist');
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

  // Related products
  loadRelated(product.categoryId, product.id);
}

async function loadRelated(categoryId, currentId) {
  const scroll = document.getElementById('related-scroll');
  if (!scroll || !categoryId) return;

  try {
    const data = await getProducts({ categoryId, size: 8 });
    const items = Array.isArray(data) ? data : (data.content || data.items || []);
    const filtered = items.filter(p => String(p.id) !== String(currentId)).slice(0, 6);

    if (filtered.length === 0) {
      const section = scroll.closest('.related-section');
      if (section) section.style.display = 'none';
      return;
    }

    filtered.forEach(p => {
      const card = createProductCard(p);
      scroll.appendChild(card);
    });

    makeDraggable(scroll);
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
    renderProductUI(product);
    document.title = `${product.name} — Raidzone`;
  } catch (err) {
    container.innerHTML = `
      <div class="product-inner" style="padding-top:80px">
        <div class="empty-state">
          <div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <h3>Product not found</h3>
          <p>${err.message}</p>
          <a href="catalog.html" class="btn btn-primary" style="margin-top:16px;display:inline-flex">← Back to Catalog</a>
        </div>
      </div>
    `;
    showToast('Failed to load product', 'error');
  }
}
