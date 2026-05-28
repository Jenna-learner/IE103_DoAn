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
  { MaSP: 'SP003', TenSP: 'Cà Phê Đen Đá',      MaLoai: 'L001', TenLoai: 'Cà phê truyền thống', GiaBan: 29000,  TrangThai: 'Active', emoji: '🖤' },
  { MaSP: 'SP004', TenSP: 'Bạc Xỉu',            MaLoai: 'L001', TenLoai: 'Cà phê truyền thống', GiaBan: 32000,  TrangThai: 'Active', emoji: '🥛' },
  { MaSP: 'SP005', TenSP: 'Trà Tắc',            MaLoai: 'L002', TenLoai: 'Trà hiện đại',        GiaBan: 25000,  TrangThai: 'Active', emoji: '🍋' },
  { MaSP: 'SP006', TenSP: 'Trà Vải',            MaLoai: 'L002', TenLoai: 'Trà hiện đại',        GiaBan: 39000,  TrangThai: 'Active', emoji: '🍇' },
]

export const MOCK_CUSTOMERS = {
  '0988888888': { MaKH: 'KH001', TenKH: 'Phạm Minh Quang', SDT: '0988888888', HangThanhVien: 'Bronze',  DiemTichLuy: 0   },
  '0977777777': { MaKH: 'KH002', TenKH: 'Hoàng Lê Ngọc',   SDT: '0977777777', HangThanhVien: 'Silver',  DiemTichLuy: 250 },
}

// Danh sách khách hàng đầy đủ cho trang CRM
export const MOCK_CUSTOMERS_LIST = [
  {
    MaKH: 'KH001', TenKH: 'Phạm Minh Quang', SDT: '0988888888',
    HangThanhVien: 'Bronze', DiemTichLuy: 0,
    NgayThamGia: '2025-11-10', TongDonHang: 3, TongChiTieu: 177000,
  },
  {
    MaKH: 'KH002', TenKH: 'Hoàng Lê Ngọc', SDT: '0977777777',
    HangThanhVien: 'Silver', DiemTichLuy: 250,
    NgayThamGia: '2025-09-05', TongDonHang: 5, TongChiTieu: 420000,
  },
  {
    MaKH: 'KH003', TenKH: 'Nguyễn Thị Mai', SDT: '0912345678',
    HangThanhVien: 'Gold', DiemTichLuy: 820,
    NgayThamGia: '2025-03-22', TongDonHang: 18, TongChiTieu: 1350000,
  },
  {
    MaKH: 'KH004', TenKH: 'Trần Văn Hùng', SDT: '0934567890',
    HangThanhVien: 'Diamond', DiemTichLuy: 2100,
    NgayThamGia: '2024-08-15', TongDonHang: 42, TongChiTieu: 4800000,
  },
  {
    MaKH: 'KH005', TenKH: 'Lê Thị Thu', SDT: '0945678901',
    HangThanhVien: 'Bronze', DiemTichLuy: 60,
    NgayThamGia: '2026-02-14', TongDonHang: 2, TongChiTieu: 95000,
  },
  {
    MaKH: 'KH006', TenKH: 'Võ Minh Khoa', SDT: '0956789012',
    HangThanhVien: 'Silver', DiemTichLuy: 380,
    NgayThamGia: '2025-06-01', TongDonHang: 9, TongChiTieu: 670000,
  },
]

export const DISCOUNT_RATE = {
  Bronze:  0,
  Silver:  0.03,
  Gold:    0.05,
  Diamond: 0.10,
}

