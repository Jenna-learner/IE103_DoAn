const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/sanpham.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/v1/san-pham?maLoai=&search=&trangThai=Active
router.get('/',                   ctrl.getAll);
router.get('/:maSP',              ctrl.getById);
router.post('/',                  authorize('admin', 'quan_ly_chinhanh'), ctrl.create);
router.put('/:maSP',              authorize('admin', 'quan_ly_chinhanh'), ctrl.update);
router.patch('/:maSP/trang-thai', authorize('admin', 'quan_ly_chinhanh'), ctrl.doiTrangThai);

module.exports = router;
