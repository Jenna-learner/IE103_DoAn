const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error } = require('../utils/response');

const EXPENSE_TYPE_MAP = {
  Electricity: 'Điện',
  Water: 'Nước',
  Internet: 'Internet',
  Premises: 'Mặt bằng',
  'Maintenance & Repair': 'Bảo trì',
  'Marketing & Advertising': 'Marketing',
  'Taxes & Fees': 'Thuế & phí',
  'Other expenses': 'Khác',
};

const EXPENSE_TYPE_INPUT = {
  Điện: 'Electricity',
  Nước: 'Water',
  Internet: 'Internet',
  'Mặt bằng': 'Premises',
  'Bảo trì': 'Maintenance & Repair',
  Marketing: 'Marketing & Advertising',
  'Thuế & phí': 'Taxes & Fees',
  Khác: 'Other expenses',
};

function normalizeLoaiChi(value) {
  return EXPENSE_TYPE_INPUT[value] || value;
}

const getAll = async (req, res, next) => {
  try {
    const { trangThai, thang } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const params = [];
    const conds = [];

    if (maCN) { params.push(maCN); conds.push(`pc.MaCN = $${params.length}`); }
    if (trangThai) { params.push(trangThai); conds.push(`pc.TrangThai = $${params.length}`); }
    if (thang) { params.push(thang); conds.push(`TO_CHAR(pc.NgayChi,'YYYY-MM') = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT pc.*, nv.HoTen AS TenNhanVienLap, cn.TenCN
       FROM PHIEUCHI pc
       LEFT JOIN NHANVIEN nv ON nv.MaNV = pc.MaNV
       LEFT JOIN CHINHANH cn ON cn.MaCN = pc.MaCN
       ${where}
       ORDER BY pc.NgayChi DESC`,
      params
    );

    const normalized = rows.map((row) => ({
      ...row,
      LoaiChiHienThi: EXPENSE_TYPE_MAP[row.loaichi] || row.LoaiChi || row.loaichi,
    }));

    const tongSoTien = normalized.reduce((sum, r) => sum + parseFloat(r.sotien || 0), 0);
    return success(res, { items: normalized, tongSoTien });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { MaCN, NgayChi, LoaiChi, SoTien, MoTa } = req.body;
    const MaPC = genMa('PC');
    const maCN = MaCN || req.user.maCN;
    const loaiChiDb = normalizeLoaiChi(LoaiChi);

    if (!maCN) return error(res, 'Không xác định được chi nhánh lập phiếu chi.', 400);

    await db.query(
      `INSERT INTO PHIEUCHI (MaPC, MaCN, MaNV, NgayChi, LoaiChi, SoTien, MoTa, TrangThai)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending')`,
      [MaPC, maCN, req.user.maNV, NgayChi || new Date().toISOString(), loaiChiDb, SoTien, MoTa || null]
    );
    return success(res, { MaPC }, 'Tạo phiếu chi thành công', 201);
  } catch (err) { next(err); }
};

const duyet = async (req, res, next) => {
  try {
    await db.query(`UPDATE PHIEUCHI SET TrangThai = 'Approved' WHERE MaPC = $1`, [req.params.maPC]);
    return success(res, null, 'Phiếu chi đã được duyệt');
  } catch (err) { next(err); }
};

const tuChoi = async (req, res, next) => {
  try {
    await db.query(`UPDATE PHIEUCHI SET TrangThai = 'Rejected' WHERE MaPC = $1`, [req.params.maPC]);
    return success(res, null, 'Phiếu chi đã bị từ chối');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, duyet, tuChoi };
