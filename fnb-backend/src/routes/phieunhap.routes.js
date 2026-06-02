const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/phieunhap.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/',                   authorize('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh', 'kho'), ctrl.getAll);
router.get('/:maPN',              authorize('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh', 'kho'), ctrl.getById);
router.post('/',                  authorize('admin', 'quan_ly_chinhanh', 'kho'), ctrl.create);
router.patch('/:maPN/duyet',      authorize('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh'), ctrl.duyet);
router.patch('/:maPN/huy',        authorize('admin', 'quan_ly_chinhanh', 'kho'), ctrl.huy);

module.exports = router;
