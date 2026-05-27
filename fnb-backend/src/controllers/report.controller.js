const db = require('../config/db');
const { success } = require('../utils/response');

// GET /api/v1/reports/dashboard?branch_id=&date=YYYY-MM-DD
const dashboard = async (req, res, next) => {
  try {
    const bid = req.user.branch_id;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const [revenue, expenses, lowStock] = await Promise.all([
      // Tổng doanh thu & số đơn hôm nay
      db.query(
        `SELECT COUNT(*) AS total_orders,
                COALESCE(SUM(total_amount), 0) AS total_revenue,
                COALESCE(SUM(discount_amount), 0) AS total_discount
         FROM orders
         WHERE branch_id = $1 AND DATE(created_at) = $2 AND status = 'completed'`,
        [bid, date]
      ),
      // Tổng chi phí vận hành hôm nay
      db.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_expenses
         FROM expenses WHERE branch_id = $1 AND expense_date = $2 AND status = 'approved'`,
        [bid, date]
      ),
      // Số nguyên liệu dưới mức tối thiểu
      db.query(
        `SELECT COUNT(*) AS low_stock_count FROM ingredients
         WHERE branch_id = $1 AND stock_qty <= min_stock_qty`, [bid]
      ),
    ]);

    const rev = revenue.rows[0];
    return success(res, {
      date,
      total_orders:    parseInt(rev.total_orders),
      total_revenue:   parseFloat(rev.total_revenue),
      total_discount:  parseFloat(rev.total_discount),
      net_revenue:     parseFloat(rev.total_revenue) - parseFloat(expenses.rows[0].total_expenses),
      total_expenses:  parseFloat(expenses.rows[0].total_expenses),
      low_stock_count: parseInt(lowStock.rows[0].low_stock_count),
    });
  } catch (err) { next(err); }
};

// GET /api/v1/reports/revenue-by-day?branch_id=&month=YYYY-MM
const revenueByDay = async (req, res, next) => {
  try {
    const bid = req.user.branch_id;
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const { rows } = await db.query(
      `SELECT DATE(created_at) AS date,
              COUNT(*) AS total_orders,
              COALESCE(SUM(total_amount), 0) AS total_revenue
       FROM orders
       WHERE branch_id = $1
         AND TO_CHAR(created_at, 'YYYY-MM') = $2
         AND status = 'completed'
       GROUP BY DATE(created_at) ORDER BY date`,
      [bid, month]
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/reports/top-products?branch_id=&date_from=&date_to=&limit=10
const topProducts = async (req, res, next) => {
  try {
    const bid = req.user.branch_id;
    const { date_from, date_to, limit = 10 } = req.query;
    const from = date_from || new Date().toISOString().split('T')[0];
    const to   = date_to   || from;
    const { rows } = await db.query(
      `SELECT oi.product_id, oi.product_name,
              SUM(oi.quantity) AS total_qty,
              SUM(oi.subtotal) AS total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.branch_id = $1
         AND DATE(o.created_at) BETWEEN $2 AND $3
         AND o.status = 'completed'
       GROUP BY oi.product_id, oi.product_name
       ORDER BY total_qty DESC LIMIT $4`,
      [bid, from, to, limit]
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

module.exports = { dashboard, revenueByDay, topProducts };
