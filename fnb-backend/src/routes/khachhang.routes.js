const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/khachhang.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/tra-cuu', ctrl.traCuu);   // Tra cứu nhanh theo SDT tại POS
router.get('/',        ctrl.getAll);
router.get('/:maKH',   ctrl.getById);
router.post('/',       ctrl.create);
router.put('/:maKH',   ctrl.update);

module.exports = router;
