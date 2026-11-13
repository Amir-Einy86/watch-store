// Account page (DEMO): shows the demo session, the wishlist, and logout.
import { qs, el } from '../components/dom.js';
import { productCard } from '../components/productCard.js';
import { getProductSync } from '../services/productService.js';
import { getSession, logout } from '../services/authService.js';
import * as wishlist from '../services/wishlistService.js';

export function init() {
  const session = getSession();
  const label = qs('[data-account-label]');
  if (label) label.textContent = session?.username ? 'نام کاربری' : 'شماره موبایل';
  qs('[data-account-phone]').textContent = session?.phone || session?.username || '—';

  qs('[data-logout]').addEventListener('click', () => {
    logout();
    location.replace('/login');
  });

  const grid = qs('[data-wishlist-grid]');
  const empty = qs('[data-wishlist-empty]');
  function render() {
    const products = wishlist
      .list()
      .map((id) => getProductSync(id))
      .filter((p) => p && p.active);
    grid.replaceChildren(...products.map(productCard));
    grid.hidden = !products.length;
    empty.hidden = products.length > 0;
  }
  window.addEventListener('wishlist:change', render);
  render();
}
