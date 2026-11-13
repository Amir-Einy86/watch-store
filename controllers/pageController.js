// Page controller: each function picks a view and passes it the data it needs.
// Products are not read here yet; the browser gets demo data from public/js/data/products.js.
// In the backend phase these handlers will load real data from MongoDB.
const site = require('../config/site');

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

function render(res, view, data) {
  res.render(view, {
    title: site.brand.name,
    page: 'page',
    theme: 'default',
    bare: false, // true = no navbar/footer (login page)
    gate: true, // true = redirect to /login when there is no (demo) session
    category: null,
    slug: null,
    ...data,
  });
}

exports.landing = (req, res) =>
  render(res, 'pages/landing', { title: `${site.brand.name} | ${site.brand.nameFa}`, page: 'landing' });

exports.login = (req, res) =>
  render(res, 'pages/login', { title: `ورود | ${site.brand.name}`, page: 'login', bare: true, gate: false });

exports.category = (req, res, next) => {
  const category = site.categories[req.params.category];
  if (!category) return next(); // falls through to the 404 handler
  render(res, 'pages/category', {
    title: `${category.titleFa} | ${site.brand.name}`,
    page: 'category',
    theme: category.key,
    category,
  });
};

exports.product = (req, res, next) => {
  if (!SLUG_RE.test(req.params.slug)) return next();
  render(res, 'pages/product', {
    title: `محصول | ${site.brand.name}`,
    page: 'product',
    slug: req.params.slug,
  });
};

exports.cart = (req, res) => render(res, 'pages/cart', { title: `سبد خرید | ${site.brand.name}`, page: 'cart' });

exports.account = (req, res) =>
  render(res, 'pages/account', { title: `حساب کاربری | ${site.brand.name}`, page: 'account' });

exports.admin = (adminPage, label) => (req, res) =>
  render(res, `admin/${adminPage}`, {
    title: `${label} | مدیریت ${site.brand.name}`,
    page: `admin-${adminPage}`,
    bare: true,
  });

exports.notFound = (req, res) => {
  res.status(404);
  render(res, 'pages/404', { title: `۴۰۴ | ${site.brand.name}`, page: '404' });
};
