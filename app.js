// Express app: view engine, static files, shared template data, routes, 404.
// Pages are rendered from EJS; the browser still uses demo data from public/js/data/ until the
// API steps connect it. The database connection is opened in server.js.
const path = require('path');
const express = require('express');
const site = require('./config/site');
const pageRoutes = require('./routes/pageRoutes');
const healthRoutes = require('./routes/healthRoutes');
const productRoutes = require('./routes/productRoutes');
const { apiNotFound, errorHandler } = require('./middlewares/errorHandler');
const pageController = require('./controllers/pageController');
const ICONS = require('./public/js/icons-data.js'); // same icon paths the browser uses

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '7d' : 0 }));

// Data available in every view. The JSON is escaped so it is safe inside a <script> tag.
app.use((req, res, next) => {
  res.locals.site = site;
  res.locals.ICONS = ICONS;
  res.locals.siteJson = JSON.stringify({
    brand: site.brand,
    dir: site.dir,
    currency: site.currency,
    contact: site.contact,
    categories: site.categories,
  }).replace(/</g, '\\u003c');
  next();
});

app.use('/health', healthRoutes); // before the pages: it must never redirect to /login
app.use('/api/products', productRoutes);
app.use('/api', apiNotFound); // unknown /api/... URLs get a JSON 404, not the HTML page
app.use('/', pageRoutes);
app.use(pageController.notFound);
app.use(errorHandler); // must be LAST: it receives every error from the routes above

module.exports = app;
