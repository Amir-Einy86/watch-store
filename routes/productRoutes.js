// Product API routes (mounted at /api/products in app.js).
// Order matters: "/counts" must come BEFORE "/:slug", otherwise "counts" would be read as a slug.
const express = require('express');
const controller = require('../controllers/productController');
const validate = require('../middlewares/validate');
const { parseListQuery, parseSlug } = require('../validators/productValidator');

const router = express.Router();

router.get('/', validate(parseListQuery), controller.list);
router.get('/counts', controller.counts);
router.get('/:slug', validate(parseSlug), controller.getBySlug);
router.get('/:slug/related', validate(parseSlug), controller.related);

module.exports = router;
