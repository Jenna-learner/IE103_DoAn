const db = require('../config/db');
const { success, error } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const bid = req.user.branch_id;
    const { rows } = await db.query(
      `SELECT po.*, s.name AS supplier_name, u.full_name AS created_by_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN users u ON u.id = po.created_by
       WHERE po.branch_id = $1 ORDER BY po.created_at DESC`, [bid]
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM purchase_orders WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return error(res, 'Không tìm thấy phiếu nhập.', 404);
    const { rows: items } = await db.query(
      `SELECT poi.*, i.unit FROM purchase_order_items poi LEFT JOIN ingredients i ON i.id = poi.ingredient_id WHERE poi.purchase_order_id = $1`,
      [req.params.id]
    );
    return success(res, { ...rows[0], items });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { supplier_id, items, note } = req.body;
    // items: [{ ingredient_id, ingredient_name, quantity, unit_price }]
    let totalAmount = 0;
    const enriched = items.map(i => {
      const sub = i.quantity * i.unit_price;
      totalAmount += sub;
      return { ...i, subtotal: sub };
    });

    const { rows: [po] } = await client.query(
      `INSERT INTO purchase_orders (branch_id, supplier_id, created_by, total_amount, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.branch_id, supplier_id, req.user.id, totalAmount, note]
    );

    for (const item of enriched) {
      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, ingredient_name, quantity, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [po.id, item.ingredient_id, item.ingredient_name, item.quantity, item.unit_price, item.subtotal]
      );
    }

    await client.query('COMMIT');
    return success(res, { purchase_order_id: po.id }, 'Tạo phiếu nhập thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PATCH /:id/receive → Chuyển Draft → Received, tăng tồn kho
const receive = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM purchase_orders WHERE id = $1`, [req.params.id]);
    const po = rows[0];
    if (!po) throw { status: 404, message: 'Phiếu nhập không tồn tại.' };
    if (po.status !== 'draft') throw { status: 400, message: 'Chỉ phiếu Draft mới có thể nhận hàng.' };

    const { rows: items } = await client.query(`SELECT * FROM purchase_order_items WHERE purchase_order_id = $1`, [po.id]);
    for (const item of items) {
      const { rows: [ing] } = await client.query(`SELECT stock_qty FROM ingredients WHERE id = $1`, [item.ingredient_id]);
      const newQty = parseFloat(ing.stock_qty) + parseFloat(item.quantity);
      await client.query(`UPDATE ingredients SET stock_qty = $1, updated_at = NOW() WHERE id = $2`, [newQty, item.ingredient_id]);
      await client.query(
        `INSERT INTO inventory_logs (branch_id, ingredient_id, change_type, qty_change, qty_before, qty_after, ref_id, ref_type, note, created_by)
         VALUES ($1,$2,'purchase',$3,$4,$5,$6,'purchase_order','Nhập hàng từ phiếu PO',$7)`,
        [po.branch_id, item.ingredient_id, item.quantity, ing.stock_qty, newQty, po.id, req.user.id]
      );
    }

    await client.query(`UPDATE purchase_orders SET status='received', received_at=NOW() WHERE id=$1`, [po.id]);
    await client.query('COMMIT');
    return success(res, null, 'Đã xác nhận nhận hàng. Tồn kho đã được cập nhật.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const cancel = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT status FROM purchase_orders WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return error(res, 'Phiếu nhập không tồn tại.', 404);
    if (rows[0].status === 'received') return error(res, 'Không thể huỷ phiếu đã nhận hàng.', 400);
    await db.query(`UPDATE purchase_orders SET status = 'cancelled' WHERE id = $1`, [req.params.id]);
    return success(res, null, 'Huỷ phiếu nhập thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, receive, cancel };
