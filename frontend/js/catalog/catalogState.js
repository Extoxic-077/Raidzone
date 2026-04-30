const stateObj = {
  game: null,
  tab: "items",
  itemType: null,
  subType: null,
  brand: null,
  search: "",
  sort: "popular",
  minPrice: null,
  maxPrice: null,
  rating: null,
  page: 1
};

// ─── AUTO-CORRECTION MAPPING ─────────────────────────────────────────────────
const TAB_TO_GAME = {
  'coins': 'arc-raiders',
  'accounts': 'arc-raiders',
  'boosting': 'arc-raiders',
  'skins': 'cs2',
  'operations': 'delta-force',
  'warfare': 'delta-force',
  'currency': 'windrose'
};

const state = new Proxy(stateObj, {
  set(target, prop, value) {
    if (prop === 'game' && value && TAB_TO_GAME[value]) {
       const correctGame = TAB_TO_GAME[value];
       console.log(`[STATE_GUARD] Intercepted invalid game: ${value}. Correcting to game=${correctGame}, tab=${value}`);
       target.game = correctGame;
       target.tab = value;
       return true;
    }
    target[prop] = value;
    return true;
  }
});

export default state;
