/**
 * Controller: BAOCAO (Báo cáo & Dashboard)
 * Sử dụng:
 *   - Materialized Views: mv_doanhthu_ngay, mv_top_sanpham
 *   - Views: v_CanhBaoTonKho, v_BangLuongNhanVien, v_HoaDonChiTiet
 *   - CALL sp_RefreshAllMaterializedViews() để làm mới dữ liệu
 */
const db = require('../config/db');
const { success } = require('../utils/response');

// GET /api/v1/bao-cao/dashboard?maCN=&ngay=YYYY-MM-DD
// Card KPIs real-time cho chi nhánh
const dashboard = async (req, res, next) => {
  try {
    const maCN = req.user.maCN || req.query.maCN;
    const ngay = req.query.ngay || new Date().toISOString().split('T')[0];

    const [doanhThu, chiPhi, canhBao] = await Promise.all([
      // Doanh thu từ mv_doanhthu_ngay (Materialized View)
      db.query(
        `SELECT COALESCE(SUM(TongDoanhThuTho), 0)  AS TongDoanhThuTho,
                COALESCE(SUM(TongGiamGia),     0)  AS TongGiamGia,
                COALESCE(SUM(DoanhThuThuan),   0)  AS DoanhThuThuan
         FROM mv_doanhthu_ngay
         WHERE Ngay = $1 ${maCN ? "AND MaCN = '" + maCN + "'" : ''}`,
        [ngay]
      ),
      // Số hóa đơn hoàn thành
      db.query(
        `SELECT COUNT(*) AS SoHoaDon FROM HOADON
         WHERE TrangThai = 'Completed' AND NgayLap::DATE = $1
         ${maCN ? "AND MaCN = '" + maCN + "'" : ''}`,
        [ngay]
      ),
      // Số nguyên liệu dưới mức tối thiểu từ v_CanhBaoTonKho
      db.query(
        `SELECT COUNT(*) AS SoCanhBao FROM v_CanhBaoTonKho
         ${maCN ? "WHERE TenCN IN (SELECT TenCN FROM CHINHANH WHERE MaCN = '" + maCN + "')" : ''}`
      ),
    ]);

    return success(res, {
      Ngay:            ngay,
      SoHoaDon:        parseInt(chiPhi.rows[0].sohoadon),
      TongDoanhThuTho: parseFloat(doanhThu.rows[0].tongdoanhthutho),
      TongGiamGia:     parseFloat(doanhThu.rows[0].tonggiamgia),
      DoanhThuThuan:   parseFloat(doanhThu.rows[0].doanhthuthuan),
      SoCanhBaoTonKho: parseInt(canhBao.rows[0].socanhbao),
    });
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/doanh-thu-theo-ngay?maCN=&thang=YYYY-MM
const doanhThuTheoNgay = async (req, res, next) => {
  try {
    const maCN = req.user.maCN || req.query.maCN;
    const thang = req.query.thang || new Date().toISOString().slice(0, 7);
    const params = [thang];
    const maCNWhere = maCN ? `AND MaCN = $2` : '';
    if (maCN) params.push(maCN);

    const { rows } = await db.query(
      `SELECT Ngay, TongDoanhThuTho, TongGiamGia, DoanhThuThuan
       FROM mv_doanhthu_ngay
       WHERE TO_CHAR(Ngay,'YYYY-MM') = $1 ${maCNWhere}
       ORDER BY Ngay`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/top-san-pham?maCN=&limit=10
const topSanPham = async (req, res, next) => {
  try {
    const maCN  = req.user.maCN || req.query.maCN;
    const limit = parseInt(req.query.limit) || 10;
    const params = [limit];
    const maCNWhere = maCN ? `WHERE MaCN = $2` : '';
    if (maCN) params.push(maCN);

    const { rows } = await db.query(
      `SELECT MaSP, TenSP, TongSoLuongBan, TongDoanhThu
       FROM mv_top_sanpham
       ${maCNWhere}
       ORDER BY TongSoLuongBan DESC LIMIT $1`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/canh-bao-ton-kho?maCN=
const canhBaoTonKho = async (req, res, next) => {
  try {
    const maCN = req.user.maCN || req.query.maCN;
    const where = maCN ? `WHERE TenCN IN (SELECT TenCN FROM CHINHANH WHERE MaCN = '${maCN}')` : '';
    const { rows } = await db.query(`SELECT * FROM v_CanhBaoTonKho ${where} ORDER BY SoLuongTon`);
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/bang-luong?maCN=&thang=MM/YYYY
const bangLuong = async (req, res, next) => {
  try {
    const maCN  = req.user.maCN || req.query.maCN;
    const thang = req.query.thang; // format MM/YYYY
    const params = [];
    const conds  = [];

    if (thang) { params.push(thang); conds.push(`ThangNam = $${params.length}`); }

    // v_BangLuongNhanVien không có cột MaCN → join qua PHANCONG
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const { rows } = await db.query(
      `SELECT * FROM v_BangLuongNhanVien ${where} ORDER BY ThangNam, HoTen`, params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// POST /api/v1/bao-cao/lam-moi  (Refresh Materialized Views)
const lamMoi = async (req, res, next) => {
  try {
    await db.query(`CALL sp_RefreshAllMaterializedViews()`);
    return success(res, null, 'Đã làm mới toàn bộ Materialized Views báo cáo.');
  } catch (err) { next(err); }
};

module.exports = { dashboard, doanhThuTheoNgay, topSanPham, canhBaoTonKho, bangLuong, lamMoi };
