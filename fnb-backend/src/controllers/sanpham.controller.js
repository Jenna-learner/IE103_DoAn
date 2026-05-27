/**
 * Controller: SANPHAM (Sản phẩm / Menu)
 * Bảng: SANPHAM, LOAISANPHAM, CONGTHUC, NGUYENLIEU
 */
const db = require('../config/db');
const { success, error, paginated } = require('../utils/response');

// GET /api/v1/san-pham?maLoai=&search=&trangThai=Active&page=&limit=
const getAll = async (req, res, next) => {
  try {
    const { maLoai, search, trangThai = 'Active', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    if (trangThai) { params.push(trangThai); conds.push(`sp.TrangThai = $${params.length}`); }
    if (maLoai)    { params.push(maLoai);    conds.push(`sp.MaLoai = $${params.length}`); }
    if (search)    { params.push(`%${search}%`); conds.push(`sp.TenSP ILIKE $${params.length}`); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT sp.MaSP, sp.TenSP, sp.GiaBan, sp.TrangThai,
              lsp.MaLoai, lsp.TenLoai
       FROM SANPHAM sp
       LEFT JOIN LOAISANPHAM lsp ON lsp.MaLoai = sp.MaLoai
       ${where}
       ORDER BY lsp.TenLoai, sp.TenSP
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const { rows: cr } = await db.query(
      `SELECT COUNT(*) FROM SANPHAM sp ${where}`,
      params.slice(0, -2)
    );

    return paginated(res, rows, parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

// GET /api/v1/san-pham/:maSP
const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT sp.*, lsp.TenLoai FROM SANPHAM sp
       LEFT JOIN LOAISANPHAM lsp ON lsp.MaLoai = sp.MaLoai
       WHERE sp.MaSP = $1`,
      [req.params.maSP]
    );
    if (!rows[0]) return error(res, 'Sản phẩm không tồn tại.', 404);

    // Lấy công thức định mức
    const { rows: congthuc } = await db.query(
      `SELECT ct.MaNL, ct.SoLuongLuong, nl.TenNL, nl.DonViTinh
       FROM CONGTHUC ct
       JOIN NGUYENLIEU nl ON nl.MaNL = ct.MaNL
       WHERE ct.MaSP = $1`,
      [req.params.maSP]
    );

    return success(res, { ...rows[0], congthuc });
  } catch (err) { next(err); }
};

// POST /api/v1/san-pham
const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaSP, TenSP, MaLoai, GiaBan, TrangThai = 'Active', congthuc = [] } = req.body;
    // congthuc: [{ MaNL, SoLuongLuong }]

    await client.query(
      `INSERT INTO SANPHAM (MaSP, TenSP, MaLoai, GiaBan, TrangThai) VALUES ($1,$2,$3,$4,$5)`,
      [MaSP, TenSP, MaLoai, GiaBan, TrangThai]
    );

    for (const ct of congthuc) {
      await client.query(
        `INSERT INTO CONGTHUC (MaSP, MaNL, SoLuongLuong) VALUES ($1,$2,$3)`,
        [MaSP, ct.MaNL, ct.SoLuongLuong]
      );
    }

    await client.query('COMMIT');
    return success(res, { MaSP }, 'Thêm sản phẩm thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PUT /api/v1/san-pham/:maSP
const update = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { TenSP, MaLoai, GiaBan, TrangThai, congthuc } = req.body;
    const maSP = req.params.maSP;

    await client.query(
      `UPDATE SANPHAM SET TenSP=$1, MaLoai=$2, GiaBan=$3, TrangThai=$4 WHERE MaSP=$5`,
      [TenSP, MaLoai, GiaBan, TrangThai, maSP]
    );

    // Cập nhật công thức nếu có
    if (congthuc) {
      await client.query(`DELETE FROM CONGTHUC WHERE MaSP = $1`, [maSP]);
      for (const ct of congthuc) {
        await client.query(
          `INSERT INTO CONGTHUC (MaSP, MaNL, SoLuongLuong) VALUES ($1,$2,$3)`,
          [maSP, ct.MaNL, ct.SoLuongLuong]
        );
      }
    }

    await client.query('COMMIT');
    return success(res, null, 'Cập nhật sản phẩm thành công');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PATCH /api/v1/san-pham/:maSP/trang-thai
const doiTrangThai = async (req, res, next) => {
  try {
    const { TrangThai } = req.body; // Active | Inactive | Out of stock
    await db.query(`UPDATE SANPHAM SET TrangThai = $1 WHERE MaSP = $2`, [TrangThai, req.params.maSP]);
    return success(res, null, `Đã cập nhật trạng thái sản phẩm → ${TrangThai}`);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, doiTrangThai };
