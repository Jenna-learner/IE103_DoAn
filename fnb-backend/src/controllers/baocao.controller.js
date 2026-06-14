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
      req.db.query(
        `SELECT COALESCE(SUM(TongTienHang),   0)  AS TongDoanhThuTho,
                COALESCE(SUM(TongGiamGia),    0)  AS TongGiamGia,
                COALESCE(SUM(TongThanhToan),  0)  AS DoanhThuThuan
         FROM mv_doanhthu_ngay
         WHERE Ngay = $1 ${doanhThuWhere}`,
        doanhThuParams
      ),
      req.db.query(
        `SELECT COUNT(*) AS SoHoaDon FROM HOADON
         WHERE TrangThai = 'Completed' AND NgayLap::DATE = $1
         ${hoaDonWhere}`,
        hoaDonParams
      ),
      req.db.query(
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

    const { rows } = await req.db.query(
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
      const { rows: branchRows } = await req.db.query(
        `SELECT MaSP, TenSP, TongSoLuongBan, TongDoanhThu
         FROM mv_top_sanpham
         WHERE MaCN = $1
         ORDER BY TongSoLuongBan DESC, TongDoanhThu DESC
         LIMIT $2`,
        [maCN, limit]
      );
      rows = branchRows;
    } else {
      const { rows: systemRows } = await req.db.query(
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
    const { rows } = await req.db.query(`SELECT * FROM v_CanhBaoTonKho ${where} ORDER BY SoLuongTon`, params);
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

    const { rows } = await req.db.query(
      `SELECT * FROM v_BangLuongNhanVien ${where} ORDER BY ThangNam, HoTen`, params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// POST /api/v1/bao-cao/lam-moi  (Refresh Materialized Views)
const lamMoi = async (req, res, next) => {
  try {
    await req.db.query(`CALL sp_RefreshAllMaterializedViews()`);
    return success(res, null, 'Đã làm mới toàn bộ Materialized Views báo cáo.');
  } catch (err) { next(err); }
};

/* ============================================================
 * BÁO CÁO NGHIỆP VỤ (chỉ đọc — SELECT từ bảng/view có sẵn)
 * Tham số chung: maCN (phạm vi chi nhánh), thang = 'YYYY-MM'
 * ============================================================ */

const thangHienTai = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// GET /api/v1/bao-cao/khach-hang?maCN=&thang=YYYY-MM
// Báo cáo khách hàng: hội viên mới, cơ cấu hạng, chi tiêu hội viên
const baoCaoKhachHang = async (req, res, next) => {
  try {
    const maCN  = resolveBranchScope(req.user, req.query.maCN);
    const thang = req.query.thang || thangHienTai();

    const spendParams = [thang];
    let spendBranch = '';
    if (maCN) { spendParams.push(maCN); spendBranch = `AND hd.MaCN = $2`; }

    const [tongQ, hangQ, moiQ, topQ] = await Promise.all([
      req.db.query(`SELECT COUNT(*) AS tongkh, COALESCE(SUM(DiemTichLuy),0) AS tongdiem FROM KHACHHANG`),
      req.db.query(
        `SELECT HangThanhVien AS hang, COUNT(*) AS soluong, COALESCE(SUM(DiemTichLuy),0) AS tongdiem
         FROM KHACHHANG GROUP BY HangThanhVien ORDER BY soluong DESC`),
      req.db.query(
        `SELECT MaKH, HoTen, HangThanhVien, DiemTichLuy, CreatedAt
         FROM KHACHHANG WHERE TO_CHAR(CreatedAt,'YYYY-MM') = $1
         ORDER BY CreatedAt DESC`, [thang]),
      req.db.query(
        `SELECT kh.MaKH, kh.HoTen, kh.HangThanhVien,
                COUNT(hd.MaHD) AS sodon, COALESCE(SUM(hd.TongThanhToan),0) AS tongchitieu
         FROM KHACHHANG kh
         JOIN HOADON hd ON hd.MaKH = kh.MaKH AND hd.TrangThai='Completed'
              AND TO_CHAR(hd.NgayLap,'YYYY-MM') = $1 ${spendBranch}
         GROUP BY kh.MaKH, kh.HoTen, kh.HangThanhVien
         ORDER BY tongchitieu DESC LIMIT 15`, spendParams),
    ]);

    return success(res, {
      thang,
      summary: {
        TongKH:    parseInt(tongQ.rows[0].tongkh),
        TongDiem:  parseInt(tongQ.rows[0].tongdiem),
        HoiVienMoi: moiQ.rows.length,
        ChiTieuHoiVien: topQ.rows.reduce((s, r) => s + parseFloat(r.tongchitieu || 0), 0),
      },
      byRank: hangQ.rows.map((r) => ({
        Hang: r.hang, SoLuong: parseInt(r.soluong), TongDiem: parseInt(r.tongdiem),
      })),
      newMembers: moiQ.rows.map((r) => ({
        MaKH: r.makh, HoTen: r.hoten, Hang: r.hangthanhvien,
        DiemTichLuy: parseInt(r.diemtichluy), NgayDangKy: r.createdat,
      })),
      topSpenders: topQ.rows.map((r) => ({
        MaKH: r.makh, HoTen: r.hoten, Hang: r.hangthanhvien,
        SoDon: parseInt(r.sodon), TongChiTieu: parseFloat(r.tongchitieu),
      })),
    });
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/trang-thai-mon
// Báo cáo trạng thái các món (toàn hệ thống — SANPHAM không gắn chi nhánh)
const baoCaoTrangThaiMon = async (req, res, next) => {
  try {
    const [statusQ, catQ, itemQ] = await Promise.all([
      req.db.query(`SELECT TrangThai, COUNT(*) AS soluong FROM SANPHAM GROUP BY TrangThai`),
      req.db.query(
        `SELECT ls.TenLoai,
                COUNT(*) AS tong,
                COUNT(*) FILTER (WHERE sp.TrangThai='Available')  AS dangban,
                COUNT(*) FILTER (WHERE sp.TrangThai='OutOfStock') AS hethang,
                COUNT(*) FILTER (WHERE sp.TrangThai='Hidden')     AS an
         FROM SANPHAM sp JOIN LOAISANPHAM ls ON ls.MaLoai = sp.MaLoai
         GROUP BY ls.TenLoai ORDER BY ls.TenLoai`),
      req.db.query(
        `SELECT sp.MaSP, sp.TenSP, ls.TenLoai, sp.GiaBanMacDinh, sp.TrangThai
         FROM SANPHAM sp JOIN LOAISANPHAM ls ON ls.MaLoai = sp.MaLoai
         ORDER BY ls.TenLoai, sp.TenSP`),
    ]);

    const statusMap = {};
    statusQ.rows.forEach((r) => { statusMap[r.trangthai] = parseInt(r.soluong); });
    const tong = Object.values(statusMap).reduce((s, n) => s + n, 0);

    return success(res, {
      summary: {
        Tong:    tong,
        DangBan: statusMap['Available']  || 0,
        HetHang: statusMap['OutOfStock'] || 0,
        An:      statusMap['Hidden']     || 0,
      },
      byStatus: statusQ.rows.map((r) => ({ TrangThai: r.trangthai, SoLuong: parseInt(r.soluong) })),
      byCategory: catQ.rows.map((r) => ({
        TenLoai: r.tenloai, Tong: parseInt(r.tong),
        DangBan: parseInt(r.dangban), HetHang: parseInt(r.hethang), An: parseInt(r.an),
      })),
      items: itemQ.rows.map((r) => ({
        MaSP: r.masp, TenSP: r.tensp, TenLoai: r.tenloai,
        GiaBanMacDinh: parseFloat(r.giabanmacdinh), TrangThai: r.trangthai,
      })),
    });
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/nhap-hang?maCN=&thang=YYYY-MM
// Báo cáo nhập hàng: giá nguyên liệu, điều chỉnh kiểm kho, hao hụt
const baoCaoNhapHang = async (req, res, next) => {
  try {
    const maCN  = resolveBranchScope(req.user, req.query.maCN);
    const thang = req.query.thang || thangHienTai();

    const pnParams = [thang]; let pnBranch = '';
    if (maCN) { pnParams.push(maCN); pnBranch = `AND pn.MaCN = $2`; }
    const logBase = [thang]; let logBranch = '';
    if (maCN) { logBase.push(maCN); logBranch = `AND lg.MaCN = $2`; }

    const [giaQ, tongPNQ, dieuChinhQ, haoHutQ] = await Promise.all([
      req.db.query(
        `SELECT ct.MaNL, nl.TenNL, nl.DonViTinh,
                SUM(ct.SoLuong) AS tongsl,
                ROUND(AVG(ct.DonGia))::numeric AS giatb,
                MAX(ct.DonGia) AS giacaonhat, MIN(ct.DonGia) AS giathapnhat,
                SUM(ct.SoLuong * ct.DonGia) AS tongtien
         FROM CHITIET_PHIEUNHAP ct
         JOIN PHIEUNHAP pn ON pn.MaPN = ct.MaPN AND pn.TrangThai='Received'
              AND TO_CHAR(pn.NgayNhap,'YYYY-MM') = $1 ${pnBranch}
         JOIN NGUYENLIEU nl ON nl.MaNL = ct.MaNL
         GROUP BY ct.MaNL, nl.TenNL, nl.DonViTinh
         ORDER BY tongtien DESC`, pnParams),
      req.db.query(
        `SELECT COUNT(*) AS sophieu, COALESCE(SUM(TongTien),0) AS tonggiatri
         FROM PHIEUNHAP pn WHERE pn.TrangThai='Received'
              AND TO_CHAR(pn.NgayNhap,'YYYY-MM') = $1 ${maCN ? 'AND pn.MaCN = $2' : ''}`,
        maCN ? [thang, maCN] : [thang]),
      req.db.query(
        `SELECT nl.TenNL, lg.SoLuong, lg.SoLuongTruoc, lg.SoLuongSau, lg.NgayGhi, lg.GhiChu
         FROM NHATKYKHO lg JOIN NGUYENLIEU nl ON nl.MaNL = lg.MaNL
         WHERE lg.LoaiBienDong='Adjustment' AND TO_CHAR(lg.NgayGhi,'YYYY-MM') = $1 ${logBranch}
         ORDER BY lg.NgayGhi DESC LIMIT 50`, logBase),
      req.db.query(
        `SELECT nl.TenNL, lg.SoLuong, lg.NgayGhi, lg.GhiChu
         FROM NHATKYKHO lg JOIN NGUYENLIEU nl ON nl.MaNL = lg.MaNL
         WHERE lg.LoaiBienDong='Wastage' AND TO_CHAR(lg.NgayGhi,'YYYY-MM') = $1 ${logBranch}
         ORDER BY lg.NgayGhi DESC LIMIT 50`, logBase),
    ]);

    return success(res, {
      thang,
      summary: {
        TongGiaTriNhap: parseFloat(tongPNQ.rows[0].tonggiatri),
        SoPhieuNhap:    parseInt(tongPNQ.rows[0].sophieu),
        SoLanDieuChinh: dieuChinhQ.rows.length,
        SoLanHaoHut:    haoHutQ.rows.length,
      },
      ingredientPrices: giaQ.rows.map((r) => ({
        MaNL: r.manl, TenNL: r.tennl, DonViTinh: r.donvitinh,
        TongSL: parseFloat(r.tongsl), GiaTB: parseFloat(r.giatb),
        GiaCaoNhat: parseFloat(r.giacaonhat), GiaThapNhat: parseFloat(r.giathapnhat),
        TongTien: parseFloat(r.tongtien),
      })),
      adjustments: dieuChinhQ.rows.map((r) => ({
        TenNL: r.tennl, SoLuong: parseFloat(r.soluong),
        SoLuongTruoc: parseFloat(r.soluongtruoc), SoLuongSau: parseFloat(r.soluongsau),
        Ngay: r.ngayghi, GhiChu: r.ghichu,
      })),
      wastage: haoHutQ.rows.map((r) => ({
        TenNL: r.tennl, SoLuong: parseFloat(r.soluong), Ngay: r.ngayghi, GhiChu: r.ghichu,
      })),
    });
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/chi-van-hanh?maCN=&thang=YYYY-MM
// Báo cáo chi phí vận hành (PHIEUCHI đã duyệt)
const baoCaoChiVanHanh = async (req, res, next) => {
  try {
    const maCN  = resolveBranchScope(req.user, req.query.maCN);
    const thang = req.query.thang || thangHienTai();
    const params = [thang]; let branch = '';
    if (maCN) { params.push(maCN); branch = `AND MaCN = $2`; }

    const [typeQ, itemQ] = await Promise.all([
      req.db.query(
        `SELECT LoaiChi, COUNT(*) AS sophieu, SUM(SoTien) AS tongtien
         FROM PHIEUCHI WHERE TrangThai='Approved'
              AND TO_CHAR(NgayChi,'YYYY-MM') = $1 ${branch}
         GROUP BY LoaiChi ORDER BY tongtien DESC`, params),
      req.db.query(
        `SELECT MaPC, NgayChi, LoaiChi, SoTien, TrangThai, MoTa
         FROM PHIEUCHI WHERE TO_CHAR(NgayChi,'YYYY-MM') = $1 ${branch}
         ORDER BY NgayChi DESC LIMIT 100`, params),
    ]);

    const tongChi = typeQ.rows.reduce((s, r) => s + parseFloat(r.tongtien || 0), 0);
    return success(res, {
      thang,
      summary: {
        TongChi: tongChi,
        SoPhieu: typeQ.rows.reduce((s, r) => s + parseInt(r.sophieu || 0), 0),
        SoLoai:  typeQ.rows.length,
      },
      byType: typeQ.rows.map((r) => ({
        LoaiChi: r.loaichi, SoPhieu: parseInt(r.sophieu), TongTien: parseFloat(r.tongtien),
      })),
      items: itemQ.rows.map((r) => ({
        MaPC: r.mapc, Ngay: r.ngaychi, LoaiChi: r.loaichi,
        SoTien: parseFloat(r.sotien), TrangThai: r.trangthai, MoTa: r.mota,
      })),
    });
  } catch (err) { next(err); }
};

// GET /api/v1/bao-cao/dong-tien?maCN=&thang=YYYY-MM
// Báo cáo tổng hợp dòng tiền: Doanh thu - Chi vận hành - Nhập hàng = Lợi nhuận ước tính
// Nguồn: v_TongHopTaiChinh (12 tháng gần nhất, theo từng chi nhánh)
const baoCaoDongTien = async (req, res, next) => {
  try {
    const maCN  = resolveBranchScope(req.user, req.query.maCN);
    const thang = req.query.thang || thangHienTai();          // YYYY-MM
    const [y, m] = thang.split('-');
    const thangNam = `${m}/${y}`;                              // MM/YYYY khớp view

    const params = []; let branch = '';
    if (maCN) { params.push(maCN); branch = `WHERE MaCN = $1`; }
    const { rows } = await req.db.query(
      `SELECT MaCN, TenCN, ThangNam, DoanhThu, ChiPhi, ChiPhiNhapHang, LoiNhuanUocTinh
       FROM v_TongHopTaiChinh ${branch}`, params);

    const norm = (r) => ({
      MaCN: r.macn, TenCN: r.tencn, ThangNam: r.thangnam,
      DoanhThu: parseFloat(r.doanhthu || 0),
      ChiPhiVanHanh: parseFloat(r.chiphi || 0),
      ChiPhiNhapHang: parseFloat(r.chiphinhaphang || 0),
      LoiNhuan: parseFloat(r.loinhuanuoctinh || 0),
    });
    const all = rows.map(norm);

    // Số liệu của tháng được chọn (gộp các chi nhánh)
    const monthRows = all.filter((r) => r.ThangNam === thangNam);
    const sum = (k) => monthRows.reduce((s, r) => s + r[k], 0);

    // Xu hướng 12 tháng (gộp toàn phạm vi theo ThangNam)
    const trendMap = new Map();
    all.forEach((r) => {
      const cur = trendMap.get(r.ThangNam) || {
        ThangNam: r.ThangNam, DoanhThu: 0, ChiPhiVanHanh: 0, ChiPhiNhapHang: 0, LoiNhuan: 0,
      };
      cur.DoanhThu += r.DoanhThu; cur.ChiPhiVanHanh += r.ChiPhiVanHanh;
      cur.ChiPhiNhapHang += r.ChiPhiNhapHang; cur.LoiNhuan += r.LoiNhuan;
      trendMap.set(r.ThangNam, cur);
    });
    const trend = Array.from(trendMap.values()).sort((a, b) => {
      const [am, ay] = a.ThangNam.split('/'); const [bm, by] = b.ThangNam.split('/');
      return (ay + am).localeCompare(by + bm);
    });

    return success(res, {
      thang: thangNam,
      summary: {
        DoanhThu:       sum('DoanhThu'),
        ChiPhiVanHanh:  sum('ChiPhiVanHanh'),
        ChiPhiNhapHang: sum('ChiPhiNhapHang'),
        LoiNhuan:       sum('LoiNhuan'),
      },
      byBranch: monthRows.sort((a, b) => b.LoiNhuan - a.LoiNhuan),
      trend,
    });
  } catch (err) { next(err); }
};

module.exports = {
  dashboard, doanhThuTheoNgay, topSanPham, canhBaoTonKho, bangLuong, lamMoi,
  baoCaoKhachHang, baoCaoTrangThaiMon, baoCaoNhapHang, baoCaoChiVanHanh, baoCaoDongTien,
};
