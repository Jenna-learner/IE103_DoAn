/**
 * Controller: NHANVIEN (Nhân viên)
 * Bảng: NHANVIEN, NHANVIEN_CHINHANH, BOPHAN, TAIKHOAN
 */
const bcrypt = require('bcryptjs');
const db     = require('../config/db');
const { success, error } = require('../utils/response');

// GET /api/v1/nhan-vien?maCN=&bophan=&trangThai=Active
const getAll = async (req, res, next) => {
  try {
    const { maBP, trangThai = 'Active' } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const params = [];
    const conds = [];

    if (maCN)      { params.push(maCN);      conds.push(`nc.MaCN = $${params.length}`); }
    if (maBP)      { params.push(maBP);       conds.push(`nv.MaBP = $${params.length}`); }
    if (trangThai) { params.push(trangThai);  conds.push(`nv.TrangThai = $${params.length}`); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const { rows } = await db.query(
      `SELECT nv.MaNV, nv.HoTen, nv.SDT, nv.Email, nv.ChucVu, nv.LuongCoBan, nv.TrangThai,
              bp.TenBP, nc.MaCN, cn.TenCN,
              tk.TenDangNhap, tk.VaiTro, tk.IsActive AS TaiKhoanActive
       FROM NHANVIEN nv
       LEFT JOIN BOPHAN bp ON bp.MaBP = nv.MaBP
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV
       LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN
       LEFT JOIN TAIKHOAN tk ON tk.MaNV = nv.MaNV
       ${where}
       ORDER BY nv.HoTen`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/nhan-vien/:maNV
const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT nv.*, bp.TenBP, nc.MaCN, cn.TenCN, tk.TenDangNhap, tk.VaiTro
       FROM NHANVIEN nv
       LEFT JOIN BOPHAN bp ON bp.MaBP = nv.MaBP
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV
       LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN
       LEFT JOIN TAIKHOAN tk ON tk.MaNV = nv.MaNV
       WHERE nv.MaNV = $1`, [req.params.maNV]
    );
    if (!rows[0]) return error(res, 'Nhân viên không tồn tại.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

// POST /api/v1/nhan-vien  (Thêm nhân viên + tài khoản đăng nhập)
const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaNV, HoTen, MaBP, SDT, Email, ChucVu, LuongCoBan, MaCN,
            TenDangNhap, MatKhau, VaiTro } = req.body;

    // 1. Tạo nhân viên
    await client.query(
      `INSERT INTO NHANVIEN (MaNV, HoTen, MaBP, SDT, Email, ChucVu, LuongCoBan)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [MaNV, HoTen, MaBP, SDT, Email, ChucVu, LuongCoBan]
    );

    // 2. Gắn vào chi nhánh
    if (MaCN) {
      await client.query(
        `INSERT INTO NHANVIEN_CHINHANH (MaNV, MaCN) VALUES ($1,$2)`, [MaNV, MaCN]
      );
    }

    // 3. Tạo tài khoản đăng nhập (nếu cung cấp)
    if (TenDangNhap && MatKhau) {
      const hash = await bcrypt.hash(MatKhau, 10);
      await client.query(
        `INSERT INTO TAIKHOAN (MaNV, TenDangNhap, MatKhau, VaiTro) VALUES ($1,$2,$3,$4)`,
        [MaNV, TenDangNhap, hash, VaiTro || 'thu_ngan']
      );
    }

    await client.query('COMMIT');
    return success(res, { MaNV }, 'Thêm nhân viên thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PUT /api/v1/nhan-vien/:maNV
const update = async (req, res, next) => {
  try {
    const { HoTen, MaBP, SDT, Email, ChucVu, LuongCoBan, TrangThai } = req.body;
    await db.query(
      `UPDATE NHANVIEN SET HoTen=$1, MaBP=$2, SDT=$3, Email=$4, ChucVu=$5, LuongCoBan=$6, TrangThai=$7
       WHERE MaNV=$8`,
      [HoTen, MaBP, SDT, Email, ChucVu, LuongCoBan, TrangThai, req.params.maNV]
    );
    return success(res, null, 'Cập nhật nhân viên thành công');
  } catch (err) { next(err); }
};

// PATCH /api/v1/nhan-vien/:maNV/dat-lai-mat-khau  (Admin reset)
const datLaiMatKhau = async (req, res, next) => {
  try {
    const { MatKhauMoi } = req.body;
    const hash = await bcrypt.hash(MatKhauMoi, 10);
    await db.query(`UPDATE TAIKHOAN SET MatKhau = $1 WHERE MaNV = $2`, [hash, req.params.maNV]);
    return success(res, null, 'Đã đặt lại mật khẩu thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, datLaiMatKhau };
