// Admin panel routes (UI demo only). Real admin authentication and role checks
// are implemented in the backend phase; hiding links is never access control.
const express = require('express');
const page = require('../controllers/pageController');

const router = express.Router();

router.get('/', page.admin('dashboard', 'داشبورد'));
router.get('/products', page.admin('products', 'محصولات'));
router.get('/inventory', page.admin('inventory', 'موجودی'));
router.get('/orders', page.admin('orders', 'سفارش‌ها'));

module.exports = router;
