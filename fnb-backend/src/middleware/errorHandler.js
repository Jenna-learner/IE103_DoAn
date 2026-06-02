/**
 * Global Error Handler Middleware
 * Đặt cuối cùng trong server.js
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url} →`, err.message);

  // PostgreSQL error codes
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Dữ liệu đã tồn tại (duplicate key).' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Tham chiếu khóa ngoại không hợp lệ.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống, vui lòng thử lại.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
