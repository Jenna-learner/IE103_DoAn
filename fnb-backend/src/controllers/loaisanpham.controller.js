/**
 * Controller: LOAISANPHAM (Danh mục sản phẩm)
 */
const db = require('../config/db');
const { success, error } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM LOAISANPHAM ORDER BY TenLoai`);
    return success(res, rows);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { MaLoai, TenLoai, MoTa } = req.body;
    await db.query(`INSERT INTO LOAISANPHAM (MaLoai, TenLoai, MoTa) VALUES ($1,$2,$3)`, [MaLoai, TenLoai, MoTa]);
    return success(res, { MaLoai }, 'Tạo loại sản phẩm thành công', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { TenLoai, MoTa } = req.body;
    await db.query(`UPDATE LOAISANPHAM SET TenLoai=$1, MoTa=$2 WHERE MaLoai=$3`, [TenLoai, MoTa, req.params.maLoai]);
    return success(res, null, 'Cập nhật thành công');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM LOAISANPHAM WHERE MaLoai = $1`, [req.params.maLoai]);
    return success(res, null, 'Đã xoá loại sản phẩm');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, update, remove };
