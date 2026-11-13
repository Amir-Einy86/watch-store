// Product controller: receives the (already validated) request and sends the JSON answer.
// No database code here - that is the service's job.
const productService = require('../services/productService');
const catchAsync = require('../utils/catchAsync');

// GET /api/products
exports.list = catchAsync(async (req, res) => {
  res.json(await productService.listProducts(req.validated));
});

// GET /api/products/counts
exports.counts = catchAsync(async (req, res) => {
  res.json(await productService.countByCategory());
});

// GET /api/products/:slug
exports.getBySlug = catchAsync(async (req, res) => {
  res.json(await productService.getBySlug(req.validated.slug));
});

// GET /api/products/:slug/related
exports.related = catchAsync(async (req, res) => {
  res.json({ items: await productService.getRelated(req.validated.slug) });
});
// Product controller: list by category with pagination (5 per page), price and strap filters.
