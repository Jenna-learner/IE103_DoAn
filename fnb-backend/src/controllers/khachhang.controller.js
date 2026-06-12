const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error, paginated } = require('../utils/response');

const mapRow = (r) => ({
  MaKH:          r.makh,
  TenKH:         r.tenkh,
  SDT:           r.sdt,
  Email:         r.email,
  DiemTichLuy:   parseInt(r.diemtichluy  || 0),
  HangThanhVien: r.hangthanhvien,
  TrangThai:     r.trangthai,
  NgayThamGia:   r.createdat,
  TongDonHang:   parseInt(r.tongdonhang  || 0),
  TongChiTieu:   parseFloat(r.tongchitieu || 0),
});

const mapSimple = (r) => ({
  MaKH:          r.makh,
  TenKH:         r.tenkh,
  SDT:           r.sdt,
  Email:         r.email,
  DiemTichLuy:   parseInt(r.diemtichluy  || 0),
  HangThanhVien: r.hangthanhvien,
  TrangThai:     r.trangthai,
});

const getAll = async (req, res, next) => {
  try {
    const { sdt, hang, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    if (sdt)  { params.push(`%${sdt}%`); conds.push(`k.SDT ILIKE $${params.length}`); }
    if (hang) { params.push(hang);        conds.push(`k.HangThanhVien = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await req.db.query(
      `SELECT k.MaKH, k.HoTen AS TenKH, k.SDT, k.Email,
              k.DiemTichLuy, k.HangThanhVien, k.TrangThai, k.CreatedAt,
              COUNT(hd.MaHD)              AS TongDonHang,
              COALESCE(SUM(hd.TongThanhToan), 0) AS TongChiTieu
       FROM KHACHHANG k
       LEFT JOIN HOADON hd ON hd.MaKH = k.MaKH AND hd.TrangThai = 'Completed'
       ${where}
       GROUP BY k.MaKH, k.HoTen, k.SDT, k.Email, k.DiemTichLuy, k.HangThanhVien, k.TrangThai, k.CreatedAt
       ORDER BY k.DiemTichLuy DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const { rows: cr } = await req.db.query(`SELECT COUNT(*) FROM KHACHHANG k ${where}`, params.slice(0, -2));
    return paginated(res, rows.map(mapRow), parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

const traCuu = async (req, res, next) => {
  try {
    const { sdt } = req.query;
    if (!sdt) return error(res, 'Vui lòng nhập số điện thoại.', 400);
    const { rows } = await req.db.query(
      `SELECT MaKH, HoTen AS TenKH, SDT, Email, DiemTichLuy, HangThanhVien, TrangThai
       FROM KHACHHANG WHERE SDT = $1`,
      [sdt]
    );
    return success(res, rows[0] ? mapSimple(rows[0]) : null);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await req.db.query(
      `SELECT MaKH, HoTen AS TenKH, SDT, Email, DiemTichLuy, HangThanhVien, TrangThai
       FROM KHACHHANG WHERE MaKH = $1`,
      [req.params.maKH]
    );
    if (!rows[0]) return error(res, 'Không tìm thấy khách hàng.', 404);
    return success(res, mapSimple(rows[0]));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { TenKH, SDT, Email } = req.body;
    const { rows: duplicated } = await req.db.query(
      `SELECT 1
       FROM KHACHHANG
       WHERE ($1 <> '' AND SDT = $1)
          OR ($2 <> '' AND LOWER(COALESCE(Email, '')) = LOWER($2))
       LIMIT 1`,
      [SDT || '', Email || '']
    );
    if (duplicated.length > 0) {
      return error(res, 'Số điện thoại hoặc email khách hàng đã tồn tại.', 409);
    }

    const MaKH = genMa('KH');
    await req.db.query(`INSERT INTO KHACHHANG (MaKH, HoTen, SDT, Email) VALUES ($1,$2,$3,$4)`, [MaKH, TenKH, SDT, Email]);
    return success(res, { MaKH, TenKH, SDT, HangThanhVien: 'Đồng', DiemTichLuy: 0 }, 'Đăng ký khách hàng thành công', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    // Chỉ cho phép cập nhật TenKH và Email.
    // DiemTichLuy và HangThanhVien do hệ thống tự tính — không role nào được chỉnh thủ công.
    const { TenKH, Email } = req.body;

    const { rows: duplicated } = await req.db.query(
      `SELECT 1
       FROM KHACHHANG
       WHERE MaKH <> $1
         AND ($2 <> '' AND LOWER(COALESCE(Email, '')) = LOWER($2))
       LIMIT 1`,
      [req.params.maKH, Email || '']
    );
    if (duplicated.length > 0) {
      return error(res, 'Email khách hàng đã tồn tại.', 409);
    }

    await req.db.query(
      `UPDATE KHACHHANG SET HoTen = $1, Email = $2, UpdatedAt = NOW() WHERE MaKH = $3`,
      [TenKH, Email || null, req.params.maKH]
    );
    return success(res, null, 'Cập nhật thông tin khách hàng thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, traCuu, getById, create, update };
