// Page routes: URL -> controller.
const express = require('express');
const page = require('../controllers/pageController');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.get('/', page.landing);
router.get('/login', page.login);
router.get('/watches/:category', page.category);
router.get('/product/:slug', page.product);
router.get('/cart', page.cart);
router.get('/account', page.account);
router.use('/admin', adminRoutes);

module.exports = router;
