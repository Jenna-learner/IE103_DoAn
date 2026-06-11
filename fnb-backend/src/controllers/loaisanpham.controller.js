/**
 * Controller: LOAISANPHAM (Danh mục sản phẩm)
 */
const db = require('../config/db');
const { success, error } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { rows } = await req.db.query(`SELECT * FROM LOAISANPHAM ORDER BY TenLoai`);
    return success(res, rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { MaLoai, TenLoai, MoTa } = req.body;
    const { rows: duplicated } = await req.db.query(
      `SELECT 1
       FROM LOAISANPHAM
       WHERE MaLoai = $1 OR LOWER(TenLoai) = LOWER($2)
       LIMIT 1`,
      [MaLoai, TenLoai]
    );
    if (duplicated.length > 0) return error(res, 'Mã loại hoặc tên loại sản phẩm đã tồn tại.', 409);

    await req.db.query(`INSERT INTO LOAISANPHAM (MaLoai, TenLoai, MoTa) VALUES ($1,$2,$3)`, [MaLoai, TenLoai, MoTa]);
    return success(res, { MaLoai }, 'Tạo loại sản phẩm thành công', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { TenLoai, MoTa } = req.body;
    const { rows: duplicated } = await req.db.query(
      `SELECT 1
       FROM LOAISANPHAM
       WHERE MaLoai <> $1 AND LOWER(TenLoai) = LOWER($2)
       LIMIT 1`,
      [req.params.maLoai, TenLoai]
    );
    if (duplicated.length > 0) return error(res, 'Tên loại sản phẩm đã tồn tại.', 409);

    await req.db.query(`UPDATE LOAISANPHAM SET TenLoai=$1, MoTa=$2 WHERE MaLoai=$3`, [TenLoai, MoTa, req.params.maLoai]);
    return success(res, null, 'Cập nhật thành công');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { rows: related } = await req.db.query(
      `SELECT COUNT(*) AS product_count
       FROM SANPHAM
       WHERE MaLoai = $1`,
      [req.params.maLoai]
    );
    if (Number(related[0]?.product_count || 0) > 0) {
      return error(res, 'Loại sản phẩm đang được sử dụng bởi sản phẩm hiện có. Vui lòng chuyển hoặc xoá sản phẩm liên quan trước.', 409);
    }

    await req.db.query(`DELETE FROM LOAISANPHAM WHERE MaLoai = $1`, [req.params.maLoai]);
    return success(res, null, 'Đã xoá loại sản phẩm');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
