const DEFAULT_CURRENCY = 'USD';
const DEFAULT_LOCALE   = 'en-US';

export function formatPrice(amount, currency = DEFAULT_CURRENCY) {
  if (amount == null) return '—';
  return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency }).format(amount);
}

export function formatDiscount(original, current) {
  if (!original || original <= current) return null;
  return Math.round((1 - current / original) * 100);
}

export function formatDate(iso, opts = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(DEFAULT_LOCALE, opts);
}

export function formatRelativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)   return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60)   return `${min}m ago`;
  const hr  = Math.floor(min / 60);
  if (hr  < 24)   return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30)   return `${day}d ago`;
  return formatDate(iso);
}

export function truncate(str, max = 80) {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

export function formatStock(stock) {
  if (stock == null) return '';
  if (stock === 0)   return 'Out of stock';
  if (stock <= 5)    return `Only ${stock} left`;
  return 'In stock';
}
