const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/purchaseOrder.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin','branch_manager'));

router.get('/',          ctrl.getAll);
router.get('/:id',       ctrl.getById);
router.post('/',         ctrl.create);                      // Tạo phiếu Draft
router.patch('/:id/receive',  ctrl.receive);                // Nhận hàng → tăng kho
router.patch('/:id/cancel',   ctrl.cancel);                 // Huỷ phiếu

module.exports = router;
