const db = require('../config/db');
const { success, error, paginated } = require('../utils/response');

// GET /api/v1/inventory?branch_id=&low_stock=true
const getIngredients = async (req, res, next) => {
  try {
    const { branch_id, low_stock } = req.query;
    const bid = req.user.role === 'branch_manager' ? req.user.branch_id : branch_id;
    let where = bid ? `WHERE branch_id = ${parseInt(bid)}` : '';
    if (low_stock === 'true') where += (where ? ' AND' : 'WHERE') + ' stock_qty <= min_stock_qty';
    const { rows } = await db.query(
      `SELECT *, (stock_qty <= min_stock_qty) AS is_low FROM ingredients ${where} ORDER BY name`
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/inventory/logs?branch_id=&ingredient_id=&page=
const getLogs = async (req, res, next) => {
  try {
    const { branch_id, ingredient_id, page = 1, limit = 50 } = req.query;
    const bid = req.user.role === 'branch_manager' ? req.user.branch_id : branch_id;
    const params = [];
    let where = 'WHERE 1=1';
    if (bid) { params.push(bid); where += ` AND l.branch_id = $${params.length}`; }
    if (ingredient_id) { params.push(ingredient_id); where += ` AND l.ingredient_id = $${params.length}`; }
    params.push(limit, (page - 1) * limit);
    const { rows } = await db.query(
      `SELECT l.*, i.name AS ingredient_name, i.unit, u.full_name AS created_by_name
       FROM inventory_logs l
       JOIN ingredients i ON i.id = l.ingredient_id
       LEFT JOIN users u ON u.id = l.created_by
       ${where} ORDER BY l.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

const createIngredient = async (req, res, next) => {
  try {
    const { branch_id, name, unit, stock_qty = 0, min_stock_qty = 0, cost_per_unit = 0 } = req.body;
    const bid = branch_id || req.user.branch_id;
    const { rows } = await db.query(
      `INSERT INTO ingredients (branch_id, name, unit, stock_qty, min_stock_qty, cost_per_unit)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [bid, name, unit, stock_qty, min_stock_qty, cost_per_unit]
    );
    return success(res, rows[0], 'Thêm nguyên liệu thành công', 201);
  } catch (err) { next(err); }
};

const updateIngredient = async (req, res, next) => {
  try {
    const { name, unit, min_stock_qty, cost_per_unit } = req.body;
    const { rows } = await db.query(
      `UPDATE ingredients SET name=$1, unit=$2, min_stock_qty=$3, cost_per_unit=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [name, unit, min_stock_qty, cost_per_unit, req.params.id]
    );
    return success(res, rows[0], 'Cập nhật nguyên liệu thành công');
  } catch (err) { next(err); }
};

// GET /api/v1/inventory/stock-checks
const getStockChecks = async (req, res, next) => {
  try {
    const bid = req.user.role === 'branch_manager' ? req.user.branch_id : req.query.branch_id;
    const { rows } = await db.query(
      `SELECT sc.*, u.full_name AS checked_by_name
       FROM stock_checks sc LEFT JOIN users u ON u.id = sc.checked_by
       WHERE sc.branch_id = $1 ORDER BY sc.created_at DESC`,
      [bid]
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// POST /api/v1/inventory/stock-checks  (tạo phiếu kiểm kho, snapshot số lượng hiện tại)
const createStockCheck = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { branch_id, items, note } = req.body;
    // items: [{ ingredient_id, actual_qty, reason }]
    const bid = branch_id || req.user.branch_id;

    const { rows: [sc] } = await client.query(
      `INSERT INTO stock_checks (branch_id, checked_by, note) VALUES ($1,$2,$3) RETURNING *`,
      [bid, req.user.id, note]
    );

    for (const item of items) {
      const { rows: [ing] } = await client.query(`SELECT stock_qty FROM ingredients WHERE id = $1`, [item.ingredient_id]);
      await client.query(
        `INSERT INTO stock_check_items (stock_check_id, ingredient_id, system_qty, actual_qty, reason)
         VALUES ($1,$2,$3,$4,$5)`,
        [sc.id, item.ingredient_id, ing.stock_qty, item.actual_qty, item.reason]
      );
    }

    await client.query('COMMIT');
    return success(res, { stock_check_id: sc.id }, 'Tạo phiếu kiểm kho thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PATCH /api/v1/inventory/stock-checks/:id/confirm  (Xác nhận → điều chỉnh số lượng thực tế)
const confirmStockCheck = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows: [sc] } = await client.query(`SELECT * FROM stock_checks WHERE id = $1`, [req.params.id]);
    if (!sc) throw { status: 404, message: 'Phiếu kiểm kho không tồn tại.' };
    if (sc.status === 'confirmed') throw { status: 400, message: 'Phiếu đã được xác nhận.' };

    const { rows: scItems } = await client.query(
      `SELECT * FROM stock_check_items WHERE stock_check_id = $1`, [sc.id]
    );

    for (const item of scItems) {
      // Cập nhật tồn kho theo số thực tế
      await client.query(`UPDATE ingredients SET stock_qty = $1, updated_at = NOW() WHERE id = $2`, [item.actual_qty, item.ingredient_id]);
      const qtyChange = item.actual_qty - item.system_qty;
      await client.query(
        `INSERT INTO inventory_logs (branch_id, ingredient_id, change_type, qty_change, qty_before, qty_after, ref_id, ref_type, note, created_by)
         VALUES ($1,$2,'adjustment',$3,$4,$5,$6,'stock_check',$7,$8)`,
        [sc.branch_id, item.ingredient_id, qtyChange, item.system_qty, item.actual_qty, sc.id, item.reason, req.user.id]
      );
    }

    await client.query(`UPDATE stock_checks SET status = 'confirmed' WHERE id = $1`, [sc.id]);
    await client.query('COMMIT');
    return success(res, null, 'Xác nhận kiểm kho thành công. Tồn kho đã được điều chỉnh.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getIngredients, getLogs, createIngredient, updateIngredient, getStockChecks, createStockCheck, confirmStockCheck };
