const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/loaisanpham.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/',             ctrl.getAll);
router.post('/',            authorize('admin'), ctrl.create);
router.put('/:maLoai',      authorize('admin'), ctrl.update);
router.delete('/:maLoai',   authorize('admin'), ctrl.remove);

module.exports = router;
