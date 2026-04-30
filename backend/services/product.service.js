const Product = require('../models/Product');
const { SORT_FIELDS, SAFE_FILTER_KEYS, PAGINATION } = require('../config/constants');

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Core params that are never treated as attribute filters
const CORE_PARAMS = new Set([
  'game', 'categorySlug', 'tab', 'search', 'sort',
  'page', 'limit', 'minPrice', 'maxPrice', 'active', 'admin', 'size',
]);

function buildFilter(query) {
  const { game, categorySlug, tab, search, minPrice, maxPrice } = query;
  const gameSlug = game || categorySlug;

  // active=true is unconditional on public endpoints; admin routes set their own filter
  const filter = { active: true };

  if (gameSlug) filter.game = gameSlug;
  if (tab) filter.tab = new RegExp('^' + escapeRegex(tab) + '$', 'i');

  // Dynamic attribute filters from remaining query params
  Object.keys(query).forEach(key => {
    if (CORE_PARAMS.has(key)) return;
    const val = query[key];
    if (!val) return;
    const regexVal = new RegExp('^' + escapeRegex(val) + '$', 'i');
    filter['$and'] = filter['$and'] || [];
    filter['$and'].push({
      $or: [
        { [`attributes.${key}`]: val },
        { [key]: regexVal }, // Legacy fallback (move to attributes recommended)
      ],
    });
  });

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  if (search && search.length >= 2) {
    filter.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  return filter;
}

function buildSort(sort) {
  return SORT_FIELDS[sort] || SORT_FIELDS.popular;
}

function parsePagination(query) {
  const page  = Math.max(parseInt(query.page)  || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || query.size) || PAGINATION.DEFAULT_LIMIT, 1), PAGINATION.MAX_LIMIT);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

const LIST_SELECT = 'name price originalPrice imageUrl slug badge stock subType itemType game tab active isFlashDeal views attributes';

async function queryProducts(filter, sortObj, skip, limit) {
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .select(LIST_SELECT)
      .maxTimeMS(500)
      .lean(),
    Product.countDocuments(filter).maxTimeMS(300),
  ]);

  // Soft fallback: if no results with dynamic filters, drop the last $and clause
  if (products.length === 0 && filter.$and?.length > 0) {
    const softened = { ...filter, $and: filter.$and.slice(0, -1) };
    if (!softened.$and.length) delete softened.$and;
    const fallback = await Product.find(softened).sort(sortObj).limit(limit).select(LIST_SELECT).lean();
    return { products: fallback, total };
  }

  return { products, total };
}

module.exports = { buildFilter, buildSort, parsePagination, queryProducts, LIST_SELECT, escapeRegex };
