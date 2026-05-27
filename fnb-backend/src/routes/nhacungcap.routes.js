const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/nhacungcap.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/',           ctrl.getAll);
router.get('/:maNCC',     ctrl.getById);
router.post('/',          authorize('admin'), ctrl.create);
router.put('/:maNCC',     authorize('admin'), ctrl.update);

module.exports = router;
