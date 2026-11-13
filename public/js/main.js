// Entry point for every page: shared header/support behavior, then the page's own module.
import { initNavbar } from './components/navbar.js';
import { initSupport } from './components/support.js';

const page = document.body.dataset.page;

// Pages that have their own script in /js/pages/.
const PAGE_MODULES = {
  landing: 'landing.js',
  login: 'login.js',
  category: 'category.js',
  product: 'product.js',
  cart: 'cart.js',
  account: 'account.js',
};

initNavbar();
initSupport();

const file = page && page.startsWith('admin-') ? 'admin.js' : PAGE_MODULES[page];
if (file) {
  import(`./pages/${file}`)
    .then((mod) => mod.init && mod.init(page))
    .catch((err) => console.error(`[${page}] failed to start:`, err));
}
