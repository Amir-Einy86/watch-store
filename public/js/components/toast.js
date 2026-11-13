// Small toast messages (success / error / info).
import { el, qs } from './dom.js';

export function toast(message, type = 'info') {
  const root = qs('[data-toast-root]');
  if (!root) return;
  const node = el('div', { class: `toast toast--${type}`, text: message });
  root.append(node);
  requestAnimationFrame(() => node.classList.add('is-visible'));
  setTimeout(() => {
    node.classList.remove('is-visible');
    setTimeout(() => node.remove(), 250);
  }, 2800);
}