// ─── Mock hóa đơn lịch sử ───────────────────────────────────────────────────
export const MOCK_ORDERS = [
  {
    MaHD: 'HD20260528001', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV001', TenNhanVien: 'Trần Yến Nhi',
    MaKH: 'KH003', TenKH: 'Nguyễn Thị Mai', SDTKH: '0912345678',
    NgayLap: '2026-05-28T08:45:00Z',
    TongTienHang: 74000, GiamGia: 3700, TongThanhToan: 70300,
    TrangThai: 'Completed',
    chiTiet: [
      { MaSP: 'SP001', TenSP: 'Cà Phê Sữa Đá', SoLuong: 1, DonGia: 35000, ThanhTien: 35000 },
      { MaSP: 'SP006', TenSP: 'Trà Vải',        SoLuong: 1, DonGia: 39000, ThanhTien: 39000 },
    ],
    thanhToan: { MaTT: 'TT20260528001', PhuongThuc: 'E-Wallet', SoTien: 70300, TrangThai: 'Success' },
  },
  {
    MaHD: 'HD20260528002', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV004', TenNhanVien: 'Phạm Thị Dung',
    MaKH: null, TenKH: null, SDTKH: null,
    NgayLap: '2026-05-28T10:30:00Z',
    TongTienHang: 86000, GiamGia: 0, TongThanhToan: 86000,
    TrangThai: 'Completed',
    chiTiet: [
      { MaSP: 'SP003', TenSP: 'Cà Phê Đen Đá', SoLuong: 1, DonGia: 29000, ThanhTien: 29000 },
      { MaSP: 'SP005', TenSP: 'Trà Tắc',        SoLuong: 1, DonGia: 25000, ThanhTien: 25000 },
      { MaSP: 'SP004', TenSP: 'Bạc Xỉu',        SoLuong: 1, DonGia: 32000, ThanhTien: 32000 },
    ],
    thanhToan: { MaTT: 'TT20260528002', PhuongThuc: 'Cash', SoTien: 86000, TrangThai: 'Success' },
  },
  {
    MaHD: 'HD20260527001', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    MaNV: 'NV001', TenNhanVien: 'Trần Yến Nhi',
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
    MaNV: 'NV001', TenNhanVien: 'Trần Yến Nhi',
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
    MaNV: 'NV001', TenNhanVien: 'Trần Yến Nhi',
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
    MaNV: 'NV001', TenNhanVien: 'Trần Yến Nhi',
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

// ─── Mock tồn kho nguyên liệu ────────────────────────────────────────────────
export const MOCK_TONKHO = [
  { MaNL: 'NL001', TenNL: 'Cà phê Robusta',       DonViTinh: 'kg',   SoLuongTon: 12.5, TonToiThieu: 5.0,  GiaNhap: 85000  },
  { MaNL: 'NL002', TenNL: 'Sữa đặc Ông Thọ',      DonViTinh: 'lon',  SoLuongTon: 48,   TonToiThieu: 20,   GiaNhap: 22000  },
  { MaNL: 'NL003', TenNL: 'Trà đào syrup',         DonViTinh: 'chai', SoLuongTon: 3,    TonToiThieu: 5,    GiaNhap: 95000  },
  { MaNL: 'NL004', TenNL: 'Đường trắng',           DonViTinh: 'kg',   SoLuongTon: 8.0,  TonToiThieu: 3.0,  GiaNhap: 18000  },
  { MaNL: 'NL005', TenNL: 'Nước cốt tắc',          DonViTinh: 'lít',  SoLuongTon: 1.2,  TonToiThieu: 2.0,  GiaNhap: 45000  },
  { MaNL: 'NL006', TenNL: 'Trà vải nụ',            DonViTinh: 'kg',   SoLuongTon: 0.5,  TonToiThieu: 1.0,  GiaNhap: 120000 },
  { MaNL: 'NL007', TenNL: 'Ly nhựa 500ml',         DonViTinh: 'cái',  SoLuongTon: 320,  TonToiThieu: 100,  GiaNhap: 800    },
  { MaNL: 'NL008', TenNL: 'Ống hút',               DonViTinh: 'cái',  SoLuongTon: 85,   TonToiThieu: 100,  GiaNhap: 150    },
  { MaNL: 'NL009', TenNL: 'Đá viên (túi 5kg)',     DonViTinh: 'túi',  SoLuongTon: 6,    TonToiThieu: 3,    GiaNhap: 15000  },
  { MaNL: 'NL010', TenNL: 'Sữa tươi không đường',  DonViTinh: 'lít',  SoLuongTon: 4.0,  TonToiThieu: 5.0,  GiaNhap: 32000  },
]

// ─── Mock nhật ký biến động kho ──────────────────────────────────────────────
export const MOCK_NHATKYKHO = [
  { MaLog: 1,  MaNL: 'NL001', TenNL: 'Cà phê Robusta',   LoaiBienDong: 'Export',     SoLuong: 0.05, SoLuongTruoc: 12.55, SoLuongSau: 12.5,  NguonPhatSinh: 'Bán hàng',  MaChungTu: 'HD20260527001', NgayThayDoi: '2026-05-27T08:30:00Z', TenNV: 'Trần Yến Nhi'  },
  { MaLog: 2,  MaNL: 'NL002', TenNL: 'Sữa đặc Ông Thọ',  LoaiBienDong: 'Export',     SoLuong: 2,    SoLuongTruoc: 50,    SoLuongSau: 48,    NguonPhatSinh: 'Bán hàng',  MaChungTu: 'HD20260527001', NgayThayDoi: '2026-05-27T08:30:00Z', TenNV: 'Trần Yến Nhi'  },
  { MaLog: 3,  MaNL: 'NL003', TenNL: 'Trà đào syrup',    LoaiBienDong: 'Export',     SoLuong: 0.05, SoLuongTruoc: 3.05,  SoLuongSau: 3.0,   NguonPhatSinh: 'Bán hàng',  MaChungTu: 'HD20260527002', NgayThayDoi: '2026-05-27T09:15:00Z', TenNV: 'Trần Yến Nhi'  },
  { MaLog: 4,  MaNL: 'NL001', TenNL: 'Cà phê Robusta',   LoaiBienDong: 'Import',     SoLuong: 5.0,  SoLuongTruoc: 7.55,  SoLuongSau: 12.55, NguonPhatSinh: 'Nhập hàng', MaChungTu: 'PN20260526001', NgayThayDoi: '2026-05-26T07:00:00Z', TenNV: 'Trần Thị Bình'  },
  { MaLog: 5,  MaNL: 'NL007', TenNL: 'Ly nhựa 500ml',    LoaiBienDong: 'Import',     SoLuong: 200,  SoLuongTruoc: 120,   SoLuongSau: 320,   NguonPhatSinh: 'Nhập hàng', MaChungTu: 'PN20260526001', NgayThayDoi: '2026-05-26T07:00:00Z', TenNV: 'Trần Thị Bình'  },
  { MaLog: 6,  MaNL: 'NL005', TenNL: 'Nước cốt tắc',     LoaiBienDong: 'Audit_Loss', SoLuong: 0.3,  SoLuongTruoc: 1.5,   SoLuongSau: 1.2,   NguonPhatSinh: 'Kiểm kho',  MaChungTu: 'KK20260525001', NgayThayDoi: '2026-05-25T17:00:00Z', TenNV: 'Trần Thị Bình'  },
  { MaLog: 7,  MaNL: 'NL006', TenNL: 'Trà vải nụ',       LoaiBienDong: 'Audit_Loss', SoLuong: 0.1,  SoLuongTruoc: 0.6,   SoLuongSau: 0.5,   NguonPhatSinh: 'Kiểm kho',  MaChungTu: 'KK20260525001', NgayThayDoi: '2026-05-25T17:00:00Z', TenNV: 'Trần Thị Bình'  },
  { MaLog: 8,  MaNL: 'NL002', TenNL: 'Sữa đặc Ông Thọ',  LoaiBienDong: 'Export',     SoLuong: 1,    SoLuongTruoc: 51,    SoLuongSau: 50,    NguonPhatSinh: 'Bán hàng',  MaChungTu: 'HD20260526002', NgayThayDoi: '2026-05-26T16:45:00Z', TenNV: 'Trần Thị Bình'  },
  { MaLog: 9,  MaNL: 'NL004', TenNL: 'Đường trắng',      LoaiBienDong: 'Import',     SoLuong: 5.0,  SoLuongTruoc: 3.0,   SoLuongSau: 8.0,   NguonPhatSinh: 'Nhập hàng', MaChungTu: 'PN20260524001', NgayThayDoi: '2026-05-24T08:00:00Z', TenNV: 'Trần Yến Nhi'  },
  { MaLog: 10, MaNL: 'NL010', TenNL: 'Sữa tươi KĐ',     LoaiBienDong: 'Export',     SoLuong: 1.0,  SoLuongTruoc: 5.0,   SoLuongSau: 4.0,   NguonPhatSinh: 'Bán hàng',  MaChungTu: 'HD20260526002', NgayThayDoi: '2026-05-26T16:45:00Z', TenNV: 'Trần Thị Bình'  },
]

// ─── Mock nhà cung cấp ────────────────────────────────────────────────────────
export const MOCK_NHA_CUNG_CAP = [
  { MaNCC: 'NCC001', TenNCC: 'Cty CP Cà phê Trung Nguyên', SDT: '02838765432', DiaChi: '82 Bùi Thị Xuân, Q.1' },
  { MaNCC: 'NCC002', TenNCC: 'Cty TNHH Sữa Vinamilk',      SDT: '02838123456', DiaChi: '184 Nguyễn Đình Chiểu, Q.3' },
  { MaNCC: 'NCC003', TenNCC: 'HTX Trà Thái Nguyên',         SDT: '02098765432', DiaChi: '45 Đinh Tiên Hoàng, Bình Thạnh' },
  { MaNCC: 'NCC004', TenNCC: 'Cty CP Bao Bì Tân Tiến',      SDT: '02838654321', DiaChi: '120 Cộng Hòa, Tân Bình' },
]

// ─── Mock phiếu nhập hàng ────────────────────────────────────────────────────
export const MOCK_PHIEU_NHAP = [
  {
    MaPN: 'PN20260526001', MaNCC: 'NCC001', TenNCC: 'Cty CP Cà phê Trung Nguyên',
    MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    NgayNhap: '2026-05-26', GhiChu: 'Nhập định kỳ tuần',
    TrangThai: 'Approved', NgayTao: '2026-05-25T09:00:00Z', MaNVLap: 'NV002',
    TongTien: 625000,
    chiTiet: [
      { MaNL: 'NL001', TenNL: 'Cà phê Robusta',   DonViTinh: 'kg',   SoLuong: 5,   DonGia: 85000, ThanhTien: 425000 },
      { MaNL: 'NL007', TenNL: 'Ly nhựa 500ml',    DonViTinh: 'cái',  SoLuong: 200, DonGia: 800,   ThanhTien: 160000 },
      { MaNL: 'NL009', TenNL: 'Đá viên (túi 5kg)',DonViTinh: 'túi',  SoLuong: 2,   DonGia: 15000, ThanhTien: 30000  },
      { MaNL: 'NL004', TenNL: 'Đường trắng',      DonViTinh: 'kg',   SoLuong: 1,   DonGia: 10000, ThanhTien: 10000  },
    ],
  },
  {
    MaPN: 'PN20260524001', MaNCC: 'NCC002', TenNCC: 'Cty TNHH Sữa Vinamilk',
    MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    NgayNhap: '2026-05-24', GhiChu: '',
    TrangThai: 'Approved', NgayTao: '2026-05-23T14:00:00Z', MaNVLap: 'NV001',
    TongTien: 274000,
    chiTiet: [
      { MaNL: 'NL002', TenNL: 'Sữa đặc Ông Thọ',     DonViTinh: 'lon', SoLuong: 5, DonGia: 22000, ThanhTien: 110000 },
      { MaNL: 'NL010', TenNL: 'Sữa tươi không đường', DonViTinh: 'lít', SoLuong: 4, DonGia: 32000, ThanhTien: 128000 },
      { MaNL: 'NL004', TenNL: 'Đường trắng',          DonViTinh: 'kg',  SoLuong: 2, DonGia: 18000, ThanhTien: 36000  },
    ],
  },
  {
    MaPN: 'PN20260527001', MaNCC: 'NCC003', TenNCC: 'HTX Trà Thái Nguyên',
    MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1',
    NgayNhap: '2026-05-28', GhiChu: 'Cần gấp trà đào và trà vải',
    TrangThai: 'Draft', NgayTao: '2026-05-27T11:00:00Z', MaNVLap: 'NV002',
    TongTien: 525000,
    chiTiet: [
      { MaNL: 'NL003', TenNL: 'Trà đào syrup', DonViTinh: 'chai', SoLuong: 3, DonGia: 95000,  ThanhTien: 285000 },
      { MaNL: 'NL006', TenNL: 'Trà vải nụ',    DonViTinh: 'kg',   SoLuong: 2, DonGia: 120000, ThanhTien: 240000 },
    ],
  },
]

// ─── Mock nhân viên ───────────────────────────────────────────────────────────
export const MOCK_NHAN_VIEN = [
  { MaNV: 'NV001', HoTen: 'Trần Yến Nhi',    VaiTro: 'role_admin',            MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1' },
  { MaNV: 'NV002', HoTen: 'Trần Thị Bình',   VaiTro: 'role_warehouse_staff', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1' },
  { MaNV: 'NV003', HoTen: 'Lê Văn Cường',    VaiTro: 'role_cashier',         MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1' },
  { MaNV: 'NV004', HoTen: 'Phạm Thị Dung',   VaiTro: 'role_cashier',         MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1' },
  { MaNV: 'NV005', HoTen: 'Hoàng Minh Đức',  VaiTro: 'role_warehouse_staff', MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1' },
]

// ─── Mock ca làm việc (CALAM) ─────────────────────────────────────────────────
export const MOCK_CALAM = [
  { MaCa: 'CA001', TenCa: 'Ca Sáng',  GioBatDau: '06:00', GioKetThuc: '12:00', DonGiaLuong: 150000 },
  { MaCa: 'CA002', TenCa: 'Ca Chiều', GioBatDau: '12:00', GioKetThuc: '18:00', DonGiaLuong: 150000 },
  { MaCa: 'CA003', TenCa: 'Ca Tối',   GioBatDau: '18:00', GioKetThuc: '23:00', DonGiaLuong: 180000 },
]

// ─── Mock phân công ca ────────────────────────────────────────────────────────
// MaCa: CA001 = 06:00–12:00 | CA002 = 12:00–18:00 | CA003 = 18:00–23:00
export const MOCK_PHAN_CONG = [
  // Tuần 26/05 – 01/06/2026
  { MaPC: 'PC2026052601', MaNV: 'NV003', HoTen: 'Lê Văn Cường',   NgayLam: '2026-05-26', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Completed', GhiChu: '' },
  { MaPC: 'PC2026052602', MaNV: 'NV004', HoTen: 'Phạm Thị Dung',  NgayLam: '2026-05-26', MaCa: 'CA002', GioBatDau: '12:00', GioKetThuc: '18:00', TrangThai: 'Completed', GhiChu: '' },
  { MaPC: 'PC2026052603', MaNV: 'NV002', HoTen: 'Trần Thị Bình',  NgayLam: '2026-05-26', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Completed', GhiChu: '' },
  { MaPC: 'PC2026052701', MaNV: 'NV001', HoTen: 'Trần Yến Nhi',  NgayLam: '2026-05-27', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Completed', GhiChu: 'Trực quản lý' },
  { MaPC: 'PC2026052702', MaNV: 'NV003', HoTen: 'Lê Văn Cường',   NgayLam: '2026-05-27', MaCa: 'CA002', GioBatDau: '12:00', GioKetThuc: '18:00', TrangThai: 'Completed', GhiChu: '' },
  { MaPC: 'PC2026052703', MaNV: 'NV005', HoTen: 'Hoàng Minh Đức', NgayLam: '2026-05-27', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Completed', GhiChu: '' },
  { MaPC: 'PC2026052801', MaNV: 'NV004', HoTen: 'Phạm Thị Dung',  NgayLam: '2026-05-28', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026052802', MaNV: 'NV002', HoTen: 'Trần Thị Bình',  NgayLam: '2026-05-28', MaCa: 'CA002', GioBatDau: '12:00', GioKetThuc: '18:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026052901', MaNV: 'NV003', HoTen: 'Lê Văn Cường',   NgayLam: '2026-05-29', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026052902', MaNV: 'NV001', HoTen: 'Trần Yến Nhi',  NgayLam: '2026-05-29', MaCa: 'CA002', GioBatDau: '12:00', GioKetThuc: '18:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026053001', MaNV: 'NV005', HoTen: 'Hoàng Minh Đức', NgayLam: '2026-05-30', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026053002', MaNV: 'NV004', HoTen: 'Phạm Thị Dung',  NgayLam: '2026-05-30', MaCa: 'CA002', GioBatDau: '12:00', GioKetThuc: '18:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026053101', MaNV: 'NV003', HoTen: 'Lê Văn Cường',   NgayLam: '2026-05-31', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026053102', MaNV: 'NV002', HoTen: 'Trần Thị Bình',  NgayLam: '2026-05-31', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026060101', MaNV: 'NV004', HoTen: 'Phạm Thị Dung',  NgayLam: '2026-06-01', MaCa: 'CA001', GioBatDau: '06:00', GioKetThuc: '12:00', TrangThai: 'Scheduled', GhiChu: '' },
  { MaPC: 'PC2026060102', MaNV: 'NV005', HoTen: 'Hoàng Minh Đức', NgayLam: '2026-06-01', MaCa: 'CA002', GioBatDau: '12:00', GioKetThuc: '18:00', TrangThai: 'Scheduled', GhiChu: '' },
]

// ─── Mock phiếu chi vận hành ─────────────────────────────────────────────────
export const MOCK_PHIEU_CHI = [
  {
    MaPC:     'PChi20260527001',
    LoaiChi:  'Vận hành',
    MoTa:     'Tiền điện tháng 5/2026',
    SoTien:   2500000,
    NgayChi:  '2026-05-27',
    TrangThai: 'Pending',
    NguoiLap: 'Trần Thị Bình',
    MaCN:     'CN001',
    TenCN:    'Chi nhánh Quận 1',
    NguoiDuyet: null,
    NgayDuyet:  null,
    LyDoTuChoi: null,
  },
  {
    MaPC:     'PChi20260526001',
    LoaiChi:  'Vận hành',
    MoTa:     'Tiền nước tháng 5/2026',
    SoTien:   350000,
    NgayChi:  '2026-05-26',
    TrangThai: 'Approved',
    NguoiLap: 'Trần Thị Bình',
    NguoiDuyet: 'Trần Yến Nhi',
    NgayDuyet:  '2026-05-26',
    LyDoTuChoi: null,
  },
  {
    MaPC:     'PChi20260525001',
    LoaiChi:  'Nguyên liệu',
    MoTa:     'Mua nguyên liệu phát sinh (đường)',
    SoTien:   90000,
    NgayChi:  '2026-05-25',
    TrangThai: 'Approved',
    NguoiLap: 'Lê Văn Cường',
    MaCN:     'CN001',
    TenCN:    'Chi nhánh Quận 1',
    NguoiDuyet: 'Trần Yến Nhi',
    NgayDuyet:  '2026-05-25',
    LyDoTuChoi: null,
  },
  {
    MaPC:     'PChi20260524001',
    LoaiChi:  'Bảo trì',
    MoTa:     'Sửa máy pha cà phê',
    SoTien:   1200000,
    NgayChi:  '2026-05-24',
    TrangThai: 'Rejected',
    NguoiLap: 'Trần Thị Bình',
    MaCN:     'CN001',
    TenCN:    'Chi nhánh Quận 1',
    NguoiDuyet: 'Trần Yến Nhi',
    NgayDuyet:  '2026-05-24',
    LyDoTuChoi: 'Số tiền vượt hạn mức, cần phê duyệt cấp cao hơn',
  },
  {
    MaPC:     'PChi20260523001',
    LoaiChi:  'Lương',
    MoTa:     'Lương thưởng nhân viên tháng 5/2026',
    SoTien:   8500000,
    NgayChi:  '2026-05-23',
    TrangThai: 'Approved',
    NguoiLap: 'Trần Yến Nhi',
    MaCN:     'CN001',
    TenCN:    'Chi nhánh Quận 1',
    NguoiDuyet: 'Trần Yến Nhi',
    NgayDuyet:  '2026-05-23',
    LyDoTuChoi: null,
  },
]
