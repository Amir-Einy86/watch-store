// Header behavior: live counters, compact-on-scroll, mobile menu, and the search overlay.
import { el, qs, qsa, debounce } from './dom.js';
import { formatToman, formatNumber } from '../services/format.js';
import { searchProducts } from '../services/productService.js';
import { isLoggedIn } from '../services/authService.js';
import * as cart from '../services/cartService.js';
import * as wishlist from '../services/wishlistService.js';
import { productMedia } from './productCard.js';

function initCounters() {
  const update = () => {
    const set = (sel, n) =>
      qsa(sel).forEach((node) => {
        node.textContent = formatNumber(n);
        node.hidden = n === 0;
      });
    set('[data-cart-count]', cart.count());
    set('[data-wishlist-count]', wishlist.count());
  };
  update();
  window.addEventListener('cart:change', update);
  window.addEventListener('wishlist:change', update);
  window.addEventListener('storage', update);
}

function initHeader() {
  const header = qs('[data-header]');
  const toggle = qs('[data-menu-toggle]');
  const nav = qs('[data-primary-nav]');
  if (!header) return;

  // Two thresholds (hysteresis): the compact header is ~90px shorter, so switching at a single
  // point made the page jump back across it and the header flickered open/closed in a loop.
  // The gap between the two values must stay larger than that height difference.
  const COMPACT_AT = 120;
  const EXPAND_AT = 20;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const compact = header.classList.contains('is-compact');
      if (!compact && window.scrollY > COMPACT_AT) header.classList.add('is-compact');
      else if (compact && window.scrollY < EXPAND_AT) header.classList.remove('is-compact');
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!toggle || !nav) return;
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => e.target.closest('a') && setOpen(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setOpen(false));
}

function initSearch() {
  const overlay = qs('[data-search]');
  if (!overlay) return;
  const input = qs('[data-search-input]', overlay);
  const results = qs('[data-search-results]', overlay);
  const form = qs('[data-search-form]', overlay);
  let opener = null;

  function open(trigger) {
    opener = trigger || null;
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    input.value = '';
    results.replaceChildren();
    input.focus();
  }
  function close() {
    if (overlay.hidden) return;
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    document.body.classList.remove('no-scroll');
    opener?.focus();
  }

  async function render() {
    const q = input.value.trim();
    results.replaceChildren();
    if (!q) return;
    const found = await searchProducts(q, 6);
    if (input.value.trim() !== q) return; // a newer search is running
    if (!found.length) {
      results.append(el('li', { class: 'search-overlay__empty', text: 'ساعتی با این نام پیدا نشد.' }));
      return;
    }
    found.forEach((p) =>
      results.append(
        el('li', {}, [
          el('a', { class: 'search-result', href: `/product/${p.slug}` }, [
            el('span', { class: 'search-result__img' }, productMedia(p, { width: 48, height: 56 })),
            el('span', { class: 'search-result__name', text: p.name }),
            el('span', { class: 'search-result__price', text: formatToman(p.price) }),
          ]),
        ])
      )
    );
  }

  qsa('[data-search-open]').forEach((b) => b.addEventListener('click', () => open(b)));
  qsa('[data-search-close]', overlay).forEach((b) => b.addEventListener('click', close));
  input.addEventListener('input', debounce(render, 150));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    results.querySelector('a')?.click();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const focusables = qsa('input, button, a[href]', overlay).filter((n) => !n.disabled && n.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

function initAuthLinks() {
  const update = () => {
    const on = isLoggedIn();
    qsa('[data-auth="in"]').forEach((n) => (n.hidden = !on));
    qsa('[data-auth="out"]').forEach((n) => (n.hidden = on));
  };
  update();
  window.addEventListener('storage', update);
}

export function initNavbar() {
  initAuthLinks();
  initCounters();
  initHeader();
  initSearch();
}
