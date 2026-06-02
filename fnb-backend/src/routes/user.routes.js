const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const db       = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { success, error } = require('../utils/response');

router.use(authenticate, authorize('admin', 'branch_manager'));

// GET /api/v1/users?branch_id=
router.get('/', async (req, res, next) => {
  try {
    const bid = req.user.role === 'branch_manager' ? req.user.branch_id : req.query.branch_id;
    const where = bid ? `WHERE u.branch_id = ${parseInt(bid)}` : '';
    const { rows } = await db.query(
      `SELECT u.id, u.username, u.full_name, u.phone, u.role, u.is_active, u.branch_id, b.name AS branch_name
       FROM users u LEFT JOIN branches b ON b.id = u.branch_id ${where} ORDER BY u.full_name`
    );
    return success(res, rows);
  } catch (err) { next(err); }
});

// POST /api/v1/users  (Tạo nhân viên mới)
router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const { branch_id, username, password, full_name, phone, role } = req.body;
    const hashedPw = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (branch_id, username, password, full_name, phone, role)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, username, full_name, role, branch_id`,
      [branch_id, username, hashedPw, full_name, phone, role]
    );
    return success(res, rows[0], 'Tạo tài khoản thành công', 201);
  } catch (err) { next(err); }
});

// PATCH /api/v1/users/:id/toggle-active
router.patch('/:id/toggle-active', authorize('admin'), async (req, res, next) => {
  try {
    await db.query(`UPDATE users SET is_active = NOT is_active WHERE id = $1`, [req.params.id]);
    return success(res, null, 'Đã cập nhật trạng thái tài khoản');
  } catch (err) { next(err); }
});

module.exports = router;
