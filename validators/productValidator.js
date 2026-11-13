// Validation of the product API inputs. Everything that comes from the URL is untrusted text.
// Rules: only plain strings are accepted (never arrays/objects), numbers are checked, lists of
// allowed values are fixed. This also blocks "NoSQL injection" (sending {"$ne": ...} in a query).
const { CATEGORIES, STRAP_TYPES } = require('../models/Product');

const SORTS = ['price-asc', 'price-desc'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFAULT_LIMIT = 5; // 5 products per page
const MAX_LIMIT = 20;

// Persian/Arabic digits -> 0-9, so "۱۲" works like "12".
function normalizeDigits(s) {
  return s
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

// Reads one text parameter. Missing -> ''. Not a plain string (e.g. ?q[$ne]=1) -> error.
function readText(raw, field, errors, maxLength = 60) {
  if (raw === undefined) return '';
  if (typeof raw !== 'string') {
    errors.push({ field, message: `${field} must be plain text` });
    return '';
  }
  const text = raw.trim();
  if (text.length > maxLength) errors.push({ field, message: `${field} is too long (max ${maxLength})` });
  return text;
}

// Reads a whole-number parameter. Missing/empty -> null.
function readInt(raw, field, errors, { min, max }) {
  if (raw === undefined || raw === '') return null;
  if (typeof raw !== 'string') {
    errors.push({ field, message: `${field} must be a number` });
    return null;
  }
  const text = normalizeDigits(raw.trim());
  if (!/^\d{1,15}$/.test(text)) {
    errors.push({ field, message: `${field} must be a whole number` });
    return null;
  }
  const n = Number(text);
  if (n < min || n > max) {
    errors.push({ field, message: `${field} must be between ${min} and ${max}` });
    return null;
  }
  return n;
}

function readChoice(raw, field, errors, allowed) {
  const text = readText(raw, field, errors, 20);
  if (text && !allowed.includes(text)) {
    errors.push({ field, message: `${field} must be one of: ${allowed.join(', ')}` });
    return '';
  }
  return text;
}

// GET /api/products?category=&q=&minPrice=&maxPrice=&strapType=&sort=&page=&limit=
function parseListQuery(req) {
  const errors = [];
  const query = req.query;

  const value = {
    category: readChoice(query.category, 'category', errors, CATEGORIES),
    q: normalizeDigits(readText(query.q, 'q', errors)),
    minPrice: readInt(query.minPrice, 'minPrice', errors, { min: 0, max: 1e12 }),
    maxPrice: readInt(query.maxPrice, 'maxPrice', errors, { min: 0, max: 1e12 }),
    strapType: readChoice(query.strapType, 'strapType', errors, STRAP_TYPES),
    sort: readChoice(query.sort, 'sort', errors, SORTS),
    page: readInt(query.page, 'page', errors, { min: 1, max: 100000 }) ?? 1,
    limit: readInt(query.limit, 'limit', errors, { min: 1, max: MAX_LIMIT }) ?? DEFAULT_LIMIT,
  };

  if (value.minPrice !== null && value.maxPrice !== null && value.minPrice > value.maxPrice) {
    errors.push({ field: 'minPrice', message: 'minPrice cannot be bigger than maxPrice' });
  }
  return { value, errors };
}

// GET /api/products/:slug  and  /api/products/:slug/related
function parseSlug(req) {
  const slug = req.params.slug;
  if (typeof slug !== 'string' || slug.length > 80 || !SLUG_RE.test(slug)) {
    return { value: null, errors: [{ field: 'slug', message: 'slug is not valid' }] };
  }
  return { value: { slug }, errors: [] };
}

module.exports = { parseListQuery, parseSlug, DEFAULT_LIMIT, MAX_LIMIT };
// Validation rules for category, page, price range and strap filters.
