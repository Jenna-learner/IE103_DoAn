/**
 * Controller: PHIEUCHI (Phiếu chi vận hành)
 * Bảng: PHIEUCHI
 * MaPC ở đây là VARCHAR (khác PHANCONG.MaPC là SERIAL)
 * TrangThai: Pending | Approved | Rejected
 * LoaiChi: text tự do (Điện, Nước, Lương thời vụ, Vệ sinh, Marketing, Khác...)
 */
const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error } = require('../utils/response');

// GET /api/v1/phieu-chi?maCN=&thang=YYYY-MM&trangThai=
const getAll = async (req, res, next) => {
  try {
    const { trangThai, thang } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const params = [];
    const conds = [];

    if (maCN)      { params.push(maCN);   conds.push(`pc.MaCN = $${params.length}`); }
    if (trangThai) { params.push(trangThai); conds.push(`pc.TrangThai = $${params.length}`); }
    if (thang)     { params.push(thang);    conds.push(`TO_CHAR(pc.NgayChi,'YYYY-MM') = $${params.length}`); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const { rows } = await db.query(
      `SELECT pc.*, nv.HoTen AS TenNhanVienLap, cn.TenCN
       FROM PHIEUCHI pc
       LEFT JOIN NHANVIEN nv ON nv.MaNV = pc.MaNVLap
       LEFT JOIN CHINHANH cn ON cn.MaCN = pc.MaCN
       ${where}
       ORDER BY pc.NgayChi DESC`,
      params
    );

    // Tính tổng tiền trong kết quả
    const tongSoTien = rows.reduce((sum, r) => sum + parseFloat(r.sotien || 0), 0);
    return success(res, { items: rows, tongSoTien });
  } catch (err) { next(err); }
};

// POST /api/v1/phieu-chi  (Tạo phiếu chi)
const create = async (req, res, next) => {
  try {
    const { MaCN, NgayChi, LoaiChi, SoTien, MoTa } = req.body;
    const MaPC = genMa('PC');
    const maCN = MaCN || req.user.maCN;

    await db.query(
      `INSERT INTO PHIEUCHI (MaPC, MaCN, MaNVLap, NgayChi, LoaiChi, SoTien, MoTa, TrangThai)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending')`,
      [MaPC, maCN, req.user.maNV, NgayChi || new Date().toISOString().split('T')[0], LoaiChi, SoTien, MoTa]
    );
    return success(res, { MaPC }, 'Tạo phiếu chi thành công', 201);
  } catch (err) { next(err); }
};

// PATCH /api/v1/phieu-chi/:maPC/duyet
const duyet = async (req, res, next) => {
  try {
    await db.query(`UPDATE PHIEUCHI SET TrangThai = 'Approved' WHERE MaPC = $1`, [req.params.maPC]);
    return success(res, null, 'Phiếu chi đã được duyệt');
  } catch (err) { next(err); }
};

// PATCH /api/v1/phieu-chi/:maPC/tu-choi
const tuChoi = async (req, res, next) => {
  try {
    await db.query(`UPDATE PHIEUCHI SET TrangThai = 'Rejected' WHERE MaPC = $1`, [req.params.maPC]);
    return success(res, null, 'Phiếu chi đã bị từ chối');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, duyet, tuChoi };
