const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const db      = require('../config/db');
const { success } = require('../utils/response');

router.use(authenticate);
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order`);
    return success(res, rows);
  } catch (err) { next(err); }
});

router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const { name, sort_order } = req.body;
    const { rows } = await db.query(`INSERT INTO categories (name, sort_order) VALUES ($1,$2) RETURNING *`, [name, sort_order]);
    return success(res, rows[0], 'Tạo danh mục thành công', 201);
  } catch (err) { next(err); }
});

module.exports = router;
