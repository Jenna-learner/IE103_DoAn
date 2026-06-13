const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error } = require('../utils/response');
const { canAccessBranchData, resolveBranchScope } = require('../utils/branchScope');

// Schema mới: PHANCONG có khóa chính thật MaPC + cột ngày NgayPhanCong.

const getDanhSachCa = async (req, res, next) => {
  try {
    const { rows } = await req.db.query(`SELECT MaCL AS MaCa, TenCL AS TenCa, GioBatDau, GioKetThuc FROM CALAM ORDER BY GioBatDau`);
    return success(res, rows);
  } catch (err) { next(err); }
};

const getPhanCong = async (req, res, next) => {
  try {
    const { tuan, maNV, trangThai } = req.query;
    const maCN = resolveBranchScope(req.user, req.query.maCN);
    const params = [];
    const conds = [];

    if (maCN) { params.push(maCN); conds.push(`pc.MaCN = $${params.length}`); }
    if (maNV) { params.push(maNV); conds.push(`pc.MaNV = $${params.length}`); }
    if (trangThai) { params.push(trangThai); conds.push(`pc.TrangThai = $${params.length}`); }
    if (tuan) {
      params.push(tuan); conds.push(`pc.NgayPhanCong >= $${params.length}::DATE`);
      params.push(tuan); conds.push(`pc.NgayPhanCong < ($${params.length}::DATE + INTERVAL '7 days')`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await req.db.query(
      `SELECT pc.MaPC, pc.MaNV, pc.MaCN, pc.MaCL, pc.NgayPhanCong, pc.TrangThai,
              nv.HoTen, cn.TenCN, cl.TenCL AS TenCa, cl.GioBatDau, cl.GioKetThuc
       FROM PHANCONG pc
       JOIN NHANVIEN nv ON nv.MaNV = pc.MaNV
       JOIN CHINHANH cn ON cn.MaCN = pc.MaCN
       JOIN CALAM cl ON cl.MaCL = pc.MaCL
       ${where}
       ORDER BY pc.NgayPhanCong, cn.TenCN, cl.GioBatDau, nv.HoTen`,
      params
    );

    return success(res, rows.map((r) => ({
      ...r,
      MaPC: r.mapc,
      MaCa: r.macl,
      NgayLam: String(r.ngayphancong || '').slice(0, 10),
    })));
  } catch (err) { next(err); }
};

const phanCong = async (req, res, next) => {
  try {
    const { MaNV, MaCa, NgayLam } = req.body;
    const maCN = req.body.MaCN || req.user.maCN;
    const maCL = MaCa || req.body.MaCL;
    const ngay = NgayLam || req.body.NgayPhanCong;

    if (!maCN) return error(res, 'Vui lòng chọn chi nhánh để phân công.', 400);
    if (!MaNV || !maCL || !ngay) return error(res, 'Thiếu thông tin nhân viên, ca làm hoặc ngày.', 400);
    if (!canAccessBranchData(req.user, maCN)) return error(res, 'Bạn không có quyền phân công cho chi nhánh khác.', 403);

    const { rows: trung } = await req.db.query(
      `SELECT 1 FROM PHANCONG WHERE MaNV=$1 AND MaCL=$2 AND NgayPhanCong=$3 AND MaCN=$4`,
      [MaNV, maCL, ngay, maCN]
    );
    if (trung.length > 0) return error(res, 'Nhân viên đã được phân công ca này trong ngày.', 409);

    const MaPC = genMa('PC');
    await req.db.query(
      `INSERT INTO PHANCONG (MaPC, MaNV, MaCN, MaCL, NgayPhanCong) VALUES ($1,$2,$3,$4,$5)`,
      [MaPC, MaNV, maCN, maCL, ngay]
    );
    return success(res, { MaPC }, 'Phân công ca thành công', 201);
  } catch (err) { next(err); }
};

const capNhatTrangThai = async (req, res, next) => {
  try {
    const { TrangThai } = req.body;
    const { rows } = await req.db.query(`SELECT MaCN FROM PHANCONG WHERE MaPC = $1`, [req.params.maPC]);
    if (!rows[0]) return error(res, 'Phân công không tồn tại.', 404);
    if (!canAccessBranchData(req.user, rows[0].macn)) return error(res, 'Bạn không có quyền cập nhật phân công thuộc chi nhánh khác.', 403);

    const { rowCount } = await req.db.query(`UPDATE PHANCONG SET TrangThai = $1 WHERE MaPC = $2`, [TrangThai, req.params.maPC]);
    if (rowCount === 0) return error(res, 'Phân công không tồn tại.', 404);
    return success(res, null, `Cập nhật trạng thái ca → ${TrangThai}`);
  } catch (err) { next(err); }
};

const xoaPhanCong = async (req, res, next) => {
  try {
    const { rows } = await req.db.query(`SELECT MaCN FROM PHANCONG WHERE MaPC = $1`, [req.params.maPC]);
    if (!rows[0]) return error(res, 'Phân công không tồn tại.', 404);
    if (!canAccessBranchData(req.user, rows[0].macn)) return error(res, 'Bạn không có quyền xoá phân công thuộc chi nhánh khác.', 403);

    const { rowCount } = await req.db.query(`DELETE FROM PHANCONG WHERE MaPC = $1`, [req.params.maPC]);
    if (rowCount === 0) return error(res, 'Phân công không tồn tại.', 404);
    return success(res, null, 'Đã xoá phân công ca');
  } catch (err) { next(err); }
};

module.exports = { getDanhSachCa, getPhanCong, phanCong, capNhatTrangThai, xoaPhanCong };
