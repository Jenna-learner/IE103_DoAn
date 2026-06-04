/**
 * JWT Authentication Middleware
 * Bảo vệ các route cần đăng nhập
 *
 * Vai trò hệ thống (VaiTro trong TAIKHOAN):
 *   admin              → Quản trị viên toàn hệ thống
 *   giam_doc_van_hanh  → Điều hành toàn chuỗi, xem dashboard / duyệt vận hành
 *   quan_ly_chinhanh   → Quản lý chi nhánh
 *   thu_ngan           → Thu ngân (POS)
 *   kho                → Nhân viên kho vận
 */
const jwt = require('jsonwebtoken');
const { setDbContext } = require('./dbContext');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có token xác thực.' });
  }

  try {
    // Payload: { maTK, maNV, tenDangNhap, vaiTro, maCN, hoTen }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Inject DB session context cho PostgreSQL RLS (app.current_employee_id)
    await setDbContext(req, res, next);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
    next(err);
  }
};

/**
 * Role-based authorization
 * Dùng: authorize('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.vaiTro)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này. Cần vai trò: ${roles.join(' hoặc ')}.`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
