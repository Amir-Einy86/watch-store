// Floating support button (bottom right) with a small panel: SMS, phone, Telegram.
// Closes with Escape or an outside click; focus returns to the button.
import { qs, qsa } from './dom.js';

export function initSupport() {
  const root = qs('[data-support]');
  if (!root) return;
  const btn = qs('[data-support-toggle]', root);
  const panel = qs('[data-support-panel]', root);

  const isOpen = () => !panel.hidden;

  function open() {
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => root.classList.add('is-open'));
    (qs('a.support__item', panel) || btn).focus();
  }
  function close({ restoreFocus = true } = {}) {
    if (!isOpen()) return;
    root.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    if (restoreFocus) btn.focus();
  }

  btn.addEventListener('click', () => (isOpen() ? close() : open()));
  qsa('[data-support-open]').forEach((b) => b.addEventListener('click', open));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  document.addEventListener('pointerdown', (e) => {
    if (isOpen() && !root.contains(e.target) && !e.target.closest('[data-support-open]')) close({ restoreFocus: false });
  });
}
