const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/shift.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/templates',  ctrl.getTemplates);
router.get('/',           ctrl.getAssignments);    // GET ?branch_id=&week=2025-W01
router.post('/',          authorize('admin','branch_manager'), ctrl.assign);
router.delete('/:id',     authorize('admin','branch_manager'), ctrl.remove);

module.exports = router;
