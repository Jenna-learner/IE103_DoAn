const db = require('../config/db');
const { success, error, paginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { phone, page = 1, limit = 20 } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (phone) { params.push(`%${phone}%`); where += ` AND phone ILIKE $${params.length}`; }
    params.push(limit, (page - 1) * limit);
    const { rows } = await db.query(
      `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params
    );
    const { rows: cr } = await db.query(`SELECT COUNT(*) FROM customers ${where}`, params.slice(0, -2));
    return paginated(res, rows, parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

// Tra cứu nhanh tại màn hình POS
const lookup = async (req, res, next) => {
  try {
    const { phone } = req.query;
    if (!phone) return error(res, 'Vui lòng nhập số điện thoại.', 400);
    const { rows } = await db.query(`SELECT * FROM customers WHERE phone = $1`, [phone]);
    return success(res, rows[0] || null);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM customers WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return error(res, 'Không tìm thấy khách hàng.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { phone, full_name, email } = req.body;
    const { rows } = await db.query(
      `INSERT INTO customers (phone, full_name, email) VALUES ($1,$2,$3) RETURNING *`,
      [phone, full_name, email]
    );
    return success(res, rows[0], 'Tạo khách hàng thành công', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { full_name, email } = req.body;
    const { rows } = await db.query(
      `UPDATE customers SET full_name=$1, email=$2 WHERE id=$3 RETURNING *`, [full_name, email, req.params.id]
    );
    return success(res, rows[0], 'Cập nhật thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, lookup, getById, create, update };
