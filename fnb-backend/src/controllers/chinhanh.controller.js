/**
 * Controller: CHINHANH (Chi nhánh) + BOPHAN (Bộ phận)
 */
const db = require('../config/db');
const { success, error } = require('../utils/response');

// ── CHI NHÁNH ──────────────────────────────────────────────
const getAllCN = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM CHINHANH ORDER BY COALESCE(NULLIF(regexp_replace(MaCN, '\\D', '', 'g'), ''), '0')::INT, MaCN`);
    return success(res, rows);
  } catch (err) { next(err); }
};

const createCN = async (req, res, next) => {
  try {
    const { MaCN, TenCN, DiaChi, SDT, Email } = req.body;
    const { rows: duplicated } = await db.query(
      `SELECT 1
       FROM CHINHANH
       WHERE MaCN = $1
          OR LOWER(TenCN) = LOWER($2)
          OR ($3 <> '' AND LOWER(COALESCE(Email, '')) = LOWER($3))
          OR ($4 <> '' AND COALESCE(SDT, '') = $4)
       LIMIT 1`,
      [MaCN, TenCN, Email || '', SDT || '']
    );
    if (duplicated.length > 0) return error(res, 'Mã chi nhánh, tên chi nhánh, số điện thoại hoặc email đã tồn tại.', 409);

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
    const { rows: duplicated } = await db.query(
      `SELECT 1
       FROM CHINHANH
       WHERE MaCN <> $1
         AND (
           LOWER(TenCN) = LOWER($2)
           OR ($3 <> '' AND LOWER(COALESCE(Email, '')) = LOWER($3))
           OR ($4 <> '' AND COALESCE(SDT, '') = $4)
         )
       LIMIT 1`,
      [req.params.maCN, TenCN, Email || '', SDT || '']
    );
    if (duplicated.length > 0) return error(res, 'Tên chi nhánh, số điện thoại hoặc email đã được sử dụng ở chi nhánh khác.', 409);

    if (TrangThai === 'Inactive') {
      const { rows: impactRows } = await db.query(
        `SELECT
            (SELECT COUNT(*)
             FROM NHANVIEN_CHINHANH nc
             JOIN NHANVIEN nv ON nv.MaNV = nc.MaNV
             WHERE nc.MaCN = $1 AND nc.DenNgay IS NULL AND nv.TrangThai = 'Active') AS active_employees,
            (SELECT COUNT(*)
             FROM PHANCONG
             WHERE MaCN = $1 AND Ngay >= CURRENT_DATE AND TrangThai = 'Assigned') AS future_assignments,
            (SELECT COUNT(*)
             FROM PHIEUNHAP
             WHERE MaCN = $1 AND TrangThai = 'Draft') AS pending_purchase_orders,
            (SELECT COUNT(*)
             FROM PHIEUCHI
             WHERE MaCN = $1 AND TrangThai = 'Pending') AS pending_expenses`,
        [req.params.maCN]
      );

      const impact = impactRows[0] || {};
      if (
        Number(impact.active_employees || 0) > 0 ||
        Number(impact.future_assignments || 0) > 0 ||
        Number(impact.pending_purchase_orders || 0) > 0 ||
        Number(impact.pending_expenses || 0) > 0
      ) {
        return error(
          res,
          'Chi nhánh vẫn còn nhân sự hoạt động hoặc chứng từ/phân công đang chờ xử lý. Vui lòng xử lý dữ liệu liên quan trước khi ngưng hoạt động.',
          409
        );
      }
    }

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
    const { rows } = await db.query(`SELECT * FROM BOPHAN ORDER BY COALESCE(NULLIF(regexp_replace(MaBP, '\\D', '', 'g'), ''), '0')::INT, MaBP`);
    return success(res, rows);
  } catch (err) { next(err); }
};

module.exports = { getAllCN, createCN, updateCN, getAllBP };
