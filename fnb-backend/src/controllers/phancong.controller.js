const db = require('../config/db');
const { success, error } = require('../utils/response');
const { canAccessBranchData, resolveBranchScope } = require('../utils/branchScope');

// pg trả DATE dạng string 'YYYY-MM-DD' (nhờ types.setTypeParser) → slice trực tiếp, không qua new Date()
const packKey = (r) => `${r.manv || r.MaNV}|${r.macn || r.MaCN}|${r.macl || r.MaCL}|${String(r.ngay || r.Ngay || r.ngaylam || r.NgayLam || '').slice(0, 10)}`;
const parseKey = (key) => {
  const [MaNV, MaCN, MaCL, Ngay] = String(key).split('|');
  return { MaNV, MaCN, MaCL, Ngay };
};

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
      params.push(tuan); conds.push(`pc.Ngay >= $${params.length}::DATE`);
      params.push(tuan); conds.push(`pc.Ngay < ($${params.length}::DATE + INTERVAL '7 days')`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await req.db.query( 
      `SELECT pc.MaNV, pc.MaCN, pc.MaCL, pc.Ngay, pc.TrangThai,
              nv.HoTen, cn.TenCN, cl.TenCL AS TenCa, cl.GioBatDau, cl.GioKetThuc
       FROM PHANCONG pc
       JOIN NHANVIEN nv ON nv.MaNV = pc.MaNV
       JOIN CHINHANH cn ON cn.MaCN = pc.MaCN
       JOIN CALAM cl ON cl.MaCL = pc.MaCL
       ${where}
       ORDER BY pc.Ngay, cn.TenCN, cl.GioBatDau, nv.HoTen`,
      params
    );

    return success(res, rows.map((r) => ({ ...r, MaPC: packKey(r), MaCa: r.macl || r.MaCL, NgayLam: r.ngay || r.Ngay })));
  } catch (err) { next(err); }
};

const phanCong = async (req, res, next) => {
  try {
    const { MaNV, MaCa, NgayLam } = req.body;
    const maCN = req.body.MaCN || req.user.maCN;
    const maCL = MaCa || req.body.MaCL;

    if (!maCN) return error(res, 'Vui lòng chọn chi nhánh để phân công.', 400);
    if (!canAccessBranchData(req.user, maCN)) return error(res, 'Bạn không có quyền phân công cho chi nhánh khác.', 403);

    const { rows: trung } = await req.db.query( 
      `SELECT 1 FROM PHANCONG WHERE MaNV=$1 AND MaCL=$2 AND Ngay=$3 AND MaCN=$4`,
      [MaNV, maCL, NgayLam, maCN]
    );
    if (trung.length > 0) return error(res, 'Nhân viên đã được phân công ca này trong ngày.', 409);

    await req.db.query( `INSERT INTO PHANCONG (MaNV, MaCN, MaCL, Ngay) VALUES ($1,$2,$3,$4)`, [MaNV, maCN, maCL, NgayLam]);
    return success(res, { MaPC: `${MaNV}|${maCN}|${maCL}|${NgayLam}` }, 'Phân công ca thành công', 201);
  } catch (err) { next(err); }
};

const capNhatTrangThai = async (req, res, next) => {
  try {
    const { TrangThai } = req.body;
    const { MaNV, MaCN, MaCL, Ngay } = parseKey(req.params.maPC);
    if (!canAccessBranchData(req.user, MaCN)) return error(res, 'Bạn không có quyền cập nhật phân công thuộc chi nhánh khác.', 403);
    const { rowCount } = await req.db.query( `UPDATE PHANCONG SET TrangThai = $1 WHERE MaNV=$2 AND MaCN=$3 AND MaCL=$4 AND Ngay=$5`, [TrangThai, MaNV, MaCN, MaCL, Ngay]);
    if (rowCount === 0) return error(res, 'Phân công không tồn tại.', 404);
    return success(res, null, `Cập nhật trạng thái ca → ${TrangThai}`);
  } catch (err) { next(err); }
};

const xoaPhanCong = async (req, res, next) => {
  try {
    const { MaNV, MaCN, MaCL, Ngay } = parseKey(req.params.maPC);
    if (!canAccessBranchData(req.user, MaCN)) return error(res, 'Bạn không có quyền xoá phân công thuộc chi nhánh khác.', 403);
    const { rowCount } = await req.db.query( `DELETE FROM PHANCONG WHERE MaNV=$1 AND MaCN=$2 AND MaCL=$3 AND Ngay=$4`, [MaNV, MaCN, MaCL, Ngay]);
    if (rowCount === 0) return error(res, 'Phân công không tồn tại.', 404);
    return success(res, null, 'Đã xoá phân công ca');
  } catch (err) { next(err); }
};

module.exports = { getDanhSachCa, getPhanCong, phanCong, capNhatTrangThai, xoaPhanCong };
