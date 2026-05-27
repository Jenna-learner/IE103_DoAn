/**
 * PostgreSQL Connection Pool (node-postgres)
 * Kết nối qua ZeroTier One VPN Network
 */
const { Pool } = require('pg');
require('dotenv').config();

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

module.exports = { query, getClient, pool };
