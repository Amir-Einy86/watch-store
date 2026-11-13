// DEMO cart stored in localStorage. The real cart (stock checks and totals) lives on the server later.
import { readJSON, writeJSON } from './storage.js';
import { getProductSync } from './productService.js';

const KEY = 'timeless.cart';
export const MAX_QTY = 10;

const emit = () => window.dispatchEvent(new CustomEvent('cart:change'));

export function getItems() {
  const items = readJSON(KEY, []);
  return Array.isArray(items) ? items.filter((i) => i && typeof i.id === 'string' && i.qty > 0) : [];
}

const save = (items) => {
  writeJSON(KEY, items);
  emit();
};

export const count = () => getItems().reduce((sum, i) => sum + i.qty, 0);

function limitFor(id) {
  const p = getProductSync(id);
  return p ? Math.min(MAX_QTY, p.stock) : 0;
}

/** Adds qty of a product. Returns { ok, reason?, qty? }. */
export function add(id, qty = 1) {
  const limit = limitFor(id);
  if (limit <= 0) return { ok: false, reason: 'out-of-stock' };
  const items = getItems();
  const line = items.find((i) => i.id === id);
  const next = (line ? line.qty : 0) + qty;
  if (next > limit) {
    if (line) line.qty = limit;
    else items.push({ id, qty: limit });
    save(items);
    return { ok: false, reason: 'limit', qty: limit };
  }
  if (line) line.qty = next;
  else items.push({ id, qty: next });
  save(items);
  return { ok: true, qty: next };
}

export function setQty(id, qty) {
  const limit = limitFor(id);
  const items = getItems();
  const line = items.find((i) => i.id === id);
  if (!line) return;
  line.qty = Math.max(1, Math.min(limit || 1, qty));
  save(items);
}

export function remove(id) {
  save(getItems().filter((i) => i.id !== id));
}

export function clear() {
  save([]);
}
