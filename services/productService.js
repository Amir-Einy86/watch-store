// Product service: all the database logic for products lives here.
// The controller only passes clean values in and sends the result out.
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

// A user's search text must be treated as plain letters, not as a regex pattern.
// (otherwise "(" or ".*" typed by a user would change the search)
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Turns the clean parameters into a MongoDB filter object.
function buildFilter({ category, q, minPrice, maxPrice, strapType }) {
  const filter = { active: true }; // hidden products never appear in the shop
  if (category) filter.category = category;
  if (strapType) filter.strapType = strapType;
  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice; // $gte = greater than or equal
    if (maxPrice !== null) filter.price.$lte = maxPrice; // $lte = less than or equal
  }
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i'); // 'i' = ignore upper/lower case
    filter.$or = [{ name: pattern }, { brand: pattern }]; // $or = either condition is enough
  }
  return filter;
}

// 1 = ascending, -1 = descending. _id is the tie-breaker so pages never repeat or skip items.
function buildSort(sort) {
  if (sort === 'price-asc') return { price: 1, _id: 1 };
  if (sort === 'price-desc') return { price: -1, _id: 1 };
  return { _id: 1 }; // default: the order products were added
}

// If someone asks for page 99 of 3, we answer with the last page (same as the frontend demo).
function computePage(total, page, limit) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(Math.max(1, page), pages);
  return { pages, current, skip: (current - 1) * limit };
}

async function listProducts(params) {
  const filter = buildFilter(params);
  const total = await Product.countDocuments(filter);
  const { pages, current, skip } = computePage(total, params.page, params.limit);

  // These two do not depend on each other, so they run at the same time.
  const [items, straps] = await Promise.all([
    Product.find(filter).sort(buildSort(params.sort)).skip(skip).limit(params.limit),
    // Strap types that exist in the whole category (used to build the filter buttons).
    Product.distinct('strapType', { active: true, ...(params.category ? { category: params.category } : {}) }),
  ]);

  return { items, total, page: current, pages, limit: params.limit, facets: { straps: straps.filter(Boolean) } };
}

async function getBySlug(slug) {
  const product = await Product.findOne({ slug, active: true });
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

async function getRelated(slug, count = 4) {
  const product = await getBySlug(slug);
  return Product.find({ category: product.category, active: true, _id: { $ne: product._id } })
    .sort({ _id: 1 })
    .limit(count);
}

// { men: 15, women: 15, smart: 10 } - a category with no products shows 0.
async function countByCategory() {
  const rows = await Product.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(Product.CATEGORIES.map((c) => [c, 0]));
  rows.forEach((r) => {
    counts[r._id] = r.count;
  });
  return counts;
}

module.exports = { listProducts, getBySlug, getRelated, countByCategory, buildFilter, buildSort, computePage, escapeRegex };
