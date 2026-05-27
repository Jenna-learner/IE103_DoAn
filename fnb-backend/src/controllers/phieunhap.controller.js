/**
 * Controller: PHIEUNHAP (Phiếu nhập hàng)
 * Bảng: PHIEUNHAP, CHITIET_PHIEUNHAP
 *
 * ⚡ Trigger: trg_phieunhap_import
 *   Khi TrangThai: Draft → Approved → tự cộng TONKHO_CHINHANH + ghi NHATKYKHO
 *
 * Trạng thái: Draft → Approved | Cancelled
 */
const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error } = require('../utils/response');

// GET /api/v1/phieu-nhap?maCN=&trangThai=&page=
const getAll = async (req, res, next) => {
  try {
    const { trangThai, page = 1, limit = 20 } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    if (maCN)      { params.push(maCN);      conds.push(`pn.MaCN = $${params.length}`); }
    if (trangThai) { params.push(trangThai);  conds.push(`pn.TrangThai = $${params.length}`); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT pn.*, ncc.TenNCC, nv.HoTen AS TenNhanVienLap, cn.TenCN
       FROM PHIEUNHAP pn
       LEFT JOIN NHACUNGCAP ncc ON ncc.MaNCC = pn.MaNCC
       LEFT JOIN NHANVIEN nv   ON nv.MaNV   = pn.MaNVLap
       LEFT JOIN CHINHANH cn   ON cn.MaCN   = pn.MaCN
       ${where}
       ORDER BY pn.NgayNhap DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/phieu-nhap/:maPN
const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT pn.*, ncc.TenNCC, nv.HoTen AS TenNhanVienLap
       FROM PHIEUNHAP pn
       LEFT JOIN NHACUNGCAP ncc ON ncc.MaNCC = pn.MaNCC
       LEFT JOIN NHANVIEN nv   ON nv.MaNV   = pn.MaNVLap
       WHERE pn.MaPN = $1`, [req.params.maPN]
    );
    if (!rows[0]) return error(res, 'Phiếu nhập không tồn tại.', 404);

    const { rows: chiTiet } = await db.query(
      `SELECT ctpn.*, nl.TenNL, nl.DonViTinh
       FROM CHITIET_PHIEUNHAP ctpn
       JOIN NGUYENLIEU nl ON nl.MaNL = ctpn.MaNL
       WHERE ctpn.MaPN = $1`, [req.params.maPN]
    );
    return success(res, { ...rows[0], chiTiet });
  } catch (err) { next(err); }
};

// POST /api/v1/phieu-nhap  (Tạo phiếu Draft)
const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaCN, MaNCC, NgayNhap, items } = req.body;
    // items: [{ MaNL, SoLuong, DonGia }]
    const MaPN  = genMa('PN');
    const maCN  = MaCN || req.user.maCN;

    let tongTien = 0;
    const enriched = items.map(i => {
      const thanhTien = i.SoLuong * i.DonGia;
      tongTien += thanhTien;
      return { ...i, ThanhTien: thanhTien };
    });

    await client.query(
      `INSERT INTO PHIEUNHAP (MaPN, MaCN, MaNCC, MaNVLap, NgayNhap, TongTien, TrangThai)
       VALUES ($1,$2,$3,$4,$5,$6,'Draft')`,
      [MaPN, maCN, MaNCC, req.user.maNV, NgayNhap || new Date().toISOString().split('T')[0], tongTien]
    );

    for (const item of enriched) {
      await client.query(
        `INSERT INTO CHITIET_PHIEUNHAP (MaPN, MaNL, SoLuong, DonGia, ThanhTien)
         VALUES ($1,$2,$3,$4,$5)`,
        [MaPN, item.MaNL, item.SoLuong, item.DonGia, item.ThanhTien]
      );
    }

    await client.query('COMMIT');
    return success(res, { MaPN, TongTien: tongTien }, 'Tạo phiếu nhập (Draft) thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PATCH /api/v1/phieu-nhap/:maPN/duyet  (Draft → Approved → trigger tự cộng kho)
const duyet = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT TrangThai FROM PHIEUNHAP WHERE MaPN = $1`, [req.params.maPN]);
    if (!rows[0]) return error(res, 'Phiếu nhập không tồn tại.', 404);
    if (rows[0].trangthai !== 'Draft') return error(res, 'Chỉ duyệt được phiếu ở trạng thái Draft.', 400);

    // Trigger trg_phieunhap_import sẽ tự động cộng kho khi TrangThai → 'Approved'
    await db.query(`UPDATE PHIEUNHAP SET TrangThai = 'Approved' WHERE MaPN = $1`, [req.params.maPN]);
    return success(res, null, 'Phiếu nhập đã được duyệt. Tồn kho đã được cập nhật tự động.');
  } catch (err) { next(err); }
};

// PATCH /api/v1/phieu-nhap/:maPN/huy
const huy = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT TrangThai FROM PHIEUNHAP WHERE MaPN = $1`, [req.params.maPN]);
    if (!rows[0]) return error(res, 'Phiếu nhập không tồn tại.', 404);
    if (rows[0].trangthai === 'Approved') return error(res, 'Không thể huỷ phiếu đã duyệt.', 400);
    await db.query(`UPDATE PHIEUNHAP SET TrangThai = 'Cancelled' WHERE MaPN = $1`, [req.params.maPN]);
    return success(res, null, 'Đã huỷ phiếu nhập');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, duyet, huy };
