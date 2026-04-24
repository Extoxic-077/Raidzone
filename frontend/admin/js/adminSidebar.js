/**
 * adminSidebar.js — Shared sidebar for all admin pages.
 * Usage: import { initAdminSidebar } from './js/adminSidebar.js';
 *        await initAdminSidebar('dashboard');  // pass the active page key
 */

import { adminGetOrders } from '../../js/api.js';
import { getUser, isLoggedIn } from '../../js/auth.js';

const PAGES = {
  dashboard:  'index.html',
  analytics:  'analytics.html',
  realtime:   'realtime.html',
  products:   'products.html',
  categories: 'categories.html',
  companies:  'companies.html',
  coupons:    'coupons.html',
  warehouse:  'warehouse.html',
  orders:     'orders.html',
  payments:   'payments.html',
  users:      'users.html',
  campaigns:  'campaigns.html',
  monitoring: 'monitoring.html',
};

function link(page, active, icon, label, badge = '') {
  const isActive = page === active ? 'active' : '';
  const href = PAGES[page] || '#';
  return `
    <a href="${href}" class="admin-nav-link ${isActive}" data-page="${page}">
      <span class="admin-nav-icon-wrap">${icon}</span>
      <span class="admin-nav-text">${label}</span>
      ${badge ? `<span class="admin-nav-badge" id="badge-${page}">${badge}</span>` : ''}
    </a>`;
}

