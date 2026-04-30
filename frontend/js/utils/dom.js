// Escape HTML to prevent XSS — use instead of raw innerHTML with API data
export function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Set innerHTML safely: only call with trusted template-literal strings where
// user data has gone through escHtml(). Never pass raw API strings directly.
export function setHtml(el, html) {
  if (el) el.innerHTML = html;
}

// querySelector with a guaranteed non-null return or a thrown error
export function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`DOM element not found: ${selector}`);
  return el;
}

// querySelector that returns null if not found (no throw)
export function $$(selector, root = document) {
  return root.querySelector(selector);
}

// querySelectorAll as an Array
export function $$all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function show(el) { if (el) el.hidden = false; }
export function hide(el) { if (el) el.hidden = true; }

export function on(el, event, handler, opts) {
  if (el) el.addEventListener(event, handler, opts);
}

// Build a URL with query params, skipping null/undefined/'' values
export function buildUrl(base, params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') qs.set(k, v);
  }
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}
