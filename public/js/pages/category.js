// Category page: filters (name, price range, strap type), sorting and 5-per-page pagination.
// All filter values live in the URL (?q=&min=&max=&strap=&sort=&page=) so they survive paging and reloads.
// Filters are applied before pagination (see services/productService.js).
import { qs, el, debounce, readQuery, writeQuery } from '../components/dom.js';
import { productCard } from '../components/productCard.js';
import { renderPagination } from '../components/pagination.js';
import { skeletonCards, emptyState, errorState } from '../components/states.js';
import { listProducts, PAGE_SIZE } from '../services/productService.js';
import { STRAP_LABELS } from '../data/products.js';
import { formatNumber, parseAmount } from '../services/format.js';

export function init() {
  const category = document.body.dataset.category;
  const form = qs('[data-filters]');
  const fQ = qs('#f-q');
  const fMin = qs('#f-min');
  const fMax = qs('#f-max');
  const fSort = qs('#f-sort');
  const strapGroup = qs('[data-strap-group]');
  const strapRow = qs('[data-strap-chips]');
  const grid = qs('[data-grid]');
  const stateBox = qs('[data-state]');
  const pager = qs('[data-pagination]');
  const countEl = qs('[data-result-count]');

  const state = { q: '', min: null, max: null, strap: '', sort: '', page: 1 };
  let seq = 0;
  let chipsBuilt = false;

  function readState() {
    const p = readQuery();
    state.q = p.get('q') || '';
    state.min = parseAmount(p.get('min'));
    state.max = parseAmount(p.get('max'));
    state.strap = Object.keys(STRAP_LABELS).includes(p.get('strap')) ? p.get('strap') : '';
    state.sort = ['price-asc', 'price-desc'].includes(p.get('sort')) ? p.get('sort') : '';
    state.page = Math.max(1, parseInt(p.get('page'), 10) || 1);
  }

  function writeState(push = false) {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.min !== null) p.set('min', String(state.min));
    if (state.max !== null) p.set('max', String(state.max));
    if (state.strap) p.set('strap', state.strap);
    if (state.sort) p.set('sort', state.sort);
    if (state.page > 1) p.set('page', String(state.page));
    writeQuery(p, { replace: !push });
  }

  function syncInputs() {
    // Never rewrite the field the user is typing in (it would move the cursor).
    const put = (input, value) => document.activeElement !== input && (input.value = value);
    put(fQ, state.q);
    put(fMin, state.min === null ? '' : formatNumber(state.min));
    put(fMax, state.max === null ? '' : formatNumber(state.max));
    fSort.value = state.sort;
    strapRow.querySelectorAll('[data-strap]').forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.strap === state.strap)));
  }

  function buildChips(straps) {
    if (chipsBuilt) return;
    chipsBuilt = true;
    if (!straps.length) return; // e.g. smart watches have no strap data yet
    strapGroup.hidden = false;
    const make = (value, label) =>
      el('button', {
        type: 'button',
        class: 'chip',
        'data-strap': value,
        'aria-pressed': String(state.strap === value),
        text: label,
        onclick: () => {
          state.strap = value;
          state.page = 1;
          afterChange();
        },
      });
    strapRow.replaceChildren(make('', 'همه'), ...straps.map((s) => make(s, STRAP_LABELS[s])));
  }

  const hasFilters = () => Boolean(state.q || state.min !== null || state.max !== null || state.strap);

  function clearAll() {
    Object.assign(state, { q: '', min: null, max: null, strap: '', sort: '', page: 1 });
    afterChange();
  }

  function showState(node) {
    stateBox.replaceChildren(node);
    stateBox.hidden = false;
    grid.replaceChildren();
    pager.hidden = true;
  }

  async function load() {
    const mine = ++seq;
    stateBox.hidden = true;
    grid.setAttribute('aria-busy', 'true');

    if (state.min !== null && state.max !== null && state.min > state.max) {
      countEl.textContent = '';
      showState(emptyState({ title: 'بازه قیمت معتبر نیست', text: 'حداقل قیمت نباید از حداکثر قیمت بیشتر باشد.', actionLabel: 'پاک کردن فیلترها', onAction: clearAll }));
      grid.setAttribute('aria-busy', 'false');
      return;
    }

    grid.replaceChildren(skeletonCards(PAGE_SIZE));
    pager.hidden = true;
    try {
      const res = await listProducts({ category, q: state.q, minPrice: state.min, maxPrice: state.max, strapType: state.strap, sort: state.sort, page: state.page, limit: PAGE_SIZE });
      if (mine !== seq) return;
      state.page = res.page;
      buildChips(res.facets.straps);
      syncInputs();

      if (!res.total) {
        countEl.textContent = '۰ ساعت';
        showState(
          emptyState({
            text: hasFilters() ? 'فیلترها را تغییر دهید یا همه را پاک کنید.' : 'در این دسته هنوز ساعتی ثبت نشده است.',
            actionLabel: hasFilters() ? 'پاک کردن فیلترها' : null,
            onAction: clearAll,
          })
        );
        return;
      }
      countEl.textContent = `${formatNumber(res.total)} ساعت · صفحه ${formatNumber(res.page)} از ${formatNumber(res.pages)}`;
      grid.replaceChildren(...res.items.map(productCard));
      renderPagination(pager, {
        page: res.page,
        pages: res.pages,
        onChange: (n) => {
          state.page = n;
          writeState(true);
          load();
          window.scrollTo({ top: qs('.catalog-page').offsetTop - 120, behavior: 'smooth' });
        },
      });
    } catch (err) {
      if (mine !== seq) return;
      console.error(err);
      countEl.textContent = '';
      showState(errorState({ onRetry: load }));
    } finally {
      if (mine === seq) grid.setAttribute('aria-busy', 'false');
    }
  }

  function afterChange() {
    writeState();
    syncInputs();
    load();
  }

  // Filter inputs
  const onText = debounce(() => {
    state.q = fQ.value.trim();
    state.page = 1;
    afterChange();
  }, 350);
  const onPrice = debounce(() => {
    state.min = parseAmount(fMin.value);
    state.max = parseAmount(fMax.value);
    state.page = 1;
    afterChange();
  }, 400);

  fQ.addEventListener('input', onText);
  fMin.addEventListener('input', onPrice);
  fMax.addEventListener('input', onPrice);
  [fMin, fMax].forEach((input) =>
    input.addEventListener('blur', () => {
      const n = parseAmount(input.value);
      input.value = n === null ? '' : formatNumber(n); // show Persian digits with separators
    })
  );
  fSort.addEventListener('change', () => {
    state.sort = fSort.value;
    state.page = 1;
    afterChange();
  });
  qs('[data-clear]').addEventListener('click', clearAll);
  form.addEventListener('submit', (e) => e.preventDefault());

  window.addEventListener('popstate', () => {
    readState();
    syncInputs();
    load();
  });
  window.addEventListener('admin:change', load);

  readState();
  syncInputs();
  load();
}
