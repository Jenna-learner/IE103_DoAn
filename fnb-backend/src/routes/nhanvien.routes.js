const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/nhanvien.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/',                           ctrl.getAll);
router.get('/:maNV',                      ctrl.getById);
router.post('/',                          authorize('admin'), ctrl.create);
router.put('/:maNV',                      authorize('admin', 'quan_ly_chinhanh'), ctrl.update);
router.patch('/:maNV/dat-lai-mat-khau',   authorize('admin'), ctrl.datLaiMatKhau);

module.exports = router;
