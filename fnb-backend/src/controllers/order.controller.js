/**
 * Order Controller
 * Tạo đơn → Trừ kho tự động (theo product_recipes) → Tích điểm CRM
 * Huỷ đơn → Hoàn kho tự động
 */
const db = require('../config/db');
const { success, error, paginated } = require('../utils/response');

// GET /api/v1/orders
const getAll = async (req, res, next) => {
  try {
    const { branch_id, status, date, page = 1, limit = 30 } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    // Branch manager chỉ xem chi nhánh mình
    const effectiveBranchId = req.user.role === 'branch_manager' ? req.user.branch_id : branch_id;
    if (effectiveBranchId) { params.push(effectiveBranchId); where += ` AND o.branch_id = $${params.length}`; }
    if (status) { params.push(status); where += ` AND o.status = $${params.length}`; }
    if (date)   { params.push(date);   where += ` AND DATE(o.created_at) = $${params.length}`; }

    params.push(limit, (page - 1) * limit);
    const { rows } = await db.query(
      `SELECT o.*, u.full_name AS cashier_name, c.phone AS customer_phone, c.full_name AS customer_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.cashier_id
       LEFT JOIN customers c ON c.id = o.customer_id
       ${where} ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const countParams = params.slice(0, -2);
    const { rows: cr } = await db.query(`SELECT COUNT(*) FROM orders o ${where}`, countParams);
    return paginated(res, rows, parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

// GET /api/v1/orders/:id
const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM orders WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return error(res, 'Đơn hàng không tồn tại.', 404);
    const { rows: items } = await db.query(
      `SELECT oi.*, p.image_url FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`,
      [req.params.id]
    );
    return success(res, { ...rows[0], items });
  } catch (err) { next(err); }
};

// POST /api/v1/orders
const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { branch_id, customer_phone, order_type, payment_method, items, note } = req.body;
    // items: [{ product_id, quantity }]

    // 1. Tìm hoặc tra cứu khách hàng
    let customer = null;
    if (customer_phone) {
      const { rows } = await client.query(`SELECT * FROM customers WHERE phone = $1`, [customer_phone]);
      customer = rows[0] || null;
    }

    // 2. Lấy giá + tính tổng tiền
    let subtotal = 0;
    const enrichedItems = [];
    for (const item of items) {
      const { rows } = await client.query(`SELECT id, name, price FROM products WHERE id = $1`, [item.product_id]);
      if (!rows[0]) throw { status: 400, message: `Sản phẩm ID ${item.product_id} không tồn tại.` };
      const lineTotal = rows[0].price * item.quantity;
      subtotal += lineTotal;
      enrichedItems.push({ ...item, unit_price: rows[0].price, product_name: rows[0].name, subtotal: lineTotal });
    }

    // 3. Tính giảm giá theo membership
    const discountMap = { bronze: 0, silver: 0.03, gold: 0.05, platinum: 0.08 };
    const discountRate = customer ? (discountMap[customer.membership] || 0) : 0;
    const discountAmount = Math.round(subtotal * discountRate);
    const totalAmount = subtotal - discountAmount;

    // 4. Tạo order
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (branch_id, cashier_id, customer_id, order_type, status, subtotal, discount_amount, total_amount, payment_method, note)
       VALUES ($1,$2,$3,$4,'completed',$5,$6,$7,$8,$9) RETURNING *`,
      [branch_id || req.user.branch_id, req.user.id, customer?.id, order_type, subtotal, discountAmount, totalAmount, payment_method, note]
    );

    // 5. Tạo order_items
    for (const item of enrichedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.id, item.product_id, item.product_name, item.unit_price, item.quantity, item.subtotal]
      );

      // 6. Trừ kho tự động theo công thức
      const { rows: recipes } = await client.query(
        `SELECT r.*, i.stock_qty, i.name AS ing_name FROM product_recipes r
         JOIN ingredients i ON i.id = r.ingredient_id WHERE r.product_id = $1`,
        [item.product_id]
      );
      for (const recipe of recipes) {
        const qtyChange = -(recipe.qty_used * item.quantity);
        const newQty = parseFloat(recipe.stock_qty) + qtyChange;
        await client.query(`UPDATE ingredients SET stock_qty = $1, updated_at = NOW() WHERE id = $2`, [newQty, recipe.ingredient_id]);
        await client.query(
          `INSERT INTO inventory_logs (branch_id, ingredient_id, change_type, qty_change, qty_before, qty_after, ref_id, ref_type, created_by)
           VALUES ($1,$2,'sale',$3,$4,$5,$6,'order',$7)`,
          [order.branch_id, recipe.ingredient_id, qtyChange, recipe.stock_qty, newQty, order.id, req.user.id]
        );
      }
    }

    // 7. Cập nhật điểm CRM
    if (customer) {
      const earnedPoints = Math.floor(totalAmount / 10000); // 1đ / 10k
      const newTotal = parseFloat(customer.total_spent) + totalAmount;
      const newPoints = customer.points + earnedPoints;
      // Nâng hạng tự động
      let membership = customer.membership;
      if (newTotal >= 10000000) membership = 'platinum';
      else if (newTotal >= 5000000) membership = 'gold';
      else if (newTotal >= 2000000) membership = 'silver';
      await client.query(
        `UPDATE customers SET points = $1, total_spent = $2, membership = $3 WHERE id = $4`,
        [newPoints, newTotal, membership, customer.id]
      );
    }

    await client.query('COMMIT');
    return success(res, { order_id: order.id, total_amount: order.total_amount, discount_amount: order.discount_amount }, 'Tạo đơn thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PATCH /api/v1/orders/:id/cancel  (Huỷ đơn + hoàn kho)
const cancel = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM orders WHERE id = $1`, [req.params.id]);
    const order = rows[0];
    if (!order) throw { status: 404, message: 'Đơn hàng không tồn tại.' };
    if (order.status === 'cancelled') throw { status: 400, message: 'Đơn hàng đã bị huỷ trước đó.' };

    await client.query(`UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [order.id]);

    // Hoàn kho
    const { rows: items } = await client.query(`SELECT * FROM order_items WHERE order_id = $1`, [order.id]);
    for (const item of items) {
      const { rows: recipes } = await client.query(
        `SELECT r.*, i.stock_qty FROM product_recipes r JOIN ingredients i ON i.id = r.ingredient_id WHERE r.product_id = $1`,
        [item.product_id]
      );
      for (const recipe of recipes) {
        const qtyChange = recipe.qty_used * item.quantity; // Hoàn lại
        const newQty = parseFloat(recipe.stock_qty) + qtyChange;
        await client.query(`UPDATE ingredients SET stock_qty = $1, updated_at = NOW() WHERE id = $2`, [newQty, recipe.ingredient_id]);
        await client.query(
          `INSERT INTO inventory_logs (branch_id, ingredient_id, change_type, qty_change, qty_before, qty_after, ref_id, ref_type, note, created_by)
           VALUES ($1,$2,'return',$3,$4,$5,$6,'order','Hoàn kho do huỷ đơn',$7)`,
          [order.branch_id, recipe.ingredient_id, qtyChange, recipe.stock_qty, newQty, order.id, req.user.id]
        );
      }
    }
    await client.query('COMMIT');
    return success(res, null, 'Đã huỷ đơn và hoàn kho thành công');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getAll, getById, create, cancel };
