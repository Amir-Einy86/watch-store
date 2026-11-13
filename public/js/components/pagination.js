// Pagination with real buttons: previous, page numbers, next.
import { el } from './dom.js';
import { icon } from './icons.js';
import { formatNumber } from '../services/format.js';

function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page, page - 1, page + 1]);
  const list = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

export function renderPagination(container, { page, pages, onChange }) {
  container.replaceChildren();
  if (pages <= 1) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const go = (n) => () => onChange(n);

  container.append(
    el('button', { type: 'button', class: 'page-btn page-btn--nav', disabled: page <= 1, onclick: go(page - 1), html: `${icon('chev-left')}<span>صفحه قبل</span>` }),
    ...pageList(page, pages).map((n) =>
      n === '…'
        ? el('span', { class: 'page-gap', 'aria-hidden': 'true', text: '…' })
        : el('button', {
            type: 'button',
            class: `page-btn${n === page ? ' is-current' : ''}`,
            'aria-label': `صفحه ${formatNumber(n)}`,
            'aria-current': n === page ? 'page' : false,
            onclick: go(n),
            text: formatNumber(n),
          })
    ),
    el('button', { type: 'button', class: 'page-btn page-btn--nav', disabled: page >= pages, onclick: go(page + 1), html: `<span>صفحه بعد</span>${icon('chev-right')}` })
  );
}
