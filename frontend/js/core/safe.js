/**
 * Safety sanity-check utilities for Eldorado-grade architecture.
 */

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function safeObject(value) {
  return value && typeof value === 'object' ? value : {};
}

export function safeString(value) {
  return typeof value === 'string' ? value : '';
}

export function safeNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

export function safeDOM(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[SafeDOM] Missing element: #${id}`);
    return null;
  }
  return el;
}

/**
 * Safe Render Wrapper
 * Prevents a failure in one component from crashing the entire app.
 */
export function safeRender(name, data, renderFn, fallbackId) {
  try {
    renderFn(data);
  } catch (err) {
    console.error(`[SafeRender] Component "${name}" failed:`, err);
    const container = document.getElementById(fallbackId || name);
    if (container) {
      container.innerHTML = `<div class="error-state">Failed to load ${name}</div>`;
    }
  }
}
