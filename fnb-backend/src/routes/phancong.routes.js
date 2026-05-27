const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/phancong.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/ca-lam',                  ctrl.getDanhSachCa);
router.get('/',                        ctrl.getPhanCong);        // ?maCN=&tuan=&maNV=
router.post('/',                       authorize('admin','quan_ly_chinhanh'), ctrl.phanCong);
router.patch('/:maPC/trang-thai',      authorize('admin','quan_ly_chinhanh'), ctrl.capNhatTrangThai);
router.delete('/:maPC',                authorize('admin','quan_ly_chinhanh'), ctrl.xoaPhanCong);

module.exports = router;
