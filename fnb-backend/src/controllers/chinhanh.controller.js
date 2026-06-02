/**
 * Controller: CHINHANH (Chi nhánh) + BOPHAN (Bộ phận)
 */
const db = require('../config/db');
const { success, error } = require('../utils/response');

// ── CHI NHÁNH ──────────────────────────────────────────────
const getAllCN = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM CHINHANH ORDER BY TenCN`);
    return success(res, rows);
  } catch (err) { next(err); }
};

const createCN = async (req, res, next) => {
  try {
    const { MaCN, TenCN, DiaChi, SDT, Email } = req.body;
    await db.query(
      `INSERT INTO CHINHANH (MaCN, TenCN, DiaChi, SDT, Email) VALUES ($1,$2,$3,$4,$5)`,
      [MaCN, TenCN, DiaChi, SDT, Email]
    );
    return success(res, { MaCN }, 'Thêm chi nhánh thành công', 201);
  } catch (err) { next(err); }
};

const updateCN = async (req, res, next) => {
  try {
    const { TenCN, DiaChi, SDT, Email, TrangThai } = req.body;
    await db.query(
      `UPDATE CHINHANH SET TenCN=$1, DiaChi=$2, SDT=$3, Email=$4, TrangThai=$5 WHERE MaCN=$6`,
      [TenCN, DiaChi, SDT, Email, TrangThai, req.params.maCN]
    );
    return success(res, null, 'Cập nhật chi nhánh thành công');
  } catch (err) { next(err); }
};

// ── BỘ PHẬN ────────────────────────────────────────────────
const getAllBP = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM BOPHAN ORDER BY TenBP`);
    return success(res, rows);
  } catch (err) { next(err); }
};

const createBP = async (req, res, next) => {
  try {
    const { MaBP, TenBP, MoTa } = req.body;
    await db.query(`INSERT INTO BOPHAN (MaBP, TenBP, MoTa) VALUES ($1,$2,$3)`, [MaBP, TenBP, MoTa]);
    return success(res, { MaBP }, 'Thêm bộ phận thành công', 201);
  } catch (err) { next(err); }
};

module.exports = { getAllCN, createCN, updateCN, getAllBP, createBP };
