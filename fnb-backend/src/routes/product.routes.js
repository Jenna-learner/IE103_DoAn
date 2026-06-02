const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/',      ctrl.getAll);       // GET  /api/v1/products?category_id=&search=
router.get('/:id',   ctrl.getById);      // GET  /api/v1/products/:id
router.post('/',     authorize('admin','branch_manager'), ctrl.create);
router.put('/:id',   authorize('admin','branch_manager'), ctrl.update);
router.delete('/:id',authorize('admin'), ctrl.remove);

module.exports = router;
