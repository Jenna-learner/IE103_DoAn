const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Cashier & above
router.get('/',           ctrl.getAll);         // GET  /api/v1/orders?branch_id=&status=&date=
router.get('/:id',        ctrl.getById);         // GET  /api/v1/orders/:id  (kèm items)
router.post('/',          ctrl.create);          // POST /api/v1/orders       (tạo đơn + trừ kho tự động)
router.patch('/:id/cancel', authorize('branch_manager','admin'), ctrl.cancel); // Huỷ đơn + hoàn kho

module.exports = router;
