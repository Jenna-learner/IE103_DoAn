/**
 * Controller: HOADON (Hóa đơn bán hàng - POS)
 * Bảng: HOADON, CHITIET_HOADON, THANHTOAN
 *
 * ⚡ QUAN TRỌNG - Logic tự động bởi PostgreSQL Triggers:
 *   trg_recalc_hoadon  → Tự tính TongTienHang & TongThanhToan khi thêm CHITIET_HOADON
 *   trg_hoadon_export  → Tự khấu trừ TONKHO_CHINHANH khi TrangThai → 'Completed'
 *   trg_hoadon_crm     → Tự cộng DiemTichLuy cho KHACHHANG khi TrangThai → 'Completed'
 *
 * Node.js chỉ cần:
 *   1. Insert HOADON (Pending) với GiamGia tính sẵn từ hạng thành viên
 *   2. Insert CHITIET_HOADON → trigger tự tính tổng
 *   3. UPDATE TrangThai = 'Completed' → triggers tự chạy toàn bộ
 *   4. Insert THANHTOAN
 */
const db = require('../config/db');
const { genMa } = require('../utils/magen');
const { success, error, paginated } = require('../utils/response');

// Tỷ lệ giảm giá theo hạng thành viên
const DISCOUNT_RATE = { Bronze: 0, Silver: 0.03, Gold: 0.05, Diamond: 0.10 };

