// Admin panel (DEMO UI). Data lives in localStorage (services/adminStore.js) and is only
// meant to show how the panel will look and behave. Real admin login, roles and permissions
// are server-side work in the backend phase; hiding buttons here is not access control.
import { qs, el } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { productMedia } from '../components/productCard.js';
import { toast } from '../components/toast.js';
import { catalogSync } from '../services/productService.js';
import * as store from '../services/adminStore.js';
import { PRODUCTS, STRAP_LABELS } from '../data/products.js';
import { buildOrders, ORDER_STATUSES } from '../data/orders.js';
import { formatToman, formatNumber, formatDate, parseAmount, maskPhone } from '../services/format.js';

const LOW_STOCK = 4; // fewer than this = "low"
const statusLabel = (key) => ORDER_STATUSES.find((s) => s.key === key)?.label || key;
const allProducts = () => catalogSync({ includeInactive: true });
const categoryTitle = (key) => window.SITE.categories[key]?.titleFa || key;

/** Demo orders always use the ORIGINAL catalog prices, like a real order snapshot would. */
function getOrders() {
  const overrides = store.load().orderStatus;
  return buildOrders((id) => PRODUCTS.find((p) => p.id === id)).map((o) => ({ ...o, status: overrides[o.id] || o.status }));
}

function pill(text, tone) {
  return el('span', { class: `pill pill--${tone}`, text });
}
const stockPill = (stock) => (stock <= 0 ? pill('ناموجود', 'danger') : stock < LOW_STOCK ? pill('کم‌موجود', 'warn') : pill('موجود', 'ok'));
const orderTone = { new: 'info', processing: 'warn', shipped: 'info', delivered: 'ok', canceled: 'danger' };

function table(headers, rows, { empty = 'موردی برای نمایش وجود ندارد.' } = {}) {
  if (!rows.length) return el('p', { class: 'table-empty', text: empty });
  return el('table', { class: 'table' }, [
    el('thead', {}, el('tr', {}, headers.map((h) => el('th', { scope: 'col', text: h })))),
    el('tbody', {}, rows.map((cells) => el('tr', {}, cells.map((c) => el('td', {}, c))))),
  ]);
}

/* ---------------- Dashboard ---------------- */
function initDashboard() {
  const orders = getOrders();
  const sold = orders.filter((o) => o.status !== 'canceled');
  const products = allProducts().filter((p) => p.active);
  const low = products.filter((p) => p.stock > 0 && p.stock < LOW_STOCK).length;
  const out = products.filter((p) => p.stock <= 0).length;

  const kpi = (label, value, note) => el('div', { class: 'kpi' }, [el('p', { class: 'kpi__label', text: label }), el('p', { class: 'kpi__value', text: value }), note ? el('p', { class: 'kpi__note', text: note }) : null]);
  qs('[data-kpis]').replaceChildren(
    kpi('فروش نمونه', formatToman(sold.reduce((s, o) => s + o.total, 0)), 'بدون سفارش‌های لغوشده'),
    kpi('تعداد سفارش', formatNumber(orders.length), `${formatNumber(orders.filter((o) => o.status === 'new').length)} سفارش جدید`),
    kpi('محصولات فعال', formatNumber(products.length)),
    kpi('نیازمند توجه', formatNumber(low + out), `${formatNumber(low)} کم‌موجود · ${formatNumber(out)} ناموجود`)
  );

  const max = Math.max(1, ...ORDER_STATUSES.map((s) => orders.filter((o) => o.status === s.key).length));
  qs('[data-status-bars]').replaceChildren(
    ...ORDER_STATUSES.map((s) => {
      const n = orders.filter((o) => o.status === s.key).length;
      const bar = el('span', { class: `bar__fill bar__fill--${orderTone[s.key]}` });
      bar.style.width = `${(n / max) * 100}%`;
      return el('div', { class: 'bar' }, [el('span', { class: 'bar__label', text: s.label }), el('span', { class: 'bar__track' }, bar), el('span', { class: 'bar__n', text: formatNumber(n) })]);
    })
  );

  const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  qs('[data-recent-orders]').replaceChildren(
    table(['سفارش', 'مبلغ', 'وضعیت'], recent.map((o) => [el('span', { class: 'ltr', text: o.id }), formatToman(o.total), pill(statusLabel(o.status), orderTone[o.status])]))
  );
}

