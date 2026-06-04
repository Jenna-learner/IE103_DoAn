/**
 * Controller: NHACUNGCAP (Nhà cung cấp)
 */
const db = require('../config/db');
const { success, error } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { trangThai = 'Active' } = req.query;
    const params = [];
    let query = `SELECT * FROM NHACUNGCAP`;

    if (trangThai && trangThai !== 'all') {
      params.push(trangThai);
      query += ` WHERE TrangThai = $${params.length}`;
    }

    query += ` ORDER BY TenNCC`;
    const { rows } = await db.query(query, params);
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

    const { rows: duplicated } = await db.query(
      `SELECT 1
       FROM NHACUNGCAP
       WHERE MaNCC = $1
          OR LOWER(TenNCC) = LOWER($2)
          OR ($3 <> '' AND LOWER(COALESCE(Email, '')) = LOWER($3))
          OR ($4 <> '' AND COALESCE(SDT, '') = $4)
       LIMIT 1`,
      [MaNCC, TenNCC, Email || '', SDT || '']
    );
    if (duplicated.length > 0) {
      return error(res, 'Mã, tên, email hoặc số điện thoại nhà cung cấp đã tồn tại.', 409);
    }

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

    const { rows: duplicated } = await db.query(
      `SELECT 1
       FROM NHACUNGCAP
       WHERE MaNCC <> $1
         AND (
           LOWER(TenNCC) = LOWER($2)
           OR ($3 <> '' AND LOWER(COALESCE(Email, '')) = LOWER($3))
           OR ($4 <> '' AND COALESCE(SDT, '') = $4)
         )
       LIMIT 1`,
      [req.params.maNCC, TenNCC, Email || '', SDT || '']
    );
    if (duplicated.length > 0) {
      return error(res, 'Tên, email hoặc số điện thoại nhà cung cấp đã tồn tại.', 409);
    }

    if (TrangThai === 'Inactive') {
      const { rows: related } = await db.query(
        `SELECT COUNT(*) FILTER (WHERE pn.TrangThai = 'Draft') AS draft_receipts
         FROM PHIEUNHAP pn
         WHERE pn.MaNCC = $1`,
        [req.params.maNCC]
      );

      const draftReceipts = Number(related[0]?.draft_receipts || 0);
      if (draftReceipts > 0) {
        return error(res, 'Nhà cung cấp đang có phiếu nhập nháp. Vui lòng xử lý phiếu nhập trước khi ngưng hoạt động.', 409);
      }
    }

    await db.query(
      `UPDATE NHACUNGCAP SET TenNCC=$1, NguoiLienHe=$2, SDT=$3, Email=$4, DiaChi=$5, TrangThai=$6
       WHERE MaNCC=$7`,
      [TenNCC, NguoiLienHe, SDT, Email, DiaChi, TrangThai, req.params.maNCC]
    );
    return success(res, null, 'Cập nhật nhà cung cấp thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update };
