// Product detail page: image, name, price, stock, quantity, add to cart, wishlist, related products.
// Only facts that exist in the data are shown (no invented warranty, water resistance, etc.).
import { qs, el } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { productMedia, productCard } from '../components/productCard.js';
import { toast } from '../components/toast.js';
import { errorState } from '../components/states.js';
import { getProductBySlug, getRelated } from '../services/productService.js';
import { STRAP_LABELS } from '../data/products.js';
import { formatToman, formatNumber } from '../services/format.js';
import * as cart from '../services/cartService.js';
import * as wishlist from '../services/wishlistService.js';

function stockInfo(p) {
  if (p.stock <= 0) return { text: 'ناموجود', cls: 'is-out' };
  if (p.stock <= 3) return { text: `تنها ${formatNumber(p.stock)} عدد باقی مانده`, cls: 'is-low' };
  return { text: 'موجود', cls: 'is-in' };
}

function specRows(p) {
  const rows = [['دسته‌بندی', window.SITE.categories[p.category]?.titleFa]];
  if (p.brand) rows.unshift(['برند', p.brand]);
  if (p.strapType) rows.push(['نوع بند', STRAP_LABELS[p.strapType]]);
  return rows.filter(([, v]) => v);
}

function buildQuantity(max) {
  let qty = 1;
  const value = el('output', { class: 'qty__value', 'aria-live': 'polite', text: formatNumber(qty) });
  const minus = el('button', { type: 'button', class: 'qty__btn', 'aria-label': 'کم کردن تعداد', html: icon('minus') });
  const plus = el('button', { type: 'button', class: 'qty__btn', 'aria-label': 'زیاد کردن تعداد', html: icon('plus') });
  const sync = () => {
    value.textContent = formatNumber(qty);
    minus.disabled = qty <= 1;
    plus.disabled = qty >= max;
  };
  minus.addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    sync();
  });
  plus.addEventListener('click', () => {
    qty = Math.min(max, qty + 1);
    sync();
  });
  sync();
  return { node: el('div', { class: 'qty', role: 'group', 'aria-label': 'تعداد' }, [minus, value, plus]), get: () => qty };
}

function renderProduct(p) {
  const stock = stockInfo(p);
  const out = p.stock <= 0;
  const max = Math.min(cart.MAX_QTY, p.stock);
  const quantity = buildQuantity(Math.max(1, max));

  const heart = el('button', {
    type: 'button',
    class: `heart-btn${wishlist.has(p.id) ? ' is-on' : ''}`,
    'aria-pressed': String(wishlist.has(p.id)),
    'aria-label': 'افزودن به علاقه‌مندی‌ها',
    html: icon('heart'),
  });
  heart.addEventListener('click', () => {
    const on = wishlist.toggle(p.id);
    heart.classList.toggle('is-on', on);
    heart.setAttribute('aria-pressed', String(on));
    toast(on ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد', on ? 'success' : 'info');
  });

  const add = el('button', { type: 'button', class: 'btn btn--dark btn--wide', disabled: out, text: out ? 'ناموجود' : 'افزودن به سبد خرید' });
  add.addEventListener('click', () => {
    const res = cart.add(p.id, quantity.get());
    if (res.ok) toast('به سبد خرید اضافه شد', 'success');
    else if (res.reason === 'limit') toast(`حداکثر تعداد مجاز این محصول در سبد ${formatNumber(res.qty)} عدد است`, 'info');
    else toast('این محصول ناموجود است', 'error');
  });

  return el('div', { class: 'product-detail' }, [
    el('div', { class: 'product-detail__media' }, productMedia(p, { width: 420, height: 520 })),
    el('div', { class: 'product-detail__info' }, [
      p.brand ? el('p', { class: 'eyebrow ltr', text: p.brand }) : null,
      el('h1', { class: 'product-detail__name', text: p.name }),
      el('p', { class: 'product-detail__price', text: formatToman(p.price) }),
      el('p', { class: `stock ${stock.cls}`, text: stock.text }),
      el('p', { class: 'product-detail__desc', text: p.description || 'توضیحات این محصول به‌زودی اضافه می‌شود.' }),
      el(
        'dl',
        { class: 'specs' },
        specRows(p).flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])
      ),
      el('div', { class: 'product-detail__buy' }, [out ? null : quantity.node, add, heart]),
      el('p', { class: 'demo-note demo-note--inline' }, [
        el('span', { html: icon('info') }),
        el('span', { text: 'قیمت و موجودی نمونه‌اند و فقط برای نمایش استفاده می‌شوند.' }),
      ]),
    ]),
  ]);
}

export async function init() {
  const root = qs('[data-product-root]');
  const view = qs('[data-product-view]');
  const crumb = qs('[data-breadcrumb]');
  const slug = document.body.dataset.slug;

  try {
    const p = await getProductBySlug(slug);
    if (!p) {
      view.replaceChildren(
        el('div', { class: 'state__box' }, [
          el('h1', { class: 'state__title', text: 'این محصول پیدا نشد' }),
          el('p', { class: 'state__text', text: 'ممکن است حذف یا غیرفعال شده باشد.' }),
          el('a', { class: 'btn btn--dark', href: '/', text: 'بازگشت به خانه' }),
        ])
      );
      return;
    }
    const cat = window.SITE.categories[p.category];
    document.title = `${p.name} | ${window.SITE.brand.name}`;
    document.body.dataset.theme = p.category;
    crumb.replaceChildren(
      el('a', { href: '/', text: 'خانه' }),
      el('span', { 'aria-hidden': 'true', text: '/' }),
      el('a', { href: `/watches/${p.category}`, text: cat.titleFa }),
      el('span', { 'aria-hidden': 'true', text: '/' }),
      el('span', { 'aria-current': 'page', class: 'ltr', text: p.name })
    );
    view.replaceChildren(renderProduct(p));

    const related = await getRelated(p, 4);
    if (related.length) {
      qs('[data-related-grid]').replaceChildren(...related.map(productCard));
      qs('[data-related]').hidden = false;
    }
  } catch (err) {
    console.error(err);
    view.replaceChildren(errorState({ onRetry: () => location.reload() }));
  } finally {
    root.setAttribute('aria-busy', 'false');
  }
}
