/**
 * test-connection.js — Kiểm tra kết nối PostgreSQL
 *
 * Cách chạy:   node test-connection.js
 *
 * Dùng cấu hình trong .env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
 * Kiểm tra:
 *   1) Kết nối service/auth (user postgres trong .env) → dùng cho login/health.
 *   2) Lần lượt các DB user theo role (admin, hq, branch_manager, cashier,
 *      warehouse, hr) để biết user nào không kết nối được.
 *
 * Phân biệt lỗi:
 *   - "timeout"            → không tới được DB (VPN/ZeroTier hoặc Postgres tắt).
 *   - "password ... failed" → sai mật khẩu / user chưa tạo.
 */
require('dotenv').config();
const { Client } = require('pg');

const base = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME,
  ssl: false,
  connectionTimeoutMillis: 8000,
};

// User chính (login/health) lấy từ .env, fallback giống config/db.js
const authUser = {
  label: 'auth/service (.env)',
  user: process.env.DB_AUTH_USER || process.env.DB_USER || 'postgres',
  password: process.env.DB_AUTH_PASSWORD || process.env.DB_PASSWORD || '',
};

// Các DB user theo role (mật khẩu mặc định khớp 03_security_roles.sql)
const roleUsers = [
  { label: 'admin',           user: process.env.DB_ADMIN_USER           || 'app_admin',          password: process.env.DB_ADMIN_PASSWORD           || 'Admin@Str0ng!2026' },
  { label: 'giam_doc_van_hanh', user: process.env.DB_HQ_USER            || 'app_hq_user',        password: process.env.DB_HQ_PASSWORD              || 'HQ_Mgr!2026' },
  { label: 'quan_ly_chinhanh', user: process.env.DB_BRANCH_MANAGER_USER || 'app_manager_user',   password: process.env.DB_BRANCH_MANAGER_PASSWORD  || 'Mgr@Br4nch2026' },
  { label: 'thu_ngan',        user: process.env.DB_CASHIER_USER         || 'app_cashier_user',   password: process.env.DB_CASHIER_PASSWORD         || 'Cash!er2026' },
  { label: 'kho',             user: process.env.DB_WAREHOUSE_USER       || 'app_warehouse_user', password: process.env.DB_WAREHOUSE_PASSWORD       || 'War3house2026!' },
  { label: 'hr',              user: process.env.DB_HR_USER              || 'app_hr_user',        password: process.env.DB_HR_PASSWORD              || 'HR_Staff@2026' },
];

async function tryConnect({ label, user, password }) {
  const client = new Client({ ...base, user, password });
  const start = Date.now();
  try {
    await client.connect();
    const { rows } = await client.query('SELECT NOW() AS server_time, current_user AS who');
    const ms = Date.now() - start;
    console.log(`  ✅ ${label.padEnd(22)} OK (${ms}ms)  user=${rows[0].who}  time=${rows[0].server_time.toISOString()}`);
    return true;
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`  ❌ ${label.padEnd(22)} FAIL (${ms}ms)  ${err.message}`);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

(async () => {
  console.log('\n🔌 KIỂM TRA KẾT NỐI POSTGRESQL');
  console.log(`   Target: ${base.host}:${base.port}/${base.database}`);
  console.log(`   Timeout: ${base.connectionTimeoutMillis}ms\n`);

  if (!base.host || !base.database) {
    console.error('❗ Thiếu DB_HOST hoặc DB_NAME trong .env. Dừng.');
    process.exit(1);
  }

  console.log('1) Kết nối chính (login/health):');
  const authOk = await tryConnect(authUser);

  console.log('\n2) Các DB user theo role (dùng cho request có RLS):');
  let roleOk = 0;
  for (const u of roleUsers) {
    if (await tryConnect(u)) roleOk++;
  }

  console.log('\n──────────── KẾT QUẢ ────────────');
  console.log(`   Kết nối chính : ${authOk ? 'OK' : 'LỖI'}`);
  console.log(`   Role users    : ${roleOk}/${roleUsers.length} OK`);
  if (!authOk) {
    console.log('   → Login/health sẽ lỗi. Nếu là "timeout": kiểm tra ZeroTier/Postgres đang chạy.');
    console.log('     Nếu "password ... failed": kiểm tra DB_USER/DB_PASSWORD trong .env.');
  } else if (roleOk < roleUsers.length) {
    console.log('   → Một số trang dùng role pool sẽ lỗi. Chạy lại 03_security_roles.sql để tạo/đặt mật khẩu các app_*_user.');
  } else {
    console.log('   → Tất cả kết nối OK. 🎉');
  }
  console.log('');

  process.exit(authOk ? 0 : 1);
})();
