/**
 * PostgreSQL Connection Pool (node-postgres)
 * Kết nối qua ZeroTier One VPN Network
 */
const { Pool, types } = require('pg');
require('dotenv').config();

// Trả DATE (OID 1082) về string 'YYYY-MM-DD' thay vì Date object
// Tránh lệch múi giờ khi pg tự convert sang local time rồi toISOString() lại lùi 7h
types.setTypeParser(1082, val => val);

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Connection Pool settings
  max:              10,   // Tối đa 10 kết nối đồng thời
  idleTimeoutMillis: 30000, // Đóng kết nối idle sau 30s
  connectionTimeoutMillis: 5000, // Timeout kết nối sau 5s
  ssl: false,             // Tắt SSL (dùng qua ZeroTier VPN nội bộ)
});

// Kiểm tra kết nối khi khởi động
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected via ZeroTier');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL Pool Error:', err.message);
  process.exit(1);
});

/**
 * Hàm query tiện lợi – dùng xuyên suốt controllers
 * @param {string} text  - SQL query string
 * @param {Array}  params - Query parameters (tránh SQL injection)
 */
const query = (text, params) => pool.query(text, params);

/**
 * Dùng khi cần transaction (BEGIN / COMMIT / ROLLBACK)
 * Gọi: const client = await getClient()
 *       await client.query('BEGIN')
 *       ... các query ...
 *       await client.query('COMMIT')
 *       client.release()
 */
const getClient = () => pool.connect();

/**
 * Query có RLS context – dùng cho các query cần PostgreSQL RLS hoạt động đúng.
 *
 * Cơ chế: lấy một dedicated client từ pool, SET LOCAL app.current_employee_id
 * và app.current_branch_id trong một transaction ngắn, chạy query thực sự trên
 * CÙNG connection đó, rồi release. SET LOCAL đảm bảo config chỉ sống trong
 * transaction này và không leak sang request khác dù pool tái dùng connection.
 *
 * Dùng thay thế db.query() ở các controller cần RLS:
 *   await db.queryCtx(req, `SELECT ...`, [params])
 *
 * @param {object} req    - Express request (cần req.user.maNV và req.user.maCN)
 * @param {string} text   - SQL query string
 * @param {Array}  params - Query parameters
 * @returns {Promise<QueryResult>}
 */
const queryCtx = async (req, text, params) => {
  const maNV = req?.user?.maNV ? String(req.user.maNV) : '';
  const maCN = req?.user?.maCN ? String(req.user.maCN) : '';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.current_employee_id', $1, true),
              set_config('app.current_branch_id',   $2, true)`,
      [maNV, maCN]
    );
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { query, getClient, pool, queryCtx };
