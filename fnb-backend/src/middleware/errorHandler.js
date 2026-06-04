/**
 * Global Error Handler Middleware
 * Đặt cuối cùng trong server.js
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url} →`, err.message);

  // PostgreSQL error codes
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Dữ liệu bị trùng với bản ghi đã có. Vui lòng kiểm tra lại mã, tên hoặc tài khoản liên quan.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Không thể lưu hoặc cập nhật vì dữ liệu này đang tham chiếu tới bản ghi khác hoặc bản ghi liên quan không tồn tại.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống, vui lòng thử lại.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
