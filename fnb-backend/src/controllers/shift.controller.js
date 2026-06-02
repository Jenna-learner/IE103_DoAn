const db = require('../config/db');
const { success, error } = require('../utils/response');

const getTemplates = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM shift_templates ORDER BY start_time`);
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET ?branch_id=&week=2025-01-06 (ngày đầu tuần – Monday)
const getAssignments = async (req, res, next) => {
  try {
    const { week } = req.query;
    const bid = req.user.branch_id;
    let dateWhere = '';
    const params = [bid];
    if (week) {
      // Lấy 7 ngày từ ngày đầu tuần
      params.push(week);
      dateWhere = `AND sa.work_date >= $2::date AND sa.work_date < ($2::date + INTERVAL '7 days')`;
    }
    const { rows } = await db.query(
      `SELECT sa.*, u.full_name, st.name AS shift_name, st.start_time, st.end_time
       FROM shift_assignments sa
       JOIN users u ON u.id = sa.user_id
       JOIN shift_templates st ON st.id = sa.shift_template_id
       WHERE sa.branch_id = $1 ${dateWhere}
       ORDER BY sa.work_date, st.start_time`, params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

const assign = async (req, res, next) => {
  try {
    const { user_id, shift_template_id, work_date, note } = req.body;
    const bid = req.user.branch_id;

    // Kiểm tra trùng ca (UNIQUE constraint sẽ handle, nhưng trả lỗi rõ ràng hơn)
    const { rows: existing } = await db.query(
      `SELECT id FROM shift_assignments WHERE user_id=$1 AND work_date=$2 AND shift_template_id=$3`,
      [user_id, work_date, shift_template_id]
    );
    if (existing.length > 0) return error(res, 'Nhân viên đã được phân công ca này.', 409);

    const { rows } = await db.query(
      `INSERT INTO shift_assignments (branch_id, user_id, shift_template_id, work_date, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [bid, user_id, shift_template_id, work_date, note]
    );
    return success(res, rows[0], 'Phân công ca thành công', 201);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM shift_assignments WHERE id = $1`, [req.params.id]);
    return success(res, null, 'Đã xoá phân công ca');
  } catch (err) { next(err); }
};

module.exports = { getTemplates, getAssignments, assign, remove };
