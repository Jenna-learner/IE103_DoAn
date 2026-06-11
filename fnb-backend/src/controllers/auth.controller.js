const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { success, error } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { tenDangNhap, matKhau } = req.body;
    if (!tenDangNhap || !matKhau) return error(res, 'Vui lòng nhập tên đăng nhập và mật khẩu.', 400);

    const { rows } = await db.query(
      `SELECT tk.*, nv.HoTen, nv.MaBP, nc.MaCN, cn.TenCN
       FROM TAIKHOAN tk
       JOIN NHANVIEN nv ON nv.MaNV = tk.MaNV
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV AND nc.DenNgay IS NULL
       LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN
       WHERE tk.TenDangNhap = $1 AND tk.IsActive = TRUE AND nv.TrangThai = 'Active'
       LIMIT 1`,
      [tenDangNhap]
    );

    const tk = rows[0];
    if (!tk) return error(res, 'Tài khoản không tồn tại hoặc đã bị khoá.', 401);

    const isMatch = await bcrypt.compare(matKhau, tk.matkhau);
    if (!isMatch) return error(res, 'Sai mật khẩu.', 401);

    const payload = {
      maTK: tk.matk,
      maNV: tk.manv,
      tenDangNhap: tk.tendangnhap,
      vaiTro: tk.vaitro,
      maCN: tk.macn || null,
      tenCN: tk.tencn || null,
      hoTen: tk.hoten,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    return success(res, { token, user: payload }, 'Đăng nhập thành công');
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const { rows } = await req.db.query(
      `SELECT tk.TenDangNhap, tk.VaiTro, nv.MaNV, nv.HoTen, nv.SDT, nv.Email, nv.MaBP,
              nc.MaCN, cn.TenCN
       FROM TAIKHOAN tk
       JOIN NHANVIEN nv ON nv.MaNV = tk.MaNV
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV AND nc.DenNgay IS NULL
       LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN
       WHERE tk.MaTK = $1 LIMIT 1`,
      [req.user.maTK]
    );
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

const doiMatKhau = async (req, res, next) => {
  try {
    const { matKhauCu, matKhauMoi } = req.body;
    const { rows } = await req.db.query(`SELECT MatKhau FROM TAIKHOAN WHERE MaTK = $1`, [req.user.maTK]);
    const isMatch = await bcrypt.compare(matKhauCu, rows[0].matkhau);
    if (!isMatch) return error(res, 'Mật khẩu cũ không đúng.', 400);

    const hash = await bcrypt.hash(matKhauMoi, 10);
    await req.db.query(`UPDATE TAIKHOAN SET MatKhau = $1, UpdatedAt=NOW() WHERE MaTK = $2`, [hash, req.user.maTK]);
    return success(res, null, 'Đổi mật khẩu thành công');
  } catch (err) { next(err); }
};

module.exports = { login, getMe, doiMatKhau };
