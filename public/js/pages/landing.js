// Landing page: category carousel (tabs) -> products of the selected category (5 per page),
// plus the featured carousel. Switching category resets to page 1 without leaving the page.
import { qs, qsa, el, readQuery, writeQuery } from '../components/dom.js';
import { productCard } from '../components/productCard.js';
import { renderPagination } from '../components/pagination.js';
import { initCarousel } from '../components/carousel.js';
import { skeletonCards, errorState } from '../components/states.js';
import { listProducts, getFeatured, countByCategory, PAGE_SIZE } from '../services/productService.js';
import { formatNumber } from '../services/format.js';

const CATEGORIES = ['men', 'women', 'smart'];

export function init() {
  const section = qs('#collections');
  const tabs = qsa('[role="tab"]', section);
  const catalog = qs('[data-catalog]', section);
  const grid = qs('[data-catalog-grid]', catalog);
  const pager = qs('[data-catalog-pagination]', catalog);
  const title = qs('[data-catalog-title]', catalog);
  const meta = qs('[data-catalog-meta]', catalog);
  const allLink = qs('[data-catalog-all]', catalog);

  // Counters on the three cards.
  const counts = countByCategory();
  qsa('[data-count]', section).forEach((n) => (n.textContent = `${formatNumber(counts[n.dataset.count] || 0)} مدل`));

  const params = readQuery();
  const state = {
    category: CATEGORIES.includes(params.get('cat')) ? params.get('cat') : 'men',
    page: Math.max(1, parseInt(params.get('page'), 10) || 1),
  };
  let seq = 0;

  async function load() {
    const mine = ++seq;
    grid.setAttribute('aria-busy', 'true');
    grid.replaceChildren(skeletonCards(PAGE_SIZE));
    meta.textContent = 'در حال بارگذاری…';
    try {
      const res = await listProducts({ category: state.category, page: state.page, limit: PAGE_SIZE });
      if (mine !== seq) return; // an older request finished late
      state.page = res.page;
      grid.replaceChildren(...res.items.map(productCard));
      meta.textContent = `صفحه ${formatNumber(res.page)} از ${formatNumber(res.pages)} · ${formatNumber(res.total)} مدل`;
      renderPagination(pager, {
        page: res.page,
        pages: res.pages,
        onChange: (n) => {
          state.page = n;
          sync(true);
          load();
          catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      });
    } catch (err) {
      if (mine !== seq) return;
      console.error(err);
      grid.replaceChildren(errorState({ onRetry: load }));
      pager.hidden = true;
      meta.textContent = '';
    } finally {
      if (mine === seq) grid.setAttribute('aria-busy', 'false');
    }
  }

  function sync(push = false) {
    const q = new URLSearchParams();
    q.set('cat', state.category);
    if (state.page > 1) q.set('page', String(state.page));
    writeQuery(q, { replace: !push });
  }

  function select(category, { resetPage = true, updateUrl = true } = {}) {
    state.category = category;
    if (resetPage) state.page = 1;
    tabs.forEach((tab) => {
      const on = tab.dataset.category === category;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle('is-selected', on);
    });
    const tab = tabs.find((t) => t.dataset.category === category);
    catalog.dataset.theme = category;
    catalog.setAttribute('aria-labelledby', tab.id);
    title.textContent = window.SITE.categories[category].titleFa;
    allLink.href = `/watches/${category}`;
    if (updateUrl) sync();
    load();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.category));
    tab.addEventListener('keydown', (e) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const target = keys[e.key] === 'first' ? 0 : keys[e.key] === 'last' ? tabs.length - 1 : (i + keys[e.key] + tabs.length) % tabs.length;
      tabs[target].focus();
      select(tabs[target].dataset.category);
    });
  });

  window.addEventListener('admin:change', load);

  initCarousel(section);
  select(state.category, { resetPage: false, updateUrl: false });

  // Featured carousel
  const featured = qs('.featured');
  const track = qs('[data-featured-track]', featured);
  track.append(skeletonCards(4));
  getFeatured(8)
    .then((items) => {
      track.replaceChildren(...items.map((p) => el('div', { class: 'carousel__item' }, productCard(p))));
      initCarousel(featured);
    })
    .catch((err) => {
      console.error(err);
      track.replaceChildren(errorState({}));
    });
}
