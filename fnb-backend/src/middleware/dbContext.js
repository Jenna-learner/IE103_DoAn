/**
 * DB Context Middleware (no-op placeholder)
 *
 * Trước đây middleware này cố gọi pool.query(set_config...) nhưng cách đó sai:
 * set_config chạy trên connection bất kỳ từ pool, còn controllers dùng connection khác
 * → context không bao giờ được truyền đúng đến query thực sự.
 *
 * Giải pháp đúng đã được triển khai tại db.queryCtx(req, sql, params) trong src/config/db.js:
 * - Lấy dedicated client từ pool
 * - SET LOCAL app.current_employee_id và app.current_branch_id (is_local=TRUE → chỉ sống trong transaction)
 * - Chạy query thực sự trên CÙNG client đó
 * - Release sau khi xong
 *
 * Các controller cần RLS scoping phải dùng db.queryCtx(req, ...) thay vì db.query(...).
 * Controllers không cần RLS (sanpham, loaisanpham, khachhang...) dùng db.query() như cũ.
 *
 * File này giữ lại để không phá vỡ import trong auth.js.
 */

const setDbContext = async (req, res, next) => next();

module.exports = { setDbContext };
