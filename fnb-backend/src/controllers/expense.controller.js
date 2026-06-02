const db = require('../config/db');
const { success, error } = require('../utils/response');

const getCategories = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM expense_categories ORDER BY name`);
    return success(res, rows);
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const bid = req.user.branch_id;
    const { month } = req.query; // YYYY-MM
    let dateWhere = '';
    const params = [bid];
    if (month) { params.push(month); dateWhere = `AND TO_CHAR(expense_date,'YYYY-MM') = $${params.length}`; }
    const { rows } = await db.query(
      `SELECT e.*, ec.name AS category_name, u.full_name AS created_by_name
       FROM expenses e
       JOIN expense_categories ec ON ec.id = e.category_id
       LEFT JOIN users u ON u.id = e.created_by
       WHERE e.branch_id = $1 ${dateWhere} ORDER BY e.expense_date DESC`, params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { category_id, amount, description, expense_date } = req.body;
    const { rows } = await db.query(
      `INSERT INTO expenses (branch_id, category_id, created_by, amount, description, expense_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.branch_id, category_id, req.user.id, amount, description, expense_date || new Date()]
    );
    return success(res, rows[0], 'Tạo phiếu chi thành công', 201);
  } catch (err) { next(err); }
};

const approve = async (req, res, next) => {
  try {
    await db.query(`UPDATE expenses SET status = 'approved' WHERE id = $1`, [req.params.id]);
    return success(res, null, 'Phiếu chi đã được duyệt');
  } catch (err) { next(err); }
};

const reject = async (req, res, next) => {
  try {
    await db.query(`UPDATE expenses SET status = 'rejected' WHERE id = $1`, [req.params.id]);
    return success(res, null, 'Phiếu chi đã bị từ chối');
  } catch (err) { next(err); }
};

module.exports = { getCategories, getAll, create, approve, reject };
