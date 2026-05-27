/**
 * Chạy: node sql/run_setup.js
 * Tạo bảng TAIKHOAN và tài khoản admin mặc định trên DB thật
 */
require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      false,
})

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'add_taikhoan.sql'), 'utf8')
  const client = await pool.connect()
  try {
    console.log('🔗 Đang kết nối DB...')
    await client.query(sql)
    console.log('✅ Tạo bảng TAIKHOAN thành công!')
    console.log('✅ Tài khoản admin / Admin@123 đã sẵn sàng.')
  } catch (err) {
    console.error('❌ Lỗi:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
