const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { success, error } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { maBP, trangThai = 'Active' } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const params = [];
    const conds = [];

    if (maCN) { params.push(maCN); conds.push(`nc.MaCN = $${params.length}`); }
    if (maBP) { params.push(maBP); conds.push(`nv.MaBP = $${params.length}`); }
    if (trangThai) { params.push(trangThai); conds.push(`nv.TrangThai = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT nv.MaNV, nv.HoTen, nv.SDT, nv.Email, nv.DonGiaCa AS LuongCoBan, nv.TrangThai,
              bp.TenBP, nc.MaCN, cn.TenCN,
              tk.TenDangNhap, tk.VaiTro, tk.IsActive AS TaiKhoanActive
       FROM NHANVIEN nv
       LEFT JOIN BOPHAN bp ON bp.MaBP = nv.MaBP
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV AND nc.DenNgay IS NULL
       LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN
       LEFT JOIN TAIKHOAN tk ON tk.MaNV = nv.MaNV
       ${where}
       ORDER BY nv.HoTen`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT nv.*, bp.TenBP, nc.MaCN, cn.TenCN, tk.TenDangNhap, tk.VaiTro
       FROM NHANVIEN nv
       LEFT JOIN BOPHAN bp ON bp.MaBP = nv.MaBP
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV AND nc.DenNgay IS NULL
       LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN
       LEFT JOIN TAIKHOAN tk ON tk.MaNV = nv.MaNV
       WHERE nv.MaNV = $1`,
      [req.params.maNV]
    );
    if (!rows[0]) return error(res, 'Nhân viên không tồn tại.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaNV, HoTen, MaBP, SDT, Email, DonGiaCa, LuongCoBan, MaCN, TenDangNhap, MatKhau, VaiTro } = req.body;
    const luong = DonGiaCa || LuongCoBan;

    await client.query(
      `INSERT INTO NHANVIEN (MaNV, HoTen, MaBP, SDT, Email, DonGiaCa)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [MaNV, HoTen, MaBP, SDT, Email, luong]
    );

    if (MaCN) {
      await client.query(`INSERT INTO NHANVIEN_CHINHANH (MaNV, MaCN) VALUES ($1,$2)`, [MaNV, MaCN]);
    }

    if (TenDangNhap && MatKhau) {
      const hash = await bcrypt.hash(MatKhau, 10);
      await client.query(`INSERT INTO TAIKHOAN (MaNV, TenDangNhap, MatKhau, VaiTro) VALUES ($1,$2,$3,$4)`, [MaNV, TenDangNhap, hash, VaiTro || 'thu_ngan']);
    }

    await client.query('COMMIT');
    return success(res, { MaNV }, 'Thêm nhân viên thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

const update = async (req, res, next) => {
  try {
    const { HoTen, MaBP, SDT, Email, DonGiaCa, LuongCoBan, TrangThai } = req.body;
    await db.query(
      `UPDATE NHANVIEN SET HoTen=$1, MaBP=$2, SDT=$3, Email=$4, DonGiaCa=$5, TrangThai=$6, UpdatedAt=NOW() WHERE MaNV=$7`,
      [HoTen, MaBP, SDT, Email, DonGiaCa || LuongCoBan, TrangThai, req.params.maNV]
    );
    return success(res, null, 'Cập nhật nhân viên thành công');
  } catch (err) { next(err); }
};

const datLaiMatKhau = async (req, res, next) => {
  try {
    const { MatKhauMoi } = req.body;
    const hash = await bcrypt.hash(MatKhauMoi, 10);
    await db.query(`UPDATE TAIKHOAN SET MatKhau = $1, UpdatedAt=NOW() WHERE MaNV = $2`, [hash, req.params.maNV]);
    return success(res, null, 'Đã đặt lại mật khẩu thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, datLaiMatKhau };
