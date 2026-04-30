const ORDER_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED:       'CONFIRMED',
  PROCESSING:      'PROCESSING',
  DELIVERED:       'DELIVERED',
  CANCELLED:       'CANCELLED',
});

const SORT_FIELDS = Object.freeze({
  popular:  { views: -1, _id: -1 },
  newest:   { createdAt: -1 },
  cheapest: { price: 1 },
  expensive: { price: -1 },
});

// Fields on Product that can be used as filter keys.
// Prevents arbitrary field injection into MongoDB queries.
const SAFE_FILTER_KEYS = new Set([
  'blueprint', 'rarity', 'type', 'tier', 'platform',
  'itemType', 'rarityTier', 'weaponType', 'armorType', 'skinType',
]);

const CACHE_TTL = {
  PRODUCT_LIST:  300,   // 5 min
  PRODUCT_INIT:  600,   // 10 min
  FILTER_OPTIONS: 3600, // 1 hr
  AVAILABLE_GAMES: 86400, // 24 hr
  PRELOAD:        3600, // 1 hr
};

const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT:     50,
  MAX_PAGE:      1000,
};

module.exports = { ORDER_STATUS, SORT_FIELDS, SAFE_FILTER_KEYS, CACHE_TTL, PAGINATION };