export async function initAdminSidebar(activePage = 'dashboard') {
  const aside = document.querySelector('.admin-sidebar');
  if (!aside) return;

  const isMobile = () => window.innerWidth <= 768;

  // Desktop collapse state (only on desktop)
  const collapsed = !isMobile() && localStorage.getItem('adminSidebarCollapsed') === 'true';
  if (collapsed) aside.classList.add('collapsed');

  const user = getUser();
  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  aside.innerHTML = `
    <div class="admin-sidebar-header">
      <div class="admin-logo-wrap">
        <div class="admin-logo-icon">
          <svg viewBox="0 0 28 28" fill="none" width="22" height="22">
            <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#C084FC"/><stop offset="100%" stop-color="#22D3EE"/>
            </linearGradient></defs>
            <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" fill="url(#sg)"/>
            <path d="M14 6L21.26 10.5V19.5L14 24L6.74 19.5V10.5L14 6Z" fill="rgba(7,7,15,0.6)"/>
          </svg>
        </div>
        <div class="admin-logo-text">Raidzone<span>Admin</span></div>
      </div>
      <!-- Desktop: collapse toggle -->
      <button class="sidebar-collapse-btn" id="sidebar-toggle" title="Toggle sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <!-- Mobile: close (X) button -->
      <button class="mobile-sidebar-close-btn sidebar-collapse-btn" id="sidebar-close-mobile" title="Close menu" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <nav class="admin-nav">
      <div class="admin-nav-section-header" data-section="overview">
        <span class="admin-nav-section">Overview</span>
        <svg class="section-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="admin-nav-group" id="section-overview">
        ${link('dashboard',  activePage, icons.dashboard,  'Dashboard')}
        ${link('analytics',  activePage, icons.analytics,  'Analytics')}
        ${link('realtime',   activePage, icons.realtime,   'Real-time')}
      </div>

      <div class="admin-nav-section-header" data-section="catalogue">
        <span class="admin-nav-section">Catalogue</span>
        <svg class="section-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="admin-nav-group" id="section-catalogue">
        ${link('products',   activePage, icons.products,   'Products')}
        ${link('categories', activePage, icons.categories, 'Categories')}
        ${link('coupons',    activePage, icons.coupons,    'Coupons')}
        ${link('warehouse',  activePage, icons.warehouse,  'Key Warehouse')}
      </div>

      <div class="admin-nav-section-header" data-section="commerce">
        <span class="admin-nav-section">Commerce</span>
        <svg class="section-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="admin-nav-group" id="section-commerce">
        ${link('orders',   activePage, icons.orders,   'Orders',   '')}
        ${link('payments', activePage, icons.payments, 'Payments')}
      </div>

      <div class="admin-nav-section-header" data-section="people">
        <span class="admin-nav-section">People</span>
        <svg class="section-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="admin-nav-group" id="section-people">
        ${link('users',     activePage, icons.users,     'Users')}
        ${link('campaigns', activePage, icons.campaigns, 'Campaigns')}
      </div>

      <div class="admin-nav-section-header" data-section="system">
        <span class="admin-nav-section">System</span>
        <svg class="section-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="admin-nav-group" id="section-system">
        ${link('monitoring', activePage, icons.monitoring, 'Server Health')}
        <a href="http://localhost:3001" target="_blank" class="admin-nav-link" rel="noopener">
          <span class="admin-nav-icon-wrap">${icons.grafana}</span>
          <span class="admin-nav-text">Grafana <span style="font-size:9px;opacity:0.6">↗</span></span>
        </a>
        <a href="/swagger-ui.html" target="_blank" class="admin-nav-link" rel="noopener">
          <span class="admin-nav-icon-wrap">${icons.api}</span>
          <span class="admin-nav-text">API Docs <span style="font-size:9px;opacity:0.6">↗</span></span>
        </a>
      </div>
    </nav>

    <div class="admin-sidebar-footer">
      <a href="../index.html" class="admin-nav-link admin-nav-back-link">
        <span class="admin-nav-icon-wrap">${icons.back}</span>
        <span class="admin-nav-text">Back to Store</span>
      </a>
      <div class="admin-user-strip" id="admin-user-strip">
        <div class="admin-user-avatar">${initials}</div>
        <div class="admin-user-info">
          <div class="admin-user-name">${user?.name || 'Admin'}</div>
          <div class="admin-user-email">${user?.email || ''}</div>
        </div>
      </div>
    </div>
  `;

  // ── Collapse toggle (desktop only) ──────────────────────────────────────────
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const isNowCollapsed = aside.classList.toggle('collapsed');
    localStorage.setItem('adminSidebarCollapsed', String(isNowCollapsed));
  });

  // ── Mobile burger + backdrop ─────────────────────────────────────────────────
  // Inject backdrop into body
  if (!document.getElementById('sidebar-backdrop')) {
    const bd = document.createElement('div');
    bd.className = 'sidebar-backdrop';
    bd.id = 'sidebar-backdrop';
    document.body.appendChild(bd);
  }

  // Inject burger button into .admin-mobile-topbar
  const topbar = document.querySelector('.admin-mobile-topbar');
  if (topbar && !topbar.querySelector('.mobile-menu-btn')) {
    const burger = document.createElement('button');
    burger.className = 'mobile-menu-btn';
    burger.id = 'mobile-menu-btn';
    burger.setAttribute('aria-label', 'Open menu');
    burger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>`;
    topbar.insertBefore(burger, topbar.firstChild);
  }

  function openMobileSidebar() {
    aside.classList.add('mobile-open');
    document.getElementById('sidebar-backdrop')?.classList.add('visible');
    document.body.classList.add('sidebar-open');
    document.getElementById('sidebar-close-mobile').style.display = '';
  }

  function closeMobileSidebar() {
    aside.classList.remove('mobile-open');
    document.getElementById('sidebar-backdrop')?.classList.remove('visible');
    document.body.classList.remove('sidebar-open');
    document.getElementById('sidebar-close-mobile').style.display = 'none';
  }

  document.getElementById('mobile-menu-btn')?.addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-close-mobile')?.addEventListener('click', closeMobileSidebar);
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeMobileSidebar);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && aside.classList.contains('mobile-open')) closeMobileSidebar();
  });

  // Auto-close on nav link click (mobile)
  aside.querySelectorAll('.admin-nav-link').forEach(a => {
    a.addEventListener('click', () => {
      if (isMobile()) closeMobileSidebar();
    });
  });

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (!isMobile() && aside.classList.contains('mobile-open')) closeMobileSidebar();
  });

  // ── Section collapse ────────────────────────────────────────────────────────
  aside.querySelectorAll('.admin-nav-section-header').forEach(header => {
    const section = header.dataset.section;
    const key     = `adminSection_${section}`;
    const group   = document.getElementById(`section-${section}`);
    if (!group) return;
    if (localStorage.getItem(key) === 'false') {
      group.classList.add('collapsed');
      header.classList.add('section-collapsed');
    }
    header.addEventListener('click', () => {
      const isCollapsed = group.classList.toggle('collapsed');
      header.classList.toggle('section-collapsed', isCollapsed);
      localStorage.setItem(key, String(!isCollapsed));
    });
  });

  // ── Pending orders badge ─────────────────────────────────────────────────────
  loadOrdersBadge();
  setInterval(loadOrdersBadge, 60_000);
}

async function loadOrdersBadge() {
  if (!isLoggedIn()) return;
  try {
    const result = await adminGetOrders({ status: 'PENDING_PAYMENT', size: 1 });
    const count = result?.totalElements ?? 0;
    const badge = document.getElementById('badge-orders');
    if (!badge) {
      // Create badge if it doesn't exist
      const orderLink = document.querySelector('[data-page="orders"]');
      if (orderLink && count > 0) {
        const b = document.createElement('span');
        b.className = 'admin-nav-badge';
        b.id = 'badge-orders';
        b.textContent = count > 99 ? '99+' : String(count);
        orderLink.appendChild(b);
      }
    } else {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch { /* silently fail */ }
}

const icons = {
  dashboard:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  analytics:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  realtime:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  products:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>`,
  categories: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  coupons:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  orders:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  payments:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  users:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  monitoring: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  warehouse:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  companies:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/></svg>`,
  campaigns:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  grafana:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  api:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  back:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>`,
};
