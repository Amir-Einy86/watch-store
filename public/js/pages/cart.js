// Cart page (DEMO): list, change quantity, remove, totals, empty state.
// Totals here are for display only; the real total is calculated on the server later.
import { qs, el } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { productMedia } from '../components/productCard.js';
import { toast } from '../components/toast.js';
import { getProductSync } from '../services/productService.js';
import { formatToman, formatNumber } from '../services/format.js';
import * as cart from '../services/cartService.js';

function emptyCart() {
  return el('div', { class: 'state__box' }, [
    el('span', { class: 'state__icon', html: icon('bag', 'icon--lg') }),
    el('h2', { class: 'state__title', text: 'سبد خرید شما خالی است' }),
    el('p', { class: 'state__text', text: 'ساعت مورد علاقه‌تان را انتخاب کنید و به سبد اضافه کنید.' }),
    el('div', { class: 'state__actions' }, el('a', { class: 'btn btn--dark', href: '/#collections', text: 'دیدن مجموعه‌ها' })),
  ]);
}

function lineNode(line, p, rerender) {
  const limit = Math.min(cart.MAX_QTY, p.stock);
  const minus = el('button', { type: 'button', class: 'qty__btn', 'aria-label': `کم کردن تعداد ${p.name}`, disabled: line.qty <= 1, html: icon('minus') });
  const plus = el('button', { type: 'button', class: 'qty__btn', 'aria-label': `زیاد کردن تعداد ${p.name}`, disabled: line.qty >= limit, html: icon('plus') });
  minus.addEventListener('click', () => {
    cart.setQty(p.id, line.qty - 1);
    rerender();
  });
  plus.addEventListener('click', () => {
    if (line.qty >= limit) return toast(`حداکثر تعداد مجاز ${formatNumber(limit)} عدد است`, 'info');
    cart.setQty(p.id, line.qty + 1);
    rerender();
  });
  const remove = el('button', { type: 'button', class: 'cart-line__remove', 'aria-label': `حذف ${p.name} از سبد`, html: `${icon('trash')}<span>حذف</span>` });
  remove.addEventListener('click', () => {
    cart.remove(p.id);
    toast('از سبد خرید حذف شد', 'info');
    rerender();
  });

  return el('li', { class: 'cart-line' }, [
    el('a', { class: 'cart-line__media', href: `/product/${p.slug}`, 'aria-hidden': 'true', tabindex: '-1' }, productMedia(p, { width: 84, height: 100 })),
    el('div', { class: 'cart-line__body' }, [
      el('a', { class: 'cart-line__name ltr', href: `/product/${p.slug}`, text: p.name }),
      el('p', { class: 'cart-line__unit', text: formatToman(p.price) }),
      el('div', { class: 'cart-line__ctrl' }, [el('div', { class: 'qty', role: 'group', 'aria-label': 'تعداد' }, [minus, el('output', { class: 'qty__value', text: formatNumber(line.qty) }), plus]), remove]),
    ]),
    el('p', { class: 'cart-line__total', text: formatToman(p.price * line.qty) }),
  ]);
}

export function init() {
  const root = qs('[data-cart-root]');

  function render() {
    // Drop lines whose product no longer exists or is inactive.
    const lines = cart
      .getItems()
      .map((line) => ({ line, p: getProductSync(line.id) }))
      .filter(({ p }) => p && p.active);
    cart.getItems().forEach((i) => !lines.some(({ line }) => line.id === i.id) && cart.remove(i.id));

    if (!lines.length) {
      root.replaceChildren(emptyCart());
      return;
    }
    const total = lines.reduce((sum, { line, p }) => sum + p.price * line.qty, 0);
    const units = lines.reduce((sum, { line }) => sum + line.qty, 0);

    const clear = el('button', { type: 'button', class: 'link-btn cart__clear', text: 'خالی کردن سبد' });
    clear.addEventListener('click', () => {
      cart.clear();
      toast('سبد خرید خالی شد', 'info');
      render();
    });
    const checkout = el('button', { type: 'button', class: 'btn btn--dark btn--wide', text: 'ادامه خرید (نمایشی)' });
    checkout.addEventListener('click', () => toast('ثبت سفارش واقعی در مرحله بک‌اند ساخته می‌شود.', 'info'));

    root.replaceChildren(
      el('div', { class: 'cart' }, [
        el('div', { class: 'cart__lines' }, [el('ul', {}, lines.map(({ line, p }) => lineNode(line, p, render))), el('div', { class: 'cart__tools' }, clear)]),
        el('aside', { class: 'cart-summary', 'aria-label': 'خلاصه سبد' }, [
          el('h2', { class: 'cart-summary__title', text: 'خلاصه سفارش' }),
          el('p', { class: 'cart-summary__row' }, [el('span', { text: 'تعداد کالا' }), el('strong', { text: formatNumber(units) })]),
          el('p', { class: 'cart-summary__row' }, [el('span', { text: 'هزینه ارسال' }), el('span', { class: 'muted', text: 'در مرحله بعد' })]),
          el('p', { class: 'cart-summary__row cart-summary__row--total' }, [el('span', { text: 'جمع کل' }), el('strong', { text: formatToman(total) })]),
          checkout,
          el('a', { class: 'link-arrow cart-summary__more', href: '/#collections' }, ['ادامه خرید ', el('span', { html: icon('arrow-right') })]),
        ]),
      ])
    );
  }

  window.addEventListener('storage', render);
  render();
}
