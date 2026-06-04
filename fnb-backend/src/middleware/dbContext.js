/**
 * DB Context Middleware
 * Set session-level config cho PostgreSQL RLS policies.
 *
 * Sau khi authenticate() decode JWT, middleware này sẽ:
 * 1. Set `app.current_employee_id` → dùng bởi fn_get_current_user_branches() và RLS policies.
 * 2. Set `app.current_branch_id`   → tiện dùng cho logging/audit nếu cần.
 *
 * Phải được đặt SAU authenticate() trong middleware chain của mỗi route cần bảo vệ.
 *
 * Lưu ý: set_config() chỉ có hiệu lực trong session của connection đó (node-postgres pool).
 * Vì pool tái sử dụng connection, chúng ta phải set trong mỗi request, không phải một lần.
 * Cách an toàn nhất là dùng một client riêng hoặc set ngay trong transaction của request.
 * Ở đây ta dùng pool.query() để set trước khi trả next() – điều này đủ cho pool shared.
 *
 * Giới hạn: khi pool tái dùng connection cho nhiều request đồng thời, cấu hình session
 * có thể bị overwrite. Để RLS thật sự an toàn trong production, cần chuyển sang
 * per-request client (getClient) hoặc dùng SET LOCAL trong transaction.
 * Trong phạm vi dự án học thuật này, set_config với is_local=false là đủ.
 */
const { pool } = require('../config/db');

const setDbContext = async (req, res, next) => {
  // Nếu chưa có user (chưa qua authenticate), bỏ qua
  if (!req.user || !req.user.maNV) return next();

  try {
    // Sử dụng set_config để gán context session-level cho PostgreSQL
    // Tham số thứ 3 = false: tồn tại cả session (không chỉ transaction hiện tại)
    await pool.query(
      `SELECT
         set_config('app.current_employee_id', $1::TEXT, false),
         set_config('app.current_branch_id',   $2::TEXT, false)`,
      [
        String(req.user.maNV),
        String(req.user.maCN || ''),
      ]
    );
    next();
  } catch (err) {
    // Không chặn request nếu set_config lỗi – chỉ log cảnh báo
    // (RLS vẫn sẽ hoạt động ở app-level scoping trong controller)
    console.warn('[dbContext] Không thể set DB session config:', err.message);
    next();
  }
};

module.exports = { setDbContext };
