const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/chinhanh.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Chi nhánh
router.get('/',              ctrl.getAllCN);
router.post('/',             authorize('admin'), ctrl.createCN);
router.put('/:maCN',         authorize('admin'), ctrl.updateCN);

// Bộ phận
router.get('/bo-phan',       ctrl.getAllBP);
router.post('/bo-phan',      authorize('admin'), ctrl.createBP);

module.exports = router;
