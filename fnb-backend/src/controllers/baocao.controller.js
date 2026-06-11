/**
 * Controller: BAOCAO (Báo cáo & Dashboard)
 * Sử dụng:
 *   - Materialized Views: mv_doanhthu_ngay, mv_top_sanpham
 *   - Views: v_CanhBaoTonKho, v_BangLuongNhanVien, v_HoaDonChiTiet
 *   - CALL sp_RefreshAllMaterializedViews() để làm mới dữ liệu
 */
const db = require('../config/db');
const { success } = require('../utils/response');
const { resolveBranchScope } = require('../utils/branchScope');

// GET /api/v1/bao-cao/dashboard?maCN=&ngay=YYYY-MM-DD
// Card KPIs real-time cho chi nhánh
const dashboard = async (req, res, next) => {
  try {
    const maCN = resolveBranchScope(req.user, req.query.maCN);
    const ngay = req.query.ngay || new Date().toISOString().split('T')[0];
    const doanhThuParams = [ngay];
    const hoaDonParams = [ngay];
    const canhBaoParams = [];
    const doanhThuWhere = maCN ? `AND MaCN = $2` : '';
    const hoaDonWhere = maCN ? `AND MaCN = $2` : '';
    const canhBaoWhere = maCN ? `WHERE TenCN IN (SELECT TenCN FROM CHINHANH WHERE MaCN = $1)` : '';

    if (maCN) {
      doanhThuParams.push(maCN);
      hoaDonParams.push(maCN);
      canhBaoParams.push(maCN);
    }

    const [doanhThu, chiPhi, canhBao] = await Promise.all([
      db.query(
        `SELECT COALESCE(SUM(TongTienHang),   0)  AS TongDoanhThuTho,
                COALESCE(SUM(TongGiamGia),    0)  AS TongGiamGia,
                COALESCE(SUM(TongThanhToan),  0)  AS DoanhThuThuan
         FROM mv_doanhthu_ngay
         WHERE Ngay = $1 ${doanhThuWhere}`,
        doanhThuParams
      ),
      db.query(
        `SELECT COUNT(*) AS SoHoaDon FROM HOADON
         WHERE TrangThai = 'Completed' AND NgayLap::DATE = $1
         ${hoaDonWhere}`,
        hoaDonParams
      ),
      db.query(
        `SELECT COUNT(*) AS SoCanhBao FROM v_CanhBaoTonKho
         ${canhBaoWhere}`,
        canhBaoParams
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
    const maCN = resolveBranchScope(req.user, req.query.maCN);
    const thang = req.query.thang || new Date().toISOString().slice(0, 7);
    const params = [thang];
    const maCNWhere = maCN ? `AND MaCN = $2` : '';
    if (maCN) params.push(maCN);

    const { rows } = await db.query(
      `SELECT Ngay,
               SUM(TongTienHang)  AS TongDoanhThuTho,
               SUM(TongGiamGia)   AS TongGiamGia,
               SUM(TongThanhToan) AS DoanhThuThuan
       FROM mv_doanhthu_ngay
       WHERE TO_CHAR(Ngay,'YYYY-MM') = $1 ${maCNWhere}
       GROUP BY Ngay
       ORDER BY Ngay`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/top-san-pham?maCN=&limit=10
const topSanPham = async (req, res, next) => {
  try {
    const maCN  = resolveBranchScope(req.user, req.query.maCN);
    const limit = parseInt(req.query.limit) || 10;
    let rows = [];

    if (maCN) {
      const { rows: branchRows } = await db.query(
        `SELECT MaSP, TenSP, TongSoLuongBan, TongDoanhThu
         FROM mv_top_sanpham
         WHERE MaCN = $1
         ORDER BY TongSoLuongBan DESC, TongDoanhThu DESC
         LIMIT $2`,
        [maCN, limit]
      );
      rows = branchRows;
    } else {
      const { rows: systemRows } = await db.query(
        `SELECT MaSP,
                MAX(TenSP) AS TenSP,
                SUM(TongSoLuongBan) AS TongSoLuongBan,
                SUM(TongDoanhThu) AS TongDoanhThu
         FROM mv_top_sanpham
         GROUP BY MaSP
         ORDER BY SUM(TongSoLuongBan) DESC, SUM(TongDoanhThu) DESC
         LIMIT $1`,
        [limit]
      );
      rows = systemRows;
    }

    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/canh-bao-ton-kho?maCN=
const canhBaoTonKho = async (req, res, next) => {
  try {
    const maCN = resolveBranchScope(req.user, req.query.maCN);
    const where = maCN ? `WHERE TenCN IN (SELECT TenCN FROM CHINHANH WHERE MaCN = $1)` : '';
    const params = maCN ? [maCN] : [];
    const { rows } = await db.query(`SELECT * FROM v_CanhBaoTonKho ${where} ORDER BY SoLuongTon`, params);
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/bang-luong?maCN=&thang=MM/YYYY
const bangLuong = async (req, res, next) => {
  try {
    const maCN  = resolveBranchScope(req.user, req.query.maCN);
    const thang = req.query.thang; // format MM/YYYY
    const params = [];
    const conds  = [];

    if (thang) { params.push(thang); conds.push(`ThangNam = $${params.length}`); }
    if (maCN) {
      params.push(maCN);
      conds.push(`TenCN IN (SELECT TenCN FROM CHINHANH WHERE MaCN = $${params.length})`);
    }
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
