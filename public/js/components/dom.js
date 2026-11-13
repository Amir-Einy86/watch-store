// Tiny DOM helpers. Text is always inserted with textContent (never innerHTML) to avoid XSS.
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/** el('a', { class: 'x', href: '/' }, 'text' | Node | [children]) */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value; // only for trusted, static markup (icons)
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  [].concat(children).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

export const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

/** Reads/writes URL query parameters without reloading the page. */
export function readQuery() {
  return new URLSearchParams(location.search);
}

export function writeQuery(params, { replace = true } = {}) {
  const query = params.toString();
  const url = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
  try {
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
  } catch (e) {
    // Some sandboxed frames refuse the History API; the page keeps working without URL updates.
  }
}
