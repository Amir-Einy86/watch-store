// Demo "database" for the admin panel, kept in localStorage.
// Edits made in the admin panel are applied to the storefront too, so the demo feels connected.
import { readJSON, writeJSON } from './storage.js';

const KEY = 'timeless.admin';
const empty = () => ({ edits: {}, added: [], orderStatus: {} });

export function load() {
  const data = readJSON(KEY, null);
  return data && typeof data === 'object' ? { ...empty(), ...data } : empty();
}

export function save(data) {
  writeJSON(KEY, data);
  window.dispatchEvent(new CustomEvent('admin:change'));
}

export function updateProduct(id, patch) {
  const data = load();
  const added = data.added.find((p) => p.id === id);
  if (added) Object.assign(added, patch);
  else data.edits[id] = { ...(data.edits[id] || {}), ...patch };
  save(data);
}

export function addProduct(product) {
  const data = load();
  data.added.push(product);
  save(data);
}

export function setOrderStatus(orderId, status) {
  const data = load();
  data.orderStatus[orderId] = status;
  save(data);
}
