const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/kho.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Tồn kho
router.get('/ton-kho',          ctrl.getTonKho);       // ?maCN=&canhBao=true
router.put('/ton-kho/muc-toi-thieu', authorize('admin','quan_ly_chinhanh'), ctrl.capNhatMucToiThieu);

// Nhật ký biến động kho
router.get('/nhat-ky',          ctrl.getNhatKy);       // ?maCN=&maNL=&loai=

// Nguyên liệu
router.get('/nguyen-lieu',      ctrl.getNguyenLieu);
router.post('/nguyen-lieu',     authorize('admin'), ctrl.createNguyenLieu);

// Kiểm kho (điều chỉnh Audit_Loss / Audit_Gain)
router.post('/kiem-kho',        authorize('admin','quan_ly_chinhanh'), ctrl.kiemKho);

module.exports = router;
