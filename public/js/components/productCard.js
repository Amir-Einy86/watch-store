// Product card: image, name, price, wishlist heart (top start) and quick add (top end).
import { el } from './dom.js';
import { icon } from './icons.js';
import { formatNumber } from '../services/format.js';
import { toast } from './toast.js';
import * as cart from '../services/cartService.js';
import * as wishlist from '../services/wishlistService.js';

let listening = false;

function syncHearts() {
  document.querySelectorAll('[data-heart]').forEach((btn) => {
    const on = wishlist.has(btn.dataset.heart);
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-on', on);
  });
}

function listenOnce() {
  if (listening) return;
  listening = true;
  window.addEventListener('wishlist:change', syncHearts);
}

export function productMedia(p, { width = 240, height = 280 } = {}) {
  if (p.image) {
    return el('img', { src: p.image, alt: p.name, loading: 'lazy', decoding: 'async', width, height });
  }
  // No photo yet (smart watches): show an image icon instead.
  return el('span', { class: 'media-placeholder', role: 'img', 'aria-label': `تصویر ${p.name} هنوز اضافه نشده`, html: icon('image', 'icon--xl') });
}

/** Small label in the top corner, only from real (sample) data: low or no stock. */
function stockBadge(stock) {
  if (stock <= 0) return { text: 'ناموجود', cls: 'product-card__badge--muted' };
  if (stock <= 3) return { text: 'رو به اتمام', cls: '' };
  return null;
}

export function productCard(p) {
  listenOnce();
  const out = p.stock <= 0;
  const wished = wishlist.has(p.id);
  const badge = stockBadge(p.stock);
  const categoryTitle = window.SITE?.categories?.[p.category]?.titleFa || '';

  const heart = el('button', {
    type: 'button',
    class: `card-btn card-btn--heart${wished ? ' is-on' : ''}`,
    'data-heart': p.id,
    'aria-pressed': String(wished),
    'aria-label': `علاقه‌مندی: ${p.name}`,
    html: icon('heart'),
    onclick: () => {
      const on = wishlist.toggle(p.id);
      toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد', on ? 'success' : 'info');
    },
  });

  const addToCart = el('button', {
    type: 'button',
    class: 'product-card__cart',
    'aria-label': out ? `${p.name} ناموجود است` : `افزودن ${p.name} به سبد خرید`,
    disabled: out,
    onclick: () => {
      const res = cart.add(p.id, 1);
      if (res.ok) toast('به سبد خرید اضافه شد', 'success');
      else if (res.reason === 'limit') toast(`حداکثر تعداد مجاز این محصول در سبد ${res.qty} عدد است`, 'info');
      else toast('این محصول ناموجود است', 'error');
    },
  }, [el('span', { html: icon('bag') }), el('span', { text: out ? 'ناموجود' : 'افزودن به سبد' })]);

  const view = el('a', {
    class: 'product-card__view',
    href: `/product/${p.slug}`,
    'aria-label': `مشاهده ${p.name}`,
    html: icon('eye'),
  });

  const link = el('a', { class: 'product-card__link', href: `/product/${p.slug}` }, [
    el('span', { class: 'product-card__media' }, productMedia(p)),
    el('h3', { class: 'product-card__name', text: p.name }),
    el('p', { class: 'product-card__sub', text: categoryTitle }),
    el('p', { class: `product-card__price${out ? ' is-out' : ''}` }, out
      ? [el('span', { class: 'product-card__num', text: 'ناموجود' })]
      : [el('span', { class: 'product-card__num', text: formatNumber(p.price) }), el('span', { class: 'product-card__unit', text: window.SITE?.currency || 'تومان' })]),
  ]);

  return el('article', { class: 'product-card', 'data-id': p.id }, [
    badge ? el('span', { class: `product-card__badge ${badge.cls}`, text: badge.text }) : null,
    heart,
    link,
    el('div', { class: 'product-card__actions' }, [addToCart, view]),
  ]);
}
