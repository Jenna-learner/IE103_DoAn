const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/phieuchi.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/',                 ctrl.getAll);
router.post('/',                ctrl.create);
router.patch('/:maPC/duyet',    authorize('admin'), ctrl.duyet);
router.patch('/:maPC/tu-choi',  authorize('admin'), ctrl.tuChoi);

module.exports = router;
