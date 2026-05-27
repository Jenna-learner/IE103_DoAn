/**
 * Controller: NHACUNGCAP (Nhà cung cấp)
 */
const db = require('../config/db');
const { success, error } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { trangThai = 'Active' } = req.query;
    const { rows } = await db.query(
      `SELECT * FROM NHACUNGCAP WHERE TrangThai = $1 ORDER BY TenNCC`, [trangThai]
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM NHACUNGCAP WHERE MaNCC = $1`, [req.params.maNCC]);
    if (!rows[0]) return error(res, 'Nhà cung cấp không tồn tại.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { MaNCC, TenNCC, NguoiLienHe, SDT, Email, DiaChi } = req.body;
    await db.query(
      `INSERT INTO NHACUNGCAP (MaNCC, TenNCC, NguoiLienHe, SDT, Email, DiaChi)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [MaNCC, TenNCC, NguoiLienHe, SDT, Email, DiaChi]
    );
    return success(res, { MaNCC }, 'Thêm nhà cung cấp thành công', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { TenNCC, NguoiLienHe, SDT, Email, DiaChi, TrangThai } = req.body;
    await db.query(
      `UPDATE NHACUNGCAP SET TenNCC=$1, NguoiLienHe=$2, SDT=$3, Email=$4, DiaChi=$5, TrangThai=$6
       WHERE MaNCC=$7`,
      [TenNCC, NguoiLienHe, SDT, Email, DiaChi, TrangThai, req.params.maNCC]
    );
    return success(res, null, 'Cập nhật nhà cung cấp thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update };
