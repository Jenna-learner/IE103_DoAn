/**
 * Controller: KHACHHANG (Khách hàng CRM)
 * Bảng: KHACHHANG
 * HangThanhVien: Bronze | Silver | Gold | Diamond (dựa vào DiemTichLuy)
 * Điểm được tích tự động bởi trigger trg_hoadon_crm khi hóa đơn = 'Completed'
 */
const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error, paginated } = require('../utils/response');

// GET /api/v1/khach-hang?sdt=&hang=&page=&limit=
const getAll = async (req, res, next) => {
  try {
    const { sdt, hang, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    if (sdt)  { params.push(`%${sdt}%`);  conds.push(`SDT ILIKE $${params.length}`); }
    if (hang) { params.push(hang);         conds.push(`HangThanhVien = $${params.length}`); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT * FROM KHACHHANG ${where} ORDER BY DiemTichLuy DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const { rows: cr } = await db.query(`SELECT COUNT(*) FROM KHACHHANG ${where}`, params.slice(0, -2));
    return paginated(res, rows, parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

// GET /api/v1/khach-hang/tra-cuu?sdt=  (tra cứu nhanh tại POS)
const traCuu = async (req, res, next) => {
  try {
    const { sdt } = req.query;
    if (!sdt) return error(res, 'Vui lòng nhập số điện thoại.', 400);
    const { rows } = await db.query(`SELECT * FROM KHACHHANG WHERE SDT = $1`, [sdt]);
    return success(res, rows[0] || null);
  } catch (err) { next(err); }
};

// GET /api/v1/khach-hang/:maKH
const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM KHACHHANG WHERE MaKH = $1`, [req.params.maKH]);
    if (!rows[0]) return error(res, 'Không tìm thấy khách hàng.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

// POST /api/v1/khach-hang  (đăng ký khách hàng mới tại quầy)
const create = async (req, res, next) => {
  try {
    const { TenKH, SDT, Email } = req.body;
    const MaKH = genMa('KH');
    await db.query(
      `INSERT INTO KHACHHANG (MaKH, TenKH, SDT, Email) VALUES ($1,$2,$3,$4)`,
      [MaKH, TenKH, SDT, Email]
    );
    return success(res, { MaKH, TenKH, SDT, HangThanhVien: 'Bronze', DiemTichLuy: 0 }, 'Đăng ký khách hàng thành công', 201);
  } catch (err) { next(err); }
};

// PUT /api/v1/khach-hang/:maKH
const update = async (req, res, next) => {
  try {
    const { TenKH, Email } = req.body;
    await db.query(`UPDATE KHACHHANG SET TenKH=$1, Email=$2 WHERE MaKH=$3`, [TenKH, Email, req.params.maKH]);
    return success(res, null, 'Cập nhật thông tin khách hàng thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, traCuu, getById, create, update };
