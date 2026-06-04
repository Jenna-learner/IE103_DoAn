const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error } = require('../utils/response');

const mapTrangThaiIn = (s) => (s === 'Approved' ? 'Received' : s);
const mapTrangThaiOut = (s) => (s === 'Received' ? 'Approved' : s);
const canAccessBranchData = (user, maCN) => ['admin', 'giam_doc_van_hanh'].includes(user.vaiTro) || (user.maCN && user.maCN === maCN);

const getAll = async (req, res, next) => {
  try {
    const { trangThai, page = 1, limit = 20 } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    if (maCN) { params.push(maCN); conds.push(`pn.MaCN = $${params.length}`); }
    if (trangThai) { params.push(mapTrangThaiIn(trangThai)); conds.push(`pn.TrangThai = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT pn.*, ncc.TenNCC, nv.HoTen AS TenNhanVienLap, cn.TenCN,
              pn.CreatedAt AS NgayTao
       FROM PHIEUNHAP pn
       LEFT JOIN NHACUNGCAP ncc ON ncc.MaNCC = pn.MaNCC
       LEFT JOIN NHANVIEN nv ON nv.MaNV = pn.MaNVLap
       LEFT JOIN CHINHANH cn ON cn.MaCN = pn.MaCN
       ${where}
       ORDER BY pn.NgayNhap DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return success(res, rows.map((r) => ({ ...r, TrangThai: mapTrangThaiOut(r.trangthai || r.TrangThai) })));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT pn.*, ncc.TenNCC, nv.HoTen AS TenNhanVienLap
       FROM PHIEUNHAP pn
       LEFT JOIN NHACUNGCAP ncc ON ncc.MaNCC = pn.MaNCC
       LEFT JOIN NHANVIEN nv ON nv.MaNV = pn.MaNVLap
       WHERE pn.MaPN = $1`,
      [req.params.maPN]
    );
    if (!rows[0]) return error(res, 'Phiếu nhập không tồn tại.', 404);
    if (!canAccessBranchData(req.user, rows[0].macn)) return error(res, 'Bạn không có quyền xem phiếu nhập thuộc chi nhánh khác.', 403);

    const { rows: chiTiet } = await db.query(
      `SELECT ctpn.MaPN, ctpn.MaNL, ctpn.SoLuong, ctpn.DonGia,
              (ctpn.SoLuong * ctpn.DonGia) AS ThanhTien,
              nl.TenNL, nl.DonViTinh
       FROM CHITIET_PHIEUNHAP ctpn
       JOIN NGUYENLIEU nl ON nl.MaNL = ctpn.MaNL
       WHERE ctpn.MaPN = $1`,
      [req.params.maPN]
    );

    return success(res, { ...rows[0], TrangThai: mapTrangThaiOut(rows[0].trangthai || rows[0].TrangThai), chiTiet });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaCN, MaNCC, NgayNhap, items, GhiChu } = req.body;
    const MaPN = genMa('PN');
    const maCN = MaCN || req.user.maCN;

    await client.query(
      `INSERT INTO PHIEUNHAP (MaPN, MaCN, MaNCC, MaNVLap, NgayNhap, TrangThai, GhiChu)
       VALUES ($1,$2,$3,$4,$5,'Draft',$6)`,
      [MaPN, maCN, MaNCC, req.user.maNV, NgayNhap || new Date().toISOString(), GhiChu || null]
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO CHITIET_PHIEUNHAP (MaPN, MaNL, SoLuong, DonGia) VALUES ($1,$2,$3,$4)`,
        [MaPN, item.MaNL, item.SoLuong, item.DonGia]
      );
    }

    await client.query('COMMIT');
    return success(res, { MaPN }, 'Tạo phiếu nhập (Draft) thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

const duyet = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT TrangThai, MaCN FROM PHIEUNHAP WHERE MaPN = $1`, [req.params.maPN]);
    if (!rows[0]) return error(res, 'Phiếu nhập không tồn tại.', 404);
    if (!canAccessBranchData(req.user, rows[0].macn)) return error(res, 'Bạn không có quyền duyệt phiếu nhập thuộc chi nhánh khác.', 403);
    if (rows[0].trangthai !== 'Draft') return error(res, 'Chỉ duyệt được phiếu ở trạng thái Draft.', 400);

    // Conditional UPDATE: chỉ duyệt nếu vẫn còn ở Draft (tránh race condition double-approve)
    const { rowCount } = await db.query(
      `UPDATE PHIEUNHAP SET TrangThai = 'Received', UpdatedAt = NOW()
       WHERE MaPN = $1 AND TrangThai = 'Draft'`,
      [req.params.maPN]
    );
    if (rowCount === 0) return error(res, 'Phiếu nhập đã được duyệt bởi thao tác đồng thời khác.', 409);
    return success(res, null, 'Phiếu nhập đã được duyệt. Tồn kho đã được cập nhật tự động.');
  } catch (err) { next(err); }
};

const huy = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT TrangThai, MaCN FROM PHIEUNHAP WHERE MaPN = $1`, [req.params.maPN]);
    if (!rows[0]) return error(res, 'Phiếu nhập không tồn tại.', 404);
    if (!canAccessBranchData(req.user, rows[0].macn)) return error(res, 'Bạn không có quyền huỷ phiếu nhập thuộc chi nhánh khác.', 403);
    if (rows[0].trangthai === 'Received') return error(res, 'Không thể huỷ phiếu đã duyệt.', 400);

    // Conditional UPDATE: chỉ huỷ nếu chưa phải Received hoặc Cancelled (tránh race condition)
    const { rowCount } = await db.query(
      `UPDATE PHIEUNHAP SET TrangThai = 'Cancelled', UpdatedAt = NOW()
       WHERE MaPN = $1 AND TrangThai NOT IN ('Received', 'Cancelled')`,
      [req.params.maPN]
    );
    if (rowCount === 0) return error(res, 'Phiếu nhập không thể huỷ (đã duyệt hoặc đã huỷ trước đó).', 409);
    return success(res, null, 'Đã huỷ phiếu nhập');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, duyet, huy };
