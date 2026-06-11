const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { success, error } = require('../utils/response');
const { resolveBranchScope } = require('../utils/branchScope');

const mapTrangThaiIn = (s) => {
  if (s === 'Inactive') return 'Suspended';
  return s;
};

const mapTrangThaiOut = (s) => {
  if (s === 'Suspended' || s === 'Resigned') return 'Inactive';
  return s;
};

const canAccessEmployee = (user, maCN) => ['admin', 'giam_doc_van_hanh'].includes(user.vaiTro) || (user.maCN && user.maCN === maCN);

const getAll = async (req, res, next) => {
  try {
    const { maBP, trangThai = 'Active' } = req.query;
    const maCN = resolveBranchScope(req.user, req.query.maCN);
    const params = [];
    const conds = [];

    if (maCN) { params.push(maCN); conds.push(`nc.MaCN = $${params.length}`); }
    if (maBP) { params.push(maBP); conds.push(`nv.MaBP = $${params.length}`); }
    if (trangThai && trangThai !== 'all') { params.push(mapTrangThaiIn(trangThai)); conds.push(`nv.TrangThai = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.queryCtx(req, 
      `SELECT nv.MaNV, nv.HoTen, nv.SDT, nv.Email, nv.DonGiaCa AS LuongCoBan, nv.TrangThai,
              bp.TenBP, nc.MaCN, cn.TenCN,
              tk.TenDangNhap, tk.VaiTro, tk.IsActive AS TaiKhoanActive
       FROM NHANVIEN nv
       LEFT JOIN BOPHAN bp ON bp.MaBP = nv.MaBP
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV AND nc.DenNgay IS NULL
       LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN
       LEFT JOIN TAIKHOAN tk ON tk.MaNV = nv.MaNV
       ${where}
       ORDER BY nv.HoTen`,
      params
    );
    return success(res, rows.map((row) => ({ ...row, TrangThai: mapTrangThaiOut(row.trangthai || row.TrangThai) })));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await db.queryCtx(req, 
      `SELECT nv.*, bp.TenBP, nc.MaCN, cn.TenCN, tk.TenDangNhap, tk.VaiTro
       FROM NHANVIEN nv
       LEFT JOIN BOPHAN bp ON bp.MaBP = nv.MaBP
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV AND nc.DenNgay IS NULL
       LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN
       LEFT JOIN TAIKHOAN tk ON tk.MaNV = nv.MaNV
       WHERE nv.MaNV = $1`,
      [req.params.maNV]
    );
    if (!rows[0]) return error(res, 'Nhân viên không tồn tại.', 404);
    if (!canAccessEmployee(req.user, rows[0].macn || rows[0].MaCN)) {
      return error(res, 'Bạn không có quyền xem nhân viên thuộc chi nhánh khác.', 403);
    }
    return success(res, { ...rows[0], TrangThai: mapTrangThaiOut(rows[0].trangthai || rows[0].TrangThai) });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaNV, HoTen, MaBP, SDT, Email, DonGiaCa, LuongCoBan, MaCN, TenDangNhap, MatKhau, VaiTro } = req.body;
    const luong = DonGiaCa || LuongCoBan;

    const { rows: duplicated } = await client.query(
      `SELECT 1
       FROM NHANVIEN nv
       LEFT JOIN TAIKHOAN tk ON tk.MaNV = nv.MaNV
       WHERE nv.MaNV = $1
          OR ($2 <> '' AND LOWER(COALESCE(nv.Email, '')) = LOWER($2))
          OR ($3 <> '' AND LOWER(COALESCE(tk.TenDangNhap, '')) = LOWER($3))
          OR ($4 <> '' AND COALESCE(nv.SDT, '') = $4)
       LIMIT 1`,
      [MaNV, Email || '', TenDangNhap || '', SDT || '']
    );
    if (duplicated.length > 0) {
      await client.query('ROLLBACK');
      return error(res, 'Mã nhân viên, số điện thoại, email hoặc tên đăng nhập đã tồn tại.', 409);
    }

    await client.query(
      `INSERT INTO NHANVIEN (MaNV, HoTen, MaBP, SDT, Email, DonGiaCa)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [MaNV, HoTen, MaBP, SDT, Email, luong]
    );

    if (MaCN) {
      await client.query(`INSERT INTO NHANVIEN_CHINHANH (MaNV, MaCN) VALUES ($1,$2)`, [MaNV, MaCN]);
    }

    if (TenDangNhap && MatKhau) {
      const hash = await bcrypt.hash(MatKhau, 10);
      await client.query(`INSERT INTO TAIKHOAN (MaNV, TenDangNhap, MatKhau, VaiTro) VALUES ($1,$2,$3,$4)`, [MaNV, TenDangNhap, hash, VaiTro || 'thu_ngan']);
    }

    await client.query('COMMIT');
    return success(res, { MaNV }, 'Thêm nhân viên thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

const update = async (req, res, next) => {
  try {
    const { HoTen, MaBP, SDT, Email, DonGiaCa, LuongCoBan, TrangThai } = req.body;
    const trangThaiDb = mapTrangThaiIn(TrangThai);

    const { rows: targetRows } = await db.queryCtx(req, 
      `SELECT nc.MaCN
       FROM NHANVIEN nv
       LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV AND nc.DenNgay IS NULL
       WHERE nv.MaNV = $1`,
      [req.params.maNV]
    );
    if (!targetRows[0]) return error(res, 'Nhân viên không tồn tại.', 404);
    if (!canAccessEmployee(req.user, targetRows[0].macn || targetRows[0].MaCN)) {
      return error(res, 'Bạn không có quyền cập nhật nhân viên thuộc chi nhánh khác.', 403);
    }

    if (trangThaiDb !== 'Active') {
      const { rows: related } = await db.queryCtx(req, 
        `SELECT COUNT(*) FILTER (WHERE pc.TrangThai = 'Assigned' AND pc.Ngay >= CURRENT_DATE) AS pending_shifts
         FROM NHANVIEN nv
         LEFT JOIN PHANCONG pc ON pc.MaNV = nv.MaNV
         WHERE nv.MaNV = $1
         GROUP BY nv.MaNV`,
        [req.params.maNV]
      );

      const pendingShifts = Number(related[0]?.pending_shifts || 0);
      if (pendingShifts > 0) {
        return error(res, 'Nhân viên đang có ca làm đã phân công trong tương lai. Vui lòng xử lý phân công trước khi ngưng hoạt động.', 409);
      }
    }

    const { rows: duplicated } = await db.query(
      `SELECT 1
       FROM NHANVIEN
       WHERE MaNV <> $1
         AND (
           ($2 <> '' AND COALESCE(SDT, '') = $2)
           OR ($3 <> '' AND LOWER(COALESCE(Email, '')) = LOWER($3))
         )
       LIMIT 1`,
      [req.params.maNV, SDT || '', Email || '']
    );
    if (duplicated.length > 0) {
      return error(res, 'Số điện thoại hoặc email đã được sử dụng bởi nhân viên khác.', 409);
    }

    await db.queryCtx(req, 
      `UPDATE NHANVIEN SET HoTen=$1, MaBP=$2, SDT=$3, Email=$4, DonGiaCa=$5, TrangThai=$6, UpdatedAt=NOW() WHERE MaNV=$7`,
      [HoTen, MaBP, SDT, Email, DonGiaCa || LuongCoBan, trangThaiDb, req.params.maNV]
    );
    return success(res, null, 'Cập nhật nhân viên thành công');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update };