// GET /api/v1/hoa-don?maCN=&trangThai=&ngay=YYYY-MM-DD&page=
const getAll = async (req, res, next) => {
  try {
    const { maCN, trangThai, ngay, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    // Thu ngân và quản lý chỉ xem chi nhánh mình
    const effectiveMaCN = ['thu_ngan', 'quan_ly_chinhanh'].includes(req.user.vaiTro)
      ? req.user.maCN
      : maCN;

    if (effectiveMaCN) { params.push(effectiveMaCN); conds.push(`hd.MaCN = $${params.length}`); }
    if (trangThai)     { params.push(trangThai);      conds.push(`hd.TrangThai = $${params.length}`); }
    if (ngay)          { params.push(ngay);            conds.push(`hd.NgayLap::DATE = $${params.length}`); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT hd.MaHD, hd.MaCN, cn.TenCN, hd.MaNV, nv.HoTen AS TenNhanVien,
              hd.MaKH, kh.TenKH, kh.SDT AS SDTKH,
              hd.NgayLap, hd.TongTienHang, hd.GiamGia, hd.TongThanhToan, hd.TrangThai
       FROM HOADON hd
       JOIN CHINHANH cn  ON cn.MaCN = hd.MaCN
       LEFT JOIN NHANVIEN nv ON nv.MaNV = hd.MaNV
       LEFT JOIN KHACHHANG kh ON kh.MaKH = hd.MaKH
       ${where}
       ORDER BY hd.NgayLap DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const { rows: cr } = await db.query(
      `SELECT COUNT(*) FROM HOADON hd ${where}`, params.slice(0, -2)
    );

    return paginated(res, rows, parseInt(cr[0].count), page, limit);
  } catch (err) { next(err); }
};

// GET /api/v1/hoa-don/:maHD  (kèm chi tiết + thanh toán)
const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT hd.*, cn.TenCN, nv.HoTen AS TenNhanVien, kh.TenKH, kh.SDT AS SDTKH, kh.HangThanhVien
       FROM HOADON hd
       JOIN CHINHANH cn  ON cn.MaCN = hd.MaCN
       LEFT JOIN NHANVIEN nv ON nv.MaNV = hd.MaNV
       LEFT JOIN KHACHHANG kh ON kh.MaKH = hd.MaKH
       WHERE hd.MaHD = $1`, [req.params.maHD]
    );
    if (!rows[0]) return error(res, 'Hóa đơn không tồn tại.', 404);

    const { rows: chiTiet } = await db.query(
      `SELECT cthd.MaSP, sp.TenSP, cthd.SoLuong, cthd.DonGia, cthd.ThanhTien
       FROM CHITIET_HOADON cthd
       JOIN SANPHAM sp ON sp.MaSP = cthd.MaSP
       WHERE cthd.MaHD = $1`, [req.params.maHD]
    );

    const { rows: thanhToan } = await db.query(
      `SELECT * FROM THANHTOAN WHERE MaHD = $1`, [req.params.maHD]
    );

    return success(res, { ...rows[0], chiTiet, thanhToan: thanhToan[0] || null });
  } catch (err) { next(err); }
};

// POST /api/v1/hoa-don  (Tạo đơn hàng POS)
const create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { MaCN, MaKH, phuongThuc, items } = req.body;
    // items: [{ MaSP, SoLuong }]
    const MaNV  = req.user.maNV;
    const maCN  = MaCN || req.user.maCN;
    const MaHD  = genMa('HD');

    // 1. Lấy giá sản phẩm + tính tổng tiền hàng
    let tongTienHang = 0;
    const enriched = [];
    for (const item of items) {
      const { rows: sp } = await client.query(
        `SELECT MaSP, TenSP, GiaBan FROM SANPHAM WHERE MaSP = $1 AND TrangThai = 'Active'`,
        [item.MaSP]
      );
      if (!sp[0]) throw { status: 400, message: `Sản phẩm ${item.MaSP} không tồn tại hoặc ngừng bán.` };
      const thanhTien = sp[0].giaban * item.SoLuong;
      tongTienHang += thanhTien;
      enriched.push({ MaSP: item.MaSP, SoLuong: item.SoLuong, DonGia: sp[0].giaban, ThanhTien: thanhTien });
    }

    // 2. Tính giảm giá theo hạng thành viên
    let giamGia = 0;
    if (MaKH) {
      const { rows: kh } = await client.query(
        `SELECT HangThanhVien FROM KHACHHANG WHERE MaKH = $1`, [MaKH]
      );
      if (kh[0]) {
        const rate = DISCOUNT_RATE[kh[0].hangthanhvien] || 0;
        giamGia = Math.round(tongTienHang * rate);
      }
    }

    // 3. Tạo HOADON (Pending) — GiamGia đặt sẵn để trigger recalc đúng
    await client.query(
      `INSERT INTO HOADON (MaHD, MaCN, MaNV, MaKH, GiamGia, TrangThai)
       VALUES ($1,$2,$3,$4,$5,'Pending')`,
      [MaHD, maCN, MaNV, MaKH || null, giamGia]
    );

    // 4. Insert CHITIET_HOADON → trigger trg_recalc_hoadon tự tính TongTienHang + TongThanhToan
    for (const item of enriched) {
      await client.query(
        `INSERT INTO CHITIET_HOADON (MaHD, MaSP, SoLuong, DonGia) VALUES ($1,$2,$3,$4)`,
        [MaHD, item.MaSP, item.SoLuong, item.DonGia]
      );
    }

    // 5. Update TrangThai = 'Completed' → triggers tự khấu trừ kho + tích điểm CRM
    //    (trigger BEFORE UPDATE sẽ kiểm tra tồn kho, RAISE EXCEPTION nếu không đủ)
    await client.query(
      `UPDATE HOADON SET TrangThai = 'Completed' WHERE MaHD = $1`, [MaHD]
    );

    // 6. Lấy lại TongThanhToan đã được trigger tính toán
    const { rows: hdRow } = await client.query(
      `SELECT TongTienHang, GiamGia, TongThanhToan FROM HOADON WHERE MaHD = $1`, [MaHD]
    );

    // 7. Insert THANHTOAN
    const MaTT = genMa('TT');
    await client.query(
      `INSERT INTO THANHTOAN (MaTT, MaHD, PhuongThuc, SoTien, TrangThai)
       VALUES ($1,$2,$3,$4,'Success')`,
      [MaTT, MaHD, phuongThuc, hdRow[0].tongthanhToan]
    );

    await client.query('COMMIT');

    return success(res, {
      MaHD,
      MaTT,
      TongTienHang:  parseFloat(hdRow[0].tongtienHang),
      GiamGia:       parseFloat(hdRow[0].giamgia),
      TongThanhToan: parseFloat(hdRow[0].tongthanhToan),
    }, 'Tạo hóa đơn và thanh toán thành công', 201);

  } catch (err) {
    await client.query('ROLLBACK');
    // Trigger RAISE EXCEPTION → err.message có nội dung rõ ràng
    if (err.message && err.message.includes('không đủ nguyên liệu')) {
      return error(res, err.message, 422);
    }
    next(err);
  } finally { client.release(); }
};

// PATCH /api/v1/hoa-don/:maHD/huy  (Yêu cầu huỷ đơn - chỉ quản lý)
// Lưu ý: Schema không có trigger hoàn kho khi huỷ → cần xử lý thủ công
const huyDon = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM HOADON WHERE MaHD = $1`, [req.params.maHD]);
    const hd = rows[0];
    if (!hd) throw { status: 404, message: 'Hóa đơn không tồn tại.' };
    if (hd.trangthai === 'Cancelled') throw { status: 400, message: 'Hóa đơn đã bị huỷ.' };

    // Huỷ không thể sau khi Completed → cần hoàn kho thủ công
    if (hd.trangthai === 'Completed') {
      // Hoàn kho theo công thức
      const { rows: chiTiet } = await client.query(
        `SELECT cthd.MaSP, cthd.SoLuong FROM CHITIET_HOADON cthd WHERE cthd.MaHD = $1`, [hd.mahd]
      );
      for (const item of chiTiet) {
        const { rows: recipes } = await client.query(
          `SELECT ct.MaNL, ct.SoLuongLuong, tk.SoLuongTon
           FROM CONGTHUC ct
           JOIN TONKHO_CHINHANH tk ON tk.MaNL = ct.MaNL AND tk.MaCN = $1
           WHERE ct.MaSP = $2`,
          [hd.macn, item.masp]
        );
        for (const r of recipes) {
          const hoiLai = r.soLuongLuong * item.soluong;
          const moi   = parseFloat(r.soluongton) + hoiLai;
          await client.query(
            `UPDATE TONKHO_CHINHANH SET SoLuongTon = $1 WHERE MaCN = $2 AND MaNL = $3`,
            [moi, hd.macn, r.manl]
          );
          await client.query(
            `INSERT INTO NHATKYKHO (MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau, NguonPhatSinh, MaChungTu, MaNVThucHien)
             VALUES ($1,$2,'Audit_Gain',$3,$4,$5,'Cancel Order',$6,$7)`,
            [hd.macn, r.manl, hoiLai, r.soluongton, moi, hd.mahd, req.user.maNV]
          );
        }
      }
    }

    await client.query(`UPDATE HOADON SET TrangThai = 'Cancelled' WHERE MaHD = $1`, [hd.mahd]);
    await client.query('COMMIT');
    return success(res, null, 'Đã huỷ hóa đơn và hoàn kho thành công.');
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

module.exports = { getAll, getById, create, huyDon };
