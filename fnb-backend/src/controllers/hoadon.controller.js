const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error, paginated } = require('../utils/response');

const DISCOUNT_RATE = { Bronze: 0, Silver: 0.03, Gold: 0.05, Platinum: 0.1 };

const mapPayMethod    = (m) => (m === 'E-Wallet' ? 'EWallet' : m);
const mapPayMethodOut = (m) => (m === 'EWallet'  ? 'E-Wallet' : m);
const canAccessBranchData = (user, maCN) => ['admin', 'giam_doc_van_hanh'].includes(user.vaiTro) || (user.maCN && user.maCN === maCN);

// pg trả về column names lowercase → map sang PascalCase cho frontend
const mapRow = (r) => ({
  MaHD:          r.mahd,
  MaCN:          r.macn,
  TenCN:         r.tencn,
  MaNV:          r.manv,
  TenNhanVien:   r.tennhanvien,
  MaKH:          r.makh,
  TenKH:         r.tenkh,
  SDTKH:         r.sdtkh,
  NgayLap:       r.ngaylap,
  TongTienHang:  parseFloat(r.tongtienhang  || 0),
  GiamGia:       parseFloat(r.giamgia       || 0),
  TongThanhToan: parseFloat(r.tongthanhtoan || 0),
  TrangThai:     r.trangthai,
});

const mapDetail = (r) => ({
  MaHD:          r.mahd,
  MaCN:          r.macn,
  TenCN:         r.tencn,
  MaKH:          r.makh,
  TenKH:         r.tenkh,
  SDTKH:         r.sdtkh,
  HangThanhVien: r.hangthanhvien,
  MaNV:          r.manv,
  TenNhanVien:   r.tennhanvien,
  NgayLap:       r.ngaylap,
  LoaiDonHang:   r.loaidonhang,
  TongTienHang:  parseFloat(r.tongtienhang  || 0),
  GiamGia:       parseFloat(r.giamgia       || 0),
  TongThanhToan: parseFloat(r.tongthanhtoan || 0),
  TrangThai:     r.trangthai,
  GhiChu:        r.ghichu,
  CreatedAt:     r.createdat,
  UpdatedAt:     r.updatedat,
});

const mapChiTiet = (r) => ({
  MaSP:    r.masp,
  TenSP:   r.tensp,
  SoLuong: r.soluong,
  DonGia:  parseFloat(r.dongia   || 0),
  ThanhTien: parseFloat(r.thanhtien || 0),
});

const mapThanhToan = (r) => ({
  MaTT:        r.matt,
  MaHD:        r.mahd,
  PhuongThuc:  mapPayMethodOut(r.phuongthuc),
  SoTien:      parseFloat(r.sotien || 0),
  NgayTT:      r.ngaytt,
  TrangThai:   r.trangthai,
  LoaiGiaoDich: r.loaigiaodich,
});

