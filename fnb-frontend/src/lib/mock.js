/**
 * Mock data — dùng khi chưa kết nối DB
 * Khớp chính xác với sample data trong 04_sample_data.sql
 */

export const MOCK_CATEGORIES = [
  { MaLoai: 'L001', TenLoai: 'Cà phê truyền thống' },
  { MaLoai: 'L002', TenLoai: 'Trà hiện đại' },
]

export const MOCK_PRODUCTS = [
  { MaSP: 'SP001', TenSP: 'Cà Phê Sữa Đá',      MaLoai: 'L001', TenLoai: 'Cà phê truyền thống', GiaBan: 35000,  TrangThai: 'Active', emoji: '☕' },
  { MaSP: 'SP002', TenSP: 'Trà Đào Đóng Hộp',   MaLoai: 'L002', TenLoai: 'Trà hiện đại',        GiaBan: 45000,  TrangThai: 'Active', emoji: '🍑' },
  // Thêm sản phẩm demo cho UI đẹp hơn
  { MaSP: 'SP003', TenSP: 'Cà Phê Đen Đá',      MaLoai: 'L001', TenLoai: 'Cà phê truyền thống', GiaBan: 29000,  TrangThai: 'Active', emoji: '🖤' },
  { MaSP: 'SP004', TenSP: 'Bạc Xỉu',            MaLoai: 'L001', TenLoai: 'Cà phê truyền thống', GiaBan: 32000,  TrangThai: 'Active', emoji: '🥛' },
  { MaSP: 'SP005', TenSP: 'Trà Tắc',            MaLoai: 'L002', TenLoai: 'Trà hiện đại',        GiaBan: 25000,  TrangThai: 'Active', emoji: '🍋' },
  { MaSP: 'SP006', TenSP: 'Trà Vải',            MaLoai: 'L002', TenLoai: 'Trà hiện đại',        GiaBan: 39000,  TrangThai: 'Active', emoji: '🍇' },
]

export const MOCK_CUSTOMERS = {
  '0988888888': { MaKH: 'KH001', TenKH: 'Phạm Minh Quang', SDT: '0988888888', HangThanhVien: 'Bronze',  DiemTichLuy: 0   },
  '0977777777': { MaKH: 'KH002', TenKH: 'Hoàng Lê Ngọc',   SDT: '0977777777', HangThanhVien: 'Silver',  DiemTichLuy: 250 },
}

export const DISCOUNT_RATE = {
  Bronze:  0,
  Silver:  0.03,
  Gold:    0.05,
  Diamond: 0.10,
}

// ─── Mock hóa đơn lịch sử ───────────────────────────────────────────────────
export const MOCK_ORDERS = [
  {
    MaHD: 'HD20260527001', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV001', TenNhanVien: 'Nguyễn Văn An',
    MaKH: 'KH001', TenKH: 'Phạm Minh Quang', SDTKH: '0988888888',
    NgayLap: '2026-05-27T08:30:00Z',
    TongTienHang: 95000, GiamGia: 0, TongThanhToan: 95000,
    TrangThai: 'Completed',
    chiTiet: [
      { MaSP: 'SP001', TenSP: 'Cà Phê Sữa Đá',    SoLuong: 2, DonGia: 35000, ThanhTien: 70000 },
      { MaSP: 'SP005', TenSP: 'Trà Tắc',           SoLuong: 1, DonGia: 25000, ThanhTien: 25000 },
    ],
    thanhToan: { MaTT: 'TT20260527001', PhuongThuc: 'Cash', SoTien: 95000, TrangThai: 'Success' },
  },
  {
    MaHD: 'HD20260527002', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV001', TenNhanVien: 'Nguyễn Văn An',
    MaKH: 'KH002', TenKH: 'Hoàng Lê Ngọc', SDTKH: '0977777777',
    NgayLap: '2026-05-27T09:15:00Z',
    TongTienHang: 90000, GiamGia: 2700, TongThanhToan: 87300,
    TrangThai: 'Completed',
    chiTiet: [
      { MaSP: 'SP002', TenSP: 'Trà Đào Đóng Hộp', SoLuong: 2, DonGia: 45000, ThanhTien: 90000 },
    ],
    thanhToan: { MaTT: 'TT20260527002', PhuongThuc: 'Card', SoTien: 87300, TrangThai: 'Success' },
  },
  {
    MaHD: 'HD20260527003', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV001', TenNhanVien: 'Nguyễn Văn An',
    MaKH: null, TenKH: null, SDTKH: null,
    NgayLap: '2026-05-27T10:00:00Z',
    TongTienHang: 68000, GiamGia: 0, TongThanhToan: 68000,
    TrangThai: 'Completed',
    chiTiet: [
      { MaSP: 'SP003', TenSP: 'Cà Phê Đen Đá', SoLuong: 1, DonGia: 29000, ThanhTien: 29000 },
      { MaSP: 'SP006', TenSP: 'Trà Vải',        SoLuong: 1, DonGia: 39000, ThanhTien: 39000 },
    ],
    thanhToan: { MaTT: 'TT20260527003', PhuongThuc: 'E-Wallet', SoTien: 68000, TrangThai: 'Success' },
  },
  {
    MaHD: 'HD20260526001', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV002', TenNhanVien: 'Trần Thị Bình',
    MaKH: null, TenKH: null, SDTKH: null,
    NgayLap: '2026-05-26T14:20:00Z',
    TongTienHang: 35000, GiamGia: 0, TongThanhToan: 35000,
    TrangThai: 'Cancelled',
    chiTiet: [
      { MaSP: 'SP001', TenSP: 'Cà Phê Sữa Đá', SoLuong: 1, DonGia: 35000, ThanhTien: 35000 },
    ],
    thanhToan: null,
  },
  {
    MaHD: 'HD20260526002', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV002', TenNhanVien: 'Trần Thị Bình',
    MaKH: 'KH001', TenKH: 'Phạm Minh Quang', SDTKH: '0988888888',
    NgayLap: '2026-05-26T16:45:00Z',
    TongTienHang: 57000, GiamGia: 0, TongThanhToan: 57000,
    TrangThai: 'Completed',
    chiTiet: [
      { MaSP: 'SP004', TenSP: 'Bạc Xỉu',        SoLuong: 1, DonGia: 32000, ThanhTien: 32000 },
      { MaSP: 'SP005', TenSP: 'Trà Tắc',         SoLuong: 1, DonGia: 25000, ThanhTien: 25000 },
    ],
    thanhToan: { MaTT: 'TT20260526002', PhuongThuc: 'Cash', SoTien: 57000, TrangThai: 'Success' },
  },
  {
    MaHD: 'HD20260525001', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV001', TenNhanVien: 'Nguyễn Văn An',
    MaKH: 'KH002', TenKH: 'Hoàng Lê Ngọc', SDTKH: '0977777777',
    NgayLap: '2026-05-25T11:00:00Z',
    TongTienHang: 45000, GiamGia: 1350, TongThanhToan: 43650,
    TrangThai: 'Completed',
    chiTiet: [
      { MaSP: 'SP002', TenSP: 'Trà Đào Đóng Hộp', SoLuong: 1, DonGia: 45000, ThanhTien: 45000 },
    ],
    thanhToan: { MaTT: 'TT20260525001', PhuongThuc: 'E-Wallet', SoTien: 43650, TrangThai: 'Success' },
  },
]
