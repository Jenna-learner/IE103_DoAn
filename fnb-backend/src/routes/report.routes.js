const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'branch_manager'));

router.get('/dashboard',       ctrl.dashboard);      // Card KPIs real-time
router.get('/revenue-by-day',  ctrl.revenueByDay);   // Doanh thu theo ngày (chart)
router.get('/top-products',    ctrl.topProducts);    // Top sản phẩm bán chạy

module.exports = router;