/* ---------------- Products ---------------- */
function initProducts() {
  const tableBox = qs('[data-products-table]');
  const qInput = qs('[data-admin-q]');
  const catSelect = qs('[data-admin-cat]');
  const dialog = qs('[data-product-dialog]');
  const form = qs('[data-product-form]');
  const err = qs('[data-dialog-error]');
  const title = qs('[data-dialog-title]');
  let editingId = null;

  function render() {
    const needle = qInput.value.trim().toLowerCase();
    const rows = allProducts()
      .filter((p) => (!catSelect.value || p.category === catSelect.value) && (!needle || p.name.toLowerCase().includes(needle)))
      .map((p) => {
        const toggle = el('button', {
          type: 'button',
          class: `switch${p.active ? ' is-on' : ''}`,
          role: 'switch',
          'aria-checked': String(p.active),
          'aria-label': `فعال بودن ${p.name}`,
          onclick: () => {
            store.updateProduct(p.id, { active: !p.active });
            toast(p.active ? 'محصول غیرفعال شد و در فروشگاه دیده نمی‌شود' : 'محصول فعال شد', 'info');
            render();
          },
        });
        const edit = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'ویرایش', onclick: () => openDialog(p) });
        return [
          el('span', { class: 'thumb' }, productMedia(p, { width: 36, height: 44 })),
          el('span', { class: 'ltr strong', text: p.name }),
          categoryTitle(p.category),
          p.strapType ? STRAP_LABELS[p.strapType] : '—',
          formatToman(p.price),
          el('span', {}, [formatNumber(p.stock), ' ', stockPill(p.stock)]),
          toggle,
          edit,
        ];
      });
    tableBox.replaceChildren(table(['', 'نام', 'دسته', 'بند', 'قیمت', 'موجودی', 'فعال', ''], rows, { empty: 'محصولی با این فیلتر پیدا نشد.' }));
  }

  function openDialog(p) {
    editingId = p ? p.id : null;
    title.textContent = p ? 'ویرایش محصول' : 'افزودن محصول';
    form.elements.name.value = p ? p.name : '';
    form.elements.category.value = p ? p.category : 'men';
    form.elements.strapType.value = p?.strapType || '';
    form.elements.price.value = p ? formatNumber(p.price) : '';
    form.elements.stock.value = p ? formatNumber(p.stock) : '';
    err.textContent = '';
    dialog.showModal();
    form.elements.name.focus();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    err.textContent = '';
    const name = form.elements.name.value.trim();
    // a minus sign must be rejected, not silently dropped (parseAmount keeps digits only)
    const hasMinus = (v) => /[-−–]/.test(v);
    const price = hasMinus(form.elements.price.value) ? null : parseAmount(form.elements.price.value);
    const stock = hasMinus(form.elements.stock.value) ? null : parseAmount(form.elements.stock.value);
    if (name.length < 2 || name.length > 80) return fail('نام باید بین ۲ تا ۸۰ حرف باشد.', form.elements.name);
    if (price === null || price <= 0 || price > 10_000_000_000) return fail('قیمت را به‌صورت عدد مثبت وارد کنید.', form.elements.price);
    if (stock === null || stock > 9999) return fail('موجودی باید عددی بین ۰ تا ۹۹۹۹ باشد.', form.elements.stock);
    const data = { name, category: form.elements.category.value, strapType: form.elements.strapType.value || null, price, stock };
    if (editingId) {
      store.updateProduct(editingId, data);
      toast('تغییرات ذخیره شد', 'success');
    } else {
      const id = `custom-${Date.now().toString(36)}`;
      store.addProduct({ id, slug: id, brand: null, image: null, description: null, active: true, ...data });
      toast('محصول اضافه شد', 'success');
    }
    dialog.close();
    render();
  });
  function fail(message, field) {
    err.textContent = message;
    field.focus();
  }

  qs('[data-dialog-cancel]').addEventListener('click', () => dialog.close());
  qs('[data-add-product]').addEventListener('click', () => openDialog(null));
  qInput.addEventListener('input', render);
  catSelect.addEventListener('change', render);
  render();
}

/* ---------------- Inventory ---------------- */
function initInventory() {
  const box = qs('[data-inventory-table]');
  function render() {
    const rows = allProducts().map((p) => {
      const status = el('span', {}, stockPill(p.stock));
      const input = el('input', { class: 'stock-input', type: 'number', min: '0', max: '9999', value: String(p.stock), 'aria-label': `موجودی ${p.name}`, inputmode: 'numeric' });
      input.addEventListener('change', () => {
        const n = Number(input.value);
        if (!Number.isInteger(n) || n < 0 || n > 9999) {
          input.value = String(p.stock);
          toast('موجودی باید عدد صحیح بین ۰ تا ۹۹۹۹ باشد', 'error');
          return;
        }
        store.updateProduct(p.id, { stock: n });
        p.stock = n;
        status.replaceChildren(stockPill(n));
        toast('موجودی ذخیره شد', 'success');
      });
      return [el('span', { class: 'ltr strong', text: p.name }), categoryTitle(p.category), input, status, p.active ? 'فعال' : 'غیرفعال'];
    });
    box.replaceChildren(table(['نام', 'دسته', 'موجودی', 'وضعیت', 'نمایش'], rows));
  }
  render();
}

/* ---------------- Orders ---------------- */
function initOrders() {
  const box = qs('[data-orders-table]');
  const filter = qs('[data-order-filter]');
  ORDER_STATUSES.forEach((s) => filter.append(el('option', { value: s.key, text: s.label })));

  function render() {
    const orders = getOrders()
      .filter((o) => !filter.value || o.status === filter.value)
      .sort((a, b) => b.createdAt - a.createdAt);
    const rows = orders.map((o) => {
      const select = el(
        'select',
        { class: 'status-select', 'aria-label': `وضعیت سفارش ${o.id}` },
        ORDER_STATUSES.map((s) => el('option', { value: s.key, text: s.label, selected: s.key === o.status }))
      );
      select.addEventListener('change', () => {
        store.setOrderStatus(o.id, select.value);
        toast(`وضعیت ${o.id} به «${statusLabel(select.value)}» تغییر کرد`, 'success');
        render();
      });
      return [
        el('span', { class: 'ltr strong', text: o.id }),
        el('span', { class: 'ltr', text: maskPhone(o.phone) }),
        el('span', { class: 'items', text: o.items.map((i) => `${i.name} × ${formatNumber(i.qty)}`).join('، ') }),
        formatToman(o.total),
        formatDate(o.createdAt),
        el('span', { class: 'status-cell' }, [pill(statusLabel(o.status), orderTone[o.status]), select]),
      ];
    });
    box.replaceChildren(table(['سفارش', 'مشتری', 'اقلام', 'مبلغ', 'تاریخ', 'وضعیت'], rows, { empty: 'سفارشی با این وضعیت وجود ندارد.' }));
  }
  filter.addEventListener('change', render);
  render();
}

export function init(page) {
  const pages = { 'admin-dashboard': initDashboard, 'admin-products': initProducts, 'admin-inventory': initInventory, 'admin-orders': initOrders };
  (pages[page] || (() => {}))();
}
