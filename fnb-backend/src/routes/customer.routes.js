const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/customer.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/',          ctrl.getAll);    // GET  ?phone=&page=
router.get('/lookup',    ctrl.lookup);    // GET  ?phone=  (tra cứu nhanh tại POS)
router.get('/:id',       ctrl.getById);
router.post('/',         ctrl.create);
router.put('/:id',       ctrl.update);

module.exports = router;
