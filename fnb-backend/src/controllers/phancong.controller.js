/**
 * Controller: PHANCONG (Phân công ca làm việc)
 * Bảng: PHANCONG, CALAM
 * MaPC trong PHANCONG là SERIAL (tự tăng)
 * Constraint UNIQUE chống trùng ca nằm ở trigger/logic app (schema không có UNIQUE trên PHANCONG)
 */
const db = require('../config/db');
const { success, error } = require('../utils/response');

// GET /api/v1/ca-lam  (danh sách ca chuẩn)
const getDanhSachCa = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM CALAM ORDER BY GioBatDau`);
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/phan-cong?maCN=&tuan=YYYY-MM-DD&maNV=
const getPhanCong = async (req, res, next) => {
  try {
    const { tuan, maNV } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const params = [];
    const conds = [];

    if (maCN) { params.push(maCN); conds.push(`pc.MaCN = $${params.length}`); }
    if (maNV) { params.push(maNV); conds.push(`pc.MaNV = $${params.length}`); }
    if (tuan) {
      // Lấy 7 ngày từ ngày đầu tuần (Monday)
      params.push(tuan);
      conds.push(`pc.NgayLam >= $${params.length}::DATE`);
      params.push(tuan);
      conds.push(`pc.NgayLam < ($${params.length}::DATE + INTERVAL '7 days')`);
    }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const { rows } = await db.query(
      `SELECT pc.MaPC, pc.MaNV, nv.HoTen, pc.MaCN, pc.MaCa,
              cl.TenCa, cl.GioBatDau, cl.GioKetThuc, cl.DonGiaLuong,
              pc.NgayLam, pc.TrangThai
       FROM PHANCONG pc
       JOIN NHANVIEN nv ON nv.MaNV = pc.MaNV
       JOIN CALAM cl    ON cl.MaCa = pc.MaCa
       ${where}
       ORDER BY pc.NgayLam, cl.GioBatDau`, params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// POST /api/v1/phan-cong  (Phân công ca)
const phanCong = async (req, res, next) => {
  try {
    const { MaNV, MaCa, NgayLam } = req.body;
    const maCN = req.user.maCN || req.body.MaCN;

    // Kiểm tra trùng ca: cùng nhân viên, cùng ngày, cùng ca
    const { rows: trung } = await db.query(
      `SELECT MaPC FROM PHANCONG WHERE MaNV=$1 AND MaCa=$2 AND NgayLam=$3 AND MaCN=$4`,
      [MaNV, MaCa, NgayLam, maCN]
    );
    if (trung.length > 0) return error(res, 'Nhân viên đã được phân công ca này trong ngày.', 409);

    const { rows } = await db.query(
      `INSERT INTO PHANCONG (MaNV, MaCN, MaCa, NgayLam) VALUES ($1,$2,$3,$4) RETURNING MaPC`,
      [MaNV, maCN, MaCa, NgayLam]
    );
    return success(res, { MaPC: rows[0].mapc }, 'Phân công ca thành công', 201);
  } catch (err) { next(err); }
};

// PATCH /api/v1/phan-cong/:maPC/trang-thai
const capNhatTrangThai = async (req, res, next) => {
  try {
    const { TrangThai } = req.body; // Scheduled | Completed | Absent
    await db.query(`UPDATE PHANCONG SET TrangThai = $1 WHERE MaPC = $2`, [TrangThai, req.params.maPC]);
    return success(res, null, `Cập nhật trạng thái ca → ${TrangThai}`);
  } catch (err) { next(err); }
};

// DELETE /api/v1/phan-cong/:maPC
const xoaPhanCong = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM PHANCONG WHERE MaPC = $1`, [req.params.maPC]);
    return success(res, null, 'Đã xoá phân công ca');
  } catch (err) { next(err); }
};

module.exports = { getDanhSachCa, getPhanCong, phanCong, capNhatTrangThai, xoaPhanCong };
