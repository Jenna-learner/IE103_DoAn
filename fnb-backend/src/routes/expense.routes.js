const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/expense.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/categories', ctrl.getCategories);
router.get('/',           ctrl.getAll);
router.post('/',          ctrl.create);
router.patch('/:id/approve', authorize('admin'), ctrl.approve);
router.patch('/:id/reject',  authorize('admin'), ctrl.reject);

module.exports = router;
