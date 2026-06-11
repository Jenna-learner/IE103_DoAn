const db = require('../config/db');
const { success, error, paginated } = require('../utils/response');

const toDbStatus = (s) => {
  if (s === 'Đang bán') return 'Available';
  if (s === 'Ngừng bán') return 'Hidden';
  if (s === 'Hết món') return 'OutOfStock';
  if (s === 'Active') return 'Available';
  if (s === 'Inactive') return 'Hidden';
  if (s === 'Out of stock') return 'OutOfStock';
  return s || 'Available';
};

const fromDbStatus = (s) => {
  if (s === 'Available') return 'Đang bán';
  if (s === 'Hidden') return 'Ngừng bán';
  if (s === 'OutOfStock') return 'Hết món';
  return s;
};

const validateRecipe = (congthuc = []) => {
  const seen = new Set();
  for (const item of congthuc) {
    if (!item.MaNL) continue;
    if (seen.has(item.MaNL)) return 'Không được chọn trùng nguyên liệu trong cùng một công thức.';
    if (Number(item.SoLuongLuong) <= 0) return 'Định mức nguyên liệu phải lớn hơn 0.';
    seen.add(item.MaNL);
  }
  return null;
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

    const { rows } = await req.db.query(
      `SELECT sp.MaSP, sp.TenSP, sp.GiaBanMacDinh AS GiaBan, sp.TrangThai, lsp.MaLoai, lsp.TenLoai
       FROM SANPHAM sp
       LEFT JOIN LOAISANPHAM lsp ON lsp.MaLoai = sp.MaLoai
       ${where}
       ORDER BY lsp.TenLoai, sp.TenSP
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const { rows: cr } = await req.db.query(`SELECT COUNT(*) FROM SANPHAM sp ${where}`, params.slice(0, -2));
    const data = rows.map((r) => ({ ...r, TrangThai: fromDbStatus(r.trangthai || r.TrangThai) }));
    return paginated(res, data, parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await req.db.query(
      `SELECT sp.MaSP, sp.TenSP, sp.MoTa, sp.GiaBanMacDinh AS GiaBan, sp.TrangThai, sp.MaLoai, lsp.TenLoai
       FROM SANPHAM sp
       LEFT JOIN LOAISANPHAM lsp ON lsp.MaLoai = sp.MaLoai
       WHERE sp.MaSP = $1`,
      [req.params.maSP]
    );
    if (!rows[0]) return error(res, 'Sản phẩm không tồn tại.', 404);

    const { rows: congthuc } = await req.db.query(
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
  const client = await req.db.getClient();
  try {
    await client.query('BEGIN');
    const { MaSP, TenSP, MaLoai, GiaBan, TrangThai = 'Active', congthuc = [] } = req.body;
    const recipeError = validateRecipe(congthuc);
    if (recipeError) {
      await client.query('ROLLBACK');
      return error(res, recipeError, 400);
    }

    const { rows: duplicated } = await client.query(
      `SELECT 1 FROM SANPHAM WHERE MaSP = $1 OR LOWER(TenSP) = LOWER($2) LIMIT 1`,
      [MaSP, TenSP]
    );
    if (duplicated.length > 0) {
      await client.query('ROLLBACK');
      return error(res, 'Mã hoặc tên sản phẩm đã tồn tại. Vui lòng kiểm tra lại trước khi lưu.', 409);
    }

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
  const client = await req.db.getClient();
  try {
    await client.query('BEGIN');
    const { TenSP, MaLoai, GiaBan, TrangThai, congthuc } = req.body;
    const maSP = req.params.maSP;
    const recipeError = validateRecipe(congthuc || []);
    if (recipeError) {
      await client.query('ROLLBACK');
      return error(res, recipeError, 400);
    }

    const { rows: duplicated } = await client.query(
      `SELECT 1 FROM SANPHAM WHERE LOWER(TenSP) = LOWER($1) AND MaSP <> $2 LIMIT 1`,
      [TenSP, maSP]
    );
    if (duplicated.length > 0) {
      await client.query('ROLLBACK');
      return error(res, 'Tên sản phẩm đã tồn tại. Vui lòng dùng tên khác để tránh ghi đè dữ liệu vận hành.', 409);
    }

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
    await req.db.query(`UPDATE SANPHAM SET TrangThai = $1, UpdatedAt=NOW() WHERE MaSP = $2`, [toDbStatus(TrangThai), req.params.maSP]);
    return success(res, null, `Đã cập nhật trạng thái sản phẩm → ${TrangThai}`);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, doiTrangThai };
