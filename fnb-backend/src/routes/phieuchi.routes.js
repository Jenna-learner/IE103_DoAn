const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/phieuchi.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/',                 ctrl.getAll);
router.post('/',                authorize('admin', 'quan_ly_chinhanh', 'thu_ngan', 'kho'), ctrl.create);
router.patch('/:maPC/duyet',    authorize('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh'), ctrl.duyet);
router.patch('/:maPC/tu-choi',  authorize('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh'), ctrl.tuChoi);

module.exports = router;
