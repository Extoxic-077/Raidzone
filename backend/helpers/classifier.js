const Blueprint = require("../models/Blueprint");

/**
 * Automatically classifies a product based on its name using active blueprints and keywords.
 * @param {string} name - Product name
 * @returns {Promise<{ itemType: string, subType: string | null }>} 
 */
async function classifyProduct(name) {
  if (!name) return { itemType: "other", subType: null };

  const blueprints = await Blueprint.find({ active: true });
  const lowerName = name.toLowerCase();

  for (const bp of blueprints) {
    // 1. Exact match with blueprint name
    if (lowerName.includes(bp.name.toLowerCase())) {
      return { itemType: bp.itemType, subType: bp.slug };
    }

    // 2. Keyword match
    if (bp.keywords && bp.keywords.length > 0) {
      for (const kw of bp.keywords) {
        if (lowerName.includes(kw.toLowerCase())) {
          return { itemType: bp.itemType, subType: bp.slug };
        }
      }
    }
  }

  return { itemType: "other", subType: null };
}

module.exports = { classifyProduct };