const getAll = async (req, res, next) => {
  try {
    const { maCN, trangThai, ngay, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    const effectiveMaCN = ['thu_ngan', 'quan_ly_chinhanh'].includes(req.user.vaiTro) ? req.user.maCN : maCN;
    if (effectiveMaCN) { params.push(effectiveMaCN); conds.push(`hd.MaCN = $${params.length}`); }
    if (trangThai) { params.push(trangThai); conds.push(`hd.TrangThai = $${params.length}`); }
    if (ngay) { params.push(ngay); conds.push(`hd.NgayLap::DATE = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    params.push(limit, offset);

    // queryCtx: HOADON có RLS policy → cần set context để RLS hoạt động đúng
    const { rows } = await db.queryCtx(req,
      `SELECT hd.MaHD, hd.MaCN, cn.TenCN, hd.MaNV, nv.HoTen AS TenNhanVien,
              hd.MaKH, kh.HoTen AS TenKH, kh.SDT AS SDTKH,
              hd.NgayLap, hd.TongTienHang, hd.GiamGia, hd.TongThanhToan, hd.TrangThai
       FROM HOADON hd
       JOIN CHINHANH cn ON cn.MaCN = hd.MaCN
       LEFT JOIN NHANVIEN nv ON nv.MaNV = hd.MaNV
       LEFT JOIN KHACHHANG kh ON kh.MaKH = hd.MaKH
       ${where}
       ORDER BY hd.NgayLap DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const { rows: cr } = await db.queryCtx(req, `SELECT COUNT(*) FROM HOADON hd ${where}`, params.slice(0, -2));
    return paginated(res, rows.map(mapRow), parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await db.queryCtx(req,
      `SELECT hd.*, cn.TenCN, nv.HoTen AS TenNhanVien, kh.HoTen AS TenKH, kh.SDT AS SDTKH, kh.HangThanhVien
       FROM HOADON hd
       JOIN CHINHANH cn ON cn.MaCN = hd.MaCN
       LEFT JOIN NHANVIEN nv ON nv.MaNV = hd.MaNV
       LEFT JOIN KHACHHANG kh ON kh.MaKH = hd.MaKH
       WHERE hd.MaHD = $1`,
      [req.params.maHD]
    );
    if (!rows[0]) return error(res, 'Hóa đơn không tồn tại.', 404);
    if (!canAccessBranchData(req.user, rows[0].macn)) return error(res, 'Bạn không có quyền xem hóa đơn thuộc chi nhánh khác.', 403);

    const { rows: chiTiet } = await db.query(
      `SELECT cthd.MaSP, sp.TenSP, cthd.SoLuong, cthd.GiaBanTaiThoiDiem AS DonGia, cthd.ThanhTien
       FROM CHITIET_HOADON cthd
       JOIN SANPHAM sp ON sp.MaSP = cthd.MaSP
       WHERE cthd.MaHD = $1`,
      [req.params.maHD]
    );

    const { rows: thanhToan } = await db.queryCtx(req, `SELECT * FROM THANHTOAN WHERE MaHD = $1 ORDER BY NgayTT DESC`, [req.params.maHD]);
    return success(res, { ...mapDetail(rows[0]), chiTiet: chiTiet.map(mapChiTiet), thanhToan: thanhToan[0] ? mapThanhToan(thanhToan[0]) : null });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    // SET LOCAL context ngay trong transaction này để RLS hoạt động đúng
    await client.query(
      `SELECT set_config('app.current_employee_id', $1, true),
              set_config('app.current_branch_id',   $2, true)`,
      [String(req.user.maNV), String(req.user.maCN || '')]
    );

    const { MaCN, MaKH, phuongThuc, items } = req.body;
    const MaNV = req.user.maNV;
    const maCN = MaCN || req.user.maCN;
    const MaHD = genMa('HD');

    let tongTienHang = 0;
    const enriched = [];
    for (const item of items) {
      const { rows: sp } = await client.query(
        `SELECT MaSP, TenSP, GiaBanMacDinh FROM SANPHAM WHERE MaSP = $1 AND TrangThai = 'Available'`,
        [item.MaSP]
      );
      if (!sp[0]) throw { status: 400, message: `Sản phẩm ${item.MaSP} không tồn tại hoặc ngừng bán.` };
      const donGia = parseFloat(sp[0].giabanmacdinh);
      tongTienHang += donGia * item.SoLuong;
      enriched.push({ MaSP: item.MaSP, SoLuong: item.SoLuong, DonGia: donGia });
    }

    let giamGia = 0;
    if (MaKH) {
      const { rows: kh } = await client.query(`SELECT HangThanhVien FROM KHACHHANG WHERE MaKH = $1`, [MaKH]);
      if (kh[0]) giamGia = Math.round(tongTienHang * (DISCOUNT_RATE[kh[0].hangthanhvien] || 0));
    }

    await client.query(
      `INSERT INTO HOADON (MaHD, MaCN, MaNV, MaKH, GiamGia, TrangThai)
       VALUES ($1,$2,$3,$4,$5,'Pending')`,
      [MaHD, maCN, MaNV, MaKH || null, giamGia]
    );

    for (const item of enriched) {
      await client.query(
        `INSERT INTO CHITIET_HOADON (MaHD, MaSP, SoLuong, GiaBanTaiThoiDiem) VALUES ($1,$2,$3,$4)`,
        [MaHD, item.MaSP, item.SoLuong, item.DonGia]
      );
    }

    const { rows: hdRow } = await client.query(`SELECT TongTienHang, GiamGia, TongThanhToan FROM HOADON WHERE MaHD = $1`, [MaHD]);

    const MaTT = genMa('TT');
    await client.query(
      `INSERT INTO THANHTOAN (MaTT, MaHD, PhuongThuc, SoTien, TrangThai)
       VALUES ($1,$2,$3,$4,'Success')`,
      [MaTT, MaHD, mapPayMethod(phuongThuc), hdRow[0].tongthanhtoan]
    );

    await client.query('COMMIT');

    return success(res, {
      MaHD,
      MaTT,
      TongTienHang: parseFloat(hdRow[0].tongtienhang),
      GiamGia: parseFloat(hdRow[0].giamgia),
      TongThanhToan: parseFloat(hdRow[0].tongthanhtoan),
    }, 'Tạo hóa đơn và thanh toán thành công', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message && err.message.includes('không đủ')) return error(res, err.message, 422);
    next(err);
  } finally { client.release(); }
};

const huyDon = async (req, res, next) => {
  try {
    // Kiểm tra tồn tại + branch scoping trước
    const { rows: checkRows } = await db.queryCtx(req, `SELECT TrangThai, MaCN FROM HOADON WHERE MaHD = $1`, [req.params.maHD]);
    const hd = checkRows[0];
    if (!hd) return error(res, 'Hóa đơn không tồn tại.', 404);
    if (!canAccessBranchData(req.user, hd.macn)) return error(res, 'Bạn không có quyền huỷ hóa đơn thuộc chi nhánh khác.', 403);
    if (hd.trangthai === 'Cancelled') return error(res, 'Hóa đơn đã bị huỷ.', 400);

    // Conditional UPDATE: chỉ update nếu trạng thái vẫn chưa phải Cancelled (tránh race condition)
    const { rowCount } = await db.queryCtx(req,
      `UPDATE HOADON SET TrangThai = 'Cancelled', UpdatedAt = NOW()
       WHERE MaHD = $1 AND TrangThai <> 'Cancelled'`,
      [req.params.maHD]
    );
    if (rowCount === 0) return error(res, 'Hóa đơn đã bị huỷ bởi thao tác đồng thời khác.', 409);
    return success(res, null, 'Đã huỷ hóa đơn thành công.');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, huyDon };
