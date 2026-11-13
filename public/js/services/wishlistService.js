// DEMO wishlist stored in localStorage.
import { readJSON, writeJSON } from './storage.js';

const KEY = 'timeless.wishlist';
const emit = () => window.dispatchEvent(new CustomEvent('wishlist:change'));

export function list() {
  const ids = readJSON(KEY, []);
  return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
}

export const has = (id) => list().includes(id);
export const count = () => list().length;

/** Toggles a product and returns true if it is now in the wishlist. */
export function toggle(id) {
  const ids = list();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  writeJSON(KEY, next);
  emit();
  return next.includes(id);
}
