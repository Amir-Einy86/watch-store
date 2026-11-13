// Product data access layer. The UI only talks to this file, never to data/products.js.
// In the backend phase the bodies of these functions call the REST API (fetch) instead of
// reading demo data; their inputs and outputs stay the same, so the UI does not change.
//
//   listProducts({ category, q, minPrice, maxPrice, strapType, sort, page, limit })
//     -> { items, total, page, pages, limit, facets: { straps: [...] } }
//   Filters are applied BEFORE pagination, and totals/pages are computed from the filtered list.
import { PRODUCTS, CATEGORY_ORDER } from '../data/products.js';
import { load as loadAdmin } from './adminStore.js';
import { normalizeDigits } from './format.js';

export const PAGE_SIZE = 5;
const LATENCY_MS = 180; // simulates a network request so loading states are visible
const wait = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

const FEATURED_IDS = ['men-08', 'women-04', 'men-02', 'women-01', 'men-04', 'women-03', 'men-01', 'women-09'];

/** Demo catalog = demo data + edits/additions made in the (demo) admin panel. */
export function catalogSync({ includeInactive = false } = {}) {
  const admin = loadAdmin();
  const base = PRODUCTS.map((p) => ({ ...p, ...(admin.edits[p.id] || {}) }));
  const all = [...base, ...admin.added];
  return includeInactive ? all : all.filter((p) => p.active);
}

export const getProductSync = (id) => catalogSync({ includeInactive: true }).find((p) => p.id === id) || null;

export function countByCategory() {
  const counts = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0]));
  catalogSync().forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return counts;
}

export async function listProducts(params = {}) {
  await wait();
  const { category = '', q = '', minPrice = null, maxPrice = null, strapType = '', sort = '', page = 1, limit = PAGE_SIZE } = params;

  const inCategory = catalogSync().filter((p) => !category || p.category === category);
  const straps = [...new Set(inCategory.map((p) => p.strapType).filter(Boolean))];

  const needle = normalizeDigits(q).trim().toLowerCase();
  let items = inCategory.filter((p) => {
    if (needle && !`${p.name} ${p.brand || ''}`.toLowerCase().includes(needle)) return false;
    if (minPrice !== null && p.price < minPrice) return false;
    if (maxPrice !== null && p.price > maxPrice) return false;
    if (strapType && p.strapType !== strapType) return false;
    return true;
  });

  if (sort === 'price-asc') items = [...items].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') items = [...items].sort((a, b) => b.price - a.price);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const start = (current - 1) * limit;

  return { items: items.slice(start, start + limit), total, page: current, pages, limit, facets: { straps } };
}

export async function getProductBySlug(slug) {
  await wait(120);
  return catalogSync().find((p) => p.slug === slug) || null;
}

export async function getFeatured(count = 8) {
  await wait(120);
  const all = catalogSync();
  return FEATURED_IDS.map((id) => all.find((p) => p.id === id)).filter(Boolean).slice(0, count);
}

export async function getRelated(product, count = 4) {
  await wait(120);
  return catalogSync()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, count);
}

export async function searchProducts(q, limit = 6) {
  const needle = normalizeDigits(q).trim().toLowerCase();
  if (!needle) return [];
  return catalogSync()
    .filter((p) => `${p.name} ${p.brand || ''}`.toLowerCase().includes(needle))
    .slice(0, limit);
}
