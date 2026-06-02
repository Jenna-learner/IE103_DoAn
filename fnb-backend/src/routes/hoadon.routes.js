const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/hoadon.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/v1/hoa-don?maCN=&trangThai=&ngay=
router.get('/',               ctrl.getAll);
router.get('/:maHD',          ctrl.getById);
router.post('/',               ctrl.create);   // Thu ngân tạo đơn
router.patch('/:maHD/huy',    authorize('admin', 'quan_ly_chinhanh'), ctrl.huyDon);

module.exports = router;
