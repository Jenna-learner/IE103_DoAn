const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Nguyên liệu
router.get('/',              ctrl.getIngredients);   // GET  ?branch_id=&low_stock=true
router.get('/logs',          ctrl.getLogs);           // GET  Nhật ký biến động kho
router.post('/ingredients',  authorize('admin','branch_manager'), ctrl.createIngredient);
router.put('/ingredients/:id', authorize('admin','branch_manager'), ctrl.updateIngredient);

// Kiểm kho
router.get('/stock-checks',        ctrl.getStockChecks);
router.post('/stock-checks',       authorize('branch_manager','admin'), ctrl.createStockCheck);
router.patch('/stock-checks/:id/confirm', authorize('branch_manager','admin'), ctrl.confirmStockCheck);

module.exports = router;
