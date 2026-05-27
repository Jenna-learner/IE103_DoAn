const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/phieunhap.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'quan_ly_chinhanh', 'kho'));

router.get('/',                   ctrl.getAll);
router.get('/:maPN',              ctrl.getById);
router.post('/',                  ctrl.create);
router.patch('/:maPN/duyet',      authorize('admin', 'quan_ly_chinhanh'), ctrl.duyet);
router.patch('/:maPN/huy',        ctrl.huy);

module.exports = router;
