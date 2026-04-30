import { showToast } from './toast.js';

function hexagonSVG() {
  return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#C084FC"/>
        <stop offset="100%" stop-color="#22D3EE"/>
      </linearGradient>
    </defs>
    <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" fill="url(#fg)"/>
    <path d="M14 6L21.26 10.5V19.5L14 24L6.74 19.5V10.5L14 6Z" fill="rgba(7,7,15,0.6)"/>
  </svg>`;
}

const SOCIAL_ICONS = {
  twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 1 0 24 12 12 12 0 0 0 11.944 0zm5.554 8.338-1.684 7.938c-.124.582-.46.724-.931.45l-2.572-1.896-1.24 1.193c-.137.137-.252.252-.516.252l.184-2.624 4.767-4.306c.207-.184-.045-.285-.322-.101L7.468 14.27 4.93 13.48c-.564-.175-.576-.563.117-.833l10.879-4.19c.47-.172.882.1.572 1.88z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
};

export function initFooter() {
  const el = document.getElementById('footer');
  if (!el) return;

  el.innerHTML = `
    <div class="footer-main">
      <div class="footer-brand">
        <a href="/" style="display:flex;align-items:center;gap:8px;font-family:var(--font-display);font-weight:800;font-size:18px;background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none;margin-bottom:4px;">
          ${hexagonSVG()} RAIDZONE
        </a>
        <p class="footer-brand-desc">
          Your one-stop marketplace for digital goods — instant delivery of games, gift cards, subscriptions and top-ups worldwide.
          Safe, fast, and verified.
        </p>
        <div class="footer-socials">
          ${Object.entries(SOCIAL_ICONS).map(([name, svg]) => `
            <button class="footer-social-btn" data-social="${name}" aria-label="${name}">
              ${svg}
            </button>
          `).join('')}
        </div>
        <div class="footer-newsletter">
          <input type="email" placeholder="your@email.com" aria-label="Email for newsletter" id="footer-email"/>
          <button id="footer-subscribe">Subscribe</button>
        </div>
      </div>

      <div class="footer-col">
        <div class="footer-col-heading">Products</div>
        <ul class="footer-links">
          <li><a href="catalog.html">All Products</a></li>
          <li><a href="catalog.html?category=games">Games</a></li>
          <li><a href="catalog.html?category=gift-cards">Gift Cards</a></li>
          <li><a href="catalog.html?category=top-up">Mobile Top-Up</a></li>
          <li><a href="catalog.html?category=streaming">Streaming</a></li>
          <li><a href="catalog.html?category=software">Software</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <div class="footer-col-heading">Company</div>
        <ul class="footer-links">
          <li><a href="about.html">About Us</a></li>
          <li><a href="careers.html">Careers</a></li>
          <li><a href="blog.html">Blog</a></li>
          <li><a href="press.html">Press</a></li>
          <li><a href="partnerships.html">Partnerships</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <div class="footer-col-heading">Support</div>
        <ul class="footer-links">
          <li><a href="help.html">Help Center</a></li>
          <li><a href="contact.html">Contact Us</a></li>
          <li><a href="contact.html">Live Chat</a></li>
          <li><a href="order-tracking.html">Order Tracking</a></li>
          <li><a href="refund-policy.html">Refund Policy</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <div class="footer-col-heading">Legal</div>
        <ul class="footer-links">
          <li><a href="privacy.html">Privacy Policy</a></li>
          <li><a href="terms.html">Terms of Service</a></li>
          <li><a href="cookies.html">Cookie Policy</a></li>
          <li><a href="dmca.html">DMCA</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <span class="footer-copy">© ${new Date().getFullYear()} RAIDZONE MARKET. All rights reserved.</span>
      <div class="payment-badges">
        ${['Visa', 'Mastercard', 'UPI', 'Crypto', 'PayTM', 'Google Pay'].map(p =>
          `<span class="payment-badge">${p}</span>`
        ).join('')}
      </div>
    </div>

    <div class="footer-signature">
      <span class="footer-sig-inner">
        <span class="footer-sig-flag">🇹🇲</span>
        Coded with <span class="footer-sig-heart">♥</span> somewhere between the Karakum Desert and the cosmos
        &nbsp;·&nbsp; crafted by <strong>Hemra Ashyrov</strong>
        <span class="footer-sig-flag">🇹🇲</span>
      </span>
    </div>
  `;

  // Mobile accordion for footer columns
  el.querySelectorAll('.footer-col').forEach(col => {
    const heading = col.querySelector('.footer-col-heading');
    if (!heading) return;
    heading.addEventListener('click', () => {
      if (window.innerWidth >= 640) return;
      col.classList.toggle('open');
    });
  });

  // Social buttons
  el.querySelectorAll('.footer-social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast(`${btn.dataset.social} link coming soon`, 'info');
    });
  });

  // Newsletter subscribe
  document.getElementById('footer-subscribe')?.addEventListener('click', async () => {
    const inp   = document.getElementById('footer-email');
    const email = inp?.value?.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    const btn = document.getElementById('footer-subscribe');
    btn.disabled = true; btn.textContent = '…';
    try {
      const API = window.__API_BASE__ || '/api';
      const res = await fetch(`${API}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Request failed');
      showToast('Thanks for subscribing!', 'success');
      if (inp) inp.value = '';
    } catch {
      showToast('Could not subscribe. Try again later.', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Subscribe';
    }
  });
}
