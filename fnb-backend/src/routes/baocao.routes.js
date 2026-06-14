const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/baocao.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh'));

router.get('/dashboard',           ctrl.dashboard);           // Card KPIs real-time
router.get('/doanh-thu-theo-ngay', ctrl.doanhThuTheoNgay);   // Chart doanh thu
router.get('/top-san-pham',        ctrl.topSanPham);          // Top sản phẩm bán chạy
router.get('/canh-bao-ton-kho',    ctrl.canhBaoTonKho);       // View cảnh báo tồn kho
router.get('/bang-luong',          ctrl.bangLuong);           // View bảng lương NV

// ── Báo cáo nghiệp vụ (xuất PDF) ─────────────────────────────
router.get('/khach-hang',          ctrl.baoCaoKhachHang);     // Hội viên mới, chi tiêu hội viên
router.get('/trang-thai-mon',      ctrl.baoCaoTrangThaiMon);  // Trạng thái các món
router.get('/nhap-hang',           ctrl.baoCaoNhapHang);      // Giá NL, điều chỉnh, hao hụt
router.get('/chi-van-hanh',        ctrl.baoCaoChiVanHanh);    // Chi phí vận hành
router.get('/dong-tien',           ctrl.baoCaoDongTien);      // Tổng hợp dòng tiền / lợi nhuận

router.post('/lam-moi',            authorize('admin'), ctrl.lamMoi); // Refresh MV

module.exports = router;
