/**
 * Smart Item Classification Engine for Eldorado-Grade Data Quality
 */

export const ITEM_TYPES = {
  BLUEPRINTS: "Blueprints",
  WEAPONS: "Weapons",
  WEAPON_MODS: "Weapon Mods",
  AUGMENTS: "Augments",
  SHIELDS: "Shields",
  QUICK_USE: "Quick Use",
  TRAPS: "Traps",
  CRAFTING_MATERIALS: "Crafting Materials",
  KEYS: "Keys",
  COINS: "Coins",
  OTHER: "Other"
};

export const ALL_TYPES = Object.values(ITEM_TYPES);

export function classifyItem(name) {
  if (!name) return ITEM_TYPES.OTHER;
  const n = name.toLowerCase();

  // 🔑 KEYS
  if (n.includes("key")) return ITEM_TYPES.KEYS;

  // 🔥 BLUEPRINTS
  if (n.includes("blueprint")) return ITEM_TYPES.BLUEPRINTS;

  // 🔫 WEAPON MODS
  if (
    n.includes("grip") ||
    n.includes("magazine") ||
    n.includes("stock") ||
    n.includes("barrel") ||
    n.includes("choke") ||
    n.includes("muzzle") ||
    n.includes("silencer") ||
    n.includes("compensator")
  ) return ITEM_TYPES.WEAPON_MODS;

  // 💣 TRAPS
  if (n.includes("mine")) return ITEM_TYPES.TRAPS;

  // ⚡ QUICK USE
  if (
    n.includes("grenade") ||
    n.includes("flare") ||
    n.includes("shot") ||
    n.includes("spray") ||
    n.includes("hook") ||
    n.includes("kit")
  ) return ITEM_TYPES.QUICK_USE;

  // 🛠 CRAFTING
  if (n.includes("parts") || n.includes("coil") || n.includes("stick")) return ITEM_TYPES.CRAFTING_MATERIALS;

  // 🧪 AUGMENTS
  if (n.includes("tactical") || n.includes("looting") || n.includes("combat")) return ITEM_TYPES.AUGMENTS;

  // 🛡 SHIELDS
  if (n.includes("shield")) return ITEM_TYPES.SHIELDS;

  // 💰 COINS
  if (n.includes("coin") || n.includes("currency")) return ITEM_TYPES.COINS;

  return ITEM_TYPES.OTHER;
}

export function getSubType(name) {
  if (!name) return "General";
  const n = name.toLowerCase();
  
  if (n.includes("grip")) return "Grip";
  if (n.includes("magazine")) return "Magazine";
  if (n.includes("mine")) return "Mine";
  if (n.includes("grenade")) return "Grenade";
  if (n.includes("stock")) return "Stock";
  if (n.includes("barrel")) return "Barrel";
  if (n.includes("shot")) return "Vita Shot";
  if (n.includes("blueprint")) return "Blueprint";
  
  return "General";
}
