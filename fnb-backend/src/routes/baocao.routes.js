const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/baocao.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'quan_ly_chinhanh'));

router.get('/dashboard',           ctrl.dashboard);           // Card KPIs real-time
router.get('/doanh-thu-theo-ngay', ctrl.doanhThuTheoNgay);   // Chart doanh thu
router.get('/top-san-pham',        ctrl.topSanPham);          // Top sản phẩm bán chạy
router.get('/canh-bao-ton-kho',    ctrl.canhBaoTonKho);       // View cảnh báo tồn kho
router.get('/bang-luong',          ctrl.bangLuong);           // View bảng lương NV
router.post('/lam-moi',            authorize('admin'), ctrl.lamMoi); // Refresh MV

module.exports = router;
