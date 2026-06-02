const db = require('../config/db');
const { success, error, paginated } = require('../utils/response');

const toDbStatus = (s) => {
  if (s === 'Active') return 'Available';
  if (s === 'Inactive') return 'Hidden';
  if (s === 'Out of stock') return 'OutOfStock';
  return s || 'Available';
};

const fromDbStatus = (s) => {
  if (s === 'Available') return 'Active';
  if (s === 'Hidden') return 'Inactive';
  if (s === 'OutOfStock') return 'Out of stock';
  return s;
};

const getAll = async (req, res, next) => {
  try {
    const { maLoai, search, trangThai = 'Active', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    if (trangThai) { params.push(toDbStatus(trangThai)); conds.push(`sp.TrangThai = $${params.length}`); }
    if (maLoai) { params.push(maLoai); conds.push(`sp.MaLoai = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conds.push(`sp.TenSP ILIKE $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT sp.MaSP, sp.TenSP, sp.GiaBanMacDinh AS GiaBan, sp.TrangThai, lsp.MaLoai, lsp.TenLoai
       FROM SANPHAM sp
       LEFT JOIN LOAISANPHAM lsp ON lsp.MaLoai = sp.MaLoai
       ${where}
       ORDER BY lsp.TenLoai, sp.TenSP
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const { rows: cr } = await db.query(`SELECT COUNT(*) FROM SANPHAM sp ${where}`, params.slice(0, -2));
    const data = rows.map((r) => ({ ...r, TrangThai: fromDbStatus(r.trangthai || r.TrangThai) }));
    return paginated(res, data, parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT sp.MaSP, sp.TenSP, sp.MoTa, sp.GiaBanMacDinh AS GiaBan, sp.TrangThai, sp.MaLoai, lsp.TenLoai
       FROM SANPHAM sp
       LEFT JOIN LOAISANPHAM lsp ON lsp.MaLoai = sp.MaLoai
       WHERE sp.MaSP = $1`,
      [req.params.maSP]
    );
    if (!rows[0]) return error(res, 'Sản phẩm không tồn tại.', 404);

    const { rows: congthuc } = await db.query(
      `SELECT ct.MaNL, ct.DinhMuc AS SoLuongLuong, nl.TenNL, nl.DonViTinh
       FROM CONGTHUC ct
       JOIN NGUYENLIEU nl ON nl.MaNL = ct.MaNL
       WHERE ct.MaSP = $1`,
      [req.params.maSP]
    );

    return success(res, { ...rows[0], TrangThai: fromDbStatus(rows[0].trangthai || rows[0].TrangThai), congthuc });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaSP, TenSP, MaLoai, GiaBan, TrangThai = 'Active', congthuc = [] } = req.body;

    await client.query(
      `INSERT INTO SANPHAM (MaSP, TenSP, MaLoai, GiaBanMacDinh, TrangThai) VALUES ($1,$2,$3,$4,$5)`,
      [MaSP, TenSP, MaLoai, GiaBan, toDbStatus(TrangThai)]
    );

    for (const ct of congthuc) {
      await client.query(`INSERT INTO CONGTHUC (MaSP, MaNL, DinhMuc) VALUES ($1,$2,$3)`, [MaSP, ct.MaNL, ct.SoLuongLuong]);
    }

    await client.query('COMMIT');
    return success(res, { MaSP }, 'Thêm sản phẩm thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

const update = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { TenSP, MaLoai, GiaBan, TrangThai, congthuc } = req.body;
    const maSP = req.params.maSP;

    await client.query(
      `UPDATE SANPHAM SET TenSP=$1, MaLoai=$2, GiaBanMacDinh=$3, TrangThai=$4, UpdatedAt=NOW() WHERE MaSP=$5`,
      [TenSP, MaLoai, GiaBan, toDbStatus(TrangThai), maSP]
    );

    if (congthuc) {
      await client.query(`DELETE FROM CONGTHUC WHERE MaSP = $1`, [maSP]);
      for (const ct of congthuc) {
        await client.query(`INSERT INTO CONGTHUC (MaSP, MaNL, DinhMuc) VALUES ($1,$2,$3)`, [maSP, ct.MaNL, ct.SoLuongLuong]);
      }
    }

    await client.query('COMMIT');
    return success(res, null, 'Cập nhật sản phẩm thành công');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

const doiTrangThai = async (req, res, next) => {
  try {
    const { TrangThai } = req.body;
    await db.query(`UPDATE SANPHAM SET TrangThai = $1, UpdatedAt=NOW() WHERE MaSP = $2`, [toDbStatus(TrangThai), req.params.maSP]);
    return success(res, null, `Đã cập nhật trạng thái sản phẩm → ${TrangThai}`);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, doiTrangThai };
