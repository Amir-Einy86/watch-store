// Safe wrapper around localStorage. Storage can throw (private mode, blocked cookies),
// so every read/write is guarded and falls back to memory for the current page.
const memory = new Map();

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? (memory.has(key) ? memory.get(key) : fallback) : JSON.parse(raw);
  } catch (e) {
    return memory.has(key) ? memory.get(key) : fallback;
  }
}

export function writeJSON(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* memory fallback already set */
  }
}

export function remove(key) {
  memory.delete(key);
  try {
    localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
}
