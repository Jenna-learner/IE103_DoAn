const MOCK_FLAG_KEY = 'fnb_ui_mock_mode'
const MOCK_DB_KEY = 'fnb_ui_mock_db'

const BRANCHES = [
  { MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', DiaChi: '12 Nguyễn Huệ, Q1', SDT: '02838229901', Email: 'cn001@fnbchain.com', TrangThai: 'Active' },
  { MaCN: 'CN002', TenCN: 'FnB Chain Quận 7', DiaChi: '99 Nguyễn Thị Thập, Q7', SDT: '02837779902', Email: 'cn002@fnbchain.com', TrangThai: 'Active' },
]

const DEPARTMENTS = [
  { MaBP: 'BP001', TenBP: 'Điều hành', MoTa: 'Điều hành hệ thống' },
  { MaBP: 'BP002', TenBP: 'Thu ngân', MoTa: 'POS và thu tiền' },
  { MaBP: 'BP003', TenBP: 'Kho vận', MoTa: 'Kho & nhập hàng' },
  { MaBP: 'BP004', TenBP: 'Pha chế', MoTa: 'Bếp / pha chế' },
  { MaBP: 'BP005', TenBP: 'Kỹ thuật', MoTa: 'Quản trị hệ thống' },
]

const CATEGORIES = [
  { MaLoai: 'L001', TenLoai: 'Cà phê', MoTa: 'Nhóm cà phê' },
  { MaLoai: 'L002', TenLoai: 'Trà sữa', MoTa: 'Nhóm trà sữa' },
  { MaLoai: 'L003', TenLoai: 'Đá xay', MoTa: 'Nhóm đá xay' },
  { MaLoai: 'L004', TenLoai: 'Bánh ngọt', MoTa: 'Nhóm bánh' },
]

const INGREDIENTS = [
  { MaNL: 'NL001', TenNL: 'Cà phê hạt Arabica', DonViTinh: 'gram', TrangThai: 'Active' },
  { MaNL: 'NL002', TenNL: 'Sữa tươi', DonViTinh: 'ml', TrangThai: 'Active' },
  { MaNL: 'NL003', TenNL: 'Siro caramel', DonViTinh: 'ml', TrangThai: 'Active' },
  { MaNL: 'NL004', TenNL: 'Trà nhài', DonViTinh: 'gram', TrangThai: 'Active' },
  { MaNL: 'NL005', TenNL: 'Trân châu đen', DonViTinh: 'gram', TrangThai: 'Active' },
  { MaNL: 'NL006', TenNL: 'Bột matcha', DonViTinh: 'gram', TrangThai: 'Active' },
  { MaNL: 'NL007', TenNL: 'Ly giấy 500ml', DonViTinh: 'cái', TrangThai: 'Active' },
  { MaNL: 'NL008', TenNL: 'Đường nước', DonViTinh: 'ml', TrangThai: 'Active' },
]

const INVENTORY = [
  { MaCN: 'CN001', MaNL: 'NL001', SoLuongTon: 12000, TonToiThieu: 8000, GiaNhapGanNhat: 420 },
  { MaCN: 'CN001', MaNL: 'NL002', SoLuongTon: 18000, TonToiThieu: 12000, GiaNhapGanNhat: 28 },
  { MaCN: 'CN001', MaNL: 'NL003', SoLuongTon: 3200, TonToiThieu: 4000, GiaNhapGanNhat: 55 },
  { MaCN: 'CN001', MaNL: 'NL004', SoLuongTon: 7000, TonToiThieu: 5000, GiaNhapGanNhat: 180 },
  { MaCN: 'CN001', MaNL: 'NL005', SoLuongTon: 2800, TonToiThieu: 2500, GiaNhapGanNhat: 70 },
  { MaCN: 'CN001', MaNL: 'NL006', SoLuongTon: 1500, TonToiThieu: 1800, GiaNhapGanNhat: 320 },
  { MaCN: 'CN001', MaNL: 'NL007', SoLuongTon: 220, TonToiThieu: 300, GiaNhapGanNhat: 1200 },
  { MaCN: 'CN001', MaNL: 'NL008', SoLuongTon: 6000, TonToiThieu: 4500, GiaNhapGanNhat: 18 },
  { MaCN: 'CN002', MaNL: 'NL001', SoLuongTon: 9000, TonToiThieu: 8000, GiaNhapGanNhat: 415 },
  { MaCN: 'CN002', MaNL: 'NL002', SoLuongTon: 13000, TonToiThieu: 12000, GiaNhapGanNhat: 28 },
  { MaCN: 'CN002', MaNL: 'NL003', SoLuongTon: 4500, TonToiThieu: 3500, GiaNhapGanNhat: 56 },
  { MaCN: 'CN002', MaNL: 'NL004', SoLuongTon: 6400, TonToiThieu: 5000, GiaNhapGanNhat: 181 },
  { MaCN: 'CN002', MaNL: 'NL005', SoLuongTon: 2100, TonToiThieu: 2500, GiaNhapGanNhat: 71 },
  { MaCN: 'CN002', MaNL: 'NL006', SoLuongTon: 2500, TonToiThieu: 1800, GiaNhapGanNhat: 318 },
  { MaCN: 'CN002', MaNL: 'NL007', SoLuongTon: 340, TonToiThieu: 300, GiaNhapGanNhat: 1180 },
  { MaCN: 'CN002', MaNL: 'NL008', SoLuongTon: 5100, TonToiThieu: 4500, GiaNhapGanNhat: 18 },
]

const PRODUCTS = [
  { MaSP: 'SP001', TenSP: 'Americano', MaLoai: 'L001', GiaBan: 45000, TrangThai: 'Đang bán' },
  { MaSP: 'SP002', TenSP: 'Latte Caramel', MaLoai: 'L001', GiaBan: 55000, TrangThai: 'Đang bán' },
  { MaSP: 'SP003', TenSP: 'Trà sữa trân châu', MaLoai: 'L002', GiaBan: 49000, TrangThai: 'Đang bán' },
  { MaSP: 'SP004', TenSP: 'Matcha đá xay', MaLoai: 'L003', GiaBan: 62000, TrangThai: 'Đang bán' },
  { MaSP: 'SP005', TenSP: 'Croissant bơ', MaLoai: 'L004', GiaBan: 32000, TrangThai: 'Đang bán' },
  { MaSP: 'SP006', TenSP: 'Cold Brew', MaLoai: 'L001', GiaBan: 52000, TrangThai: 'Ngừng bán' },
]

const RECIPES = {
  SP001: [{ MaNL: 'NL001', TenNL: 'Cà phê hạt Arabica', DonViTinh: 'gram', SoLuongLuong: 18 }, { MaNL: 'NL007', TenNL: 'Ly giấy 500ml', DonViTinh: 'cái', SoLuongLuong: 1 }],
  SP002: [{ MaNL: 'NL001', TenNL: 'Cà phê hạt Arabica', DonViTinh: 'gram', SoLuongLuong: 16 }, { MaNL: 'NL002', TenNL: 'Sữa tươi', DonViTinh: 'ml', SoLuongLuong: 180 }, { MaNL: 'NL003', TenNL: 'Siro caramel', DonViTinh: 'ml', SoLuongLuong: 25 }, { MaNL: 'NL007', TenNL: 'Ly giấy 500ml', DonViTinh: 'cái', SoLuongLuong: 1 }],
  SP003: [{ MaNL: 'NL004', TenNL: 'Trà nhài', DonViTinh: 'gram', SoLuongLuong: 14 }, { MaNL: 'NL002', TenNL: 'Sữa tươi', DonViTinh: 'ml', SoLuongLuong: 120 }, { MaNL: 'NL005', TenNL: 'Trân châu đen', DonViTinh: 'gram', SoLuongLuong: 80 }, { MaNL: 'NL008', TenNL: 'Đường nước', DonViTinh: 'ml', SoLuongLuong: 30 }, { MaNL: 'NL007', TenNL: 'Ly giấy 500ml', DonViTinh: 'cái', SoLuongLuong: 1 }],
  SP004: [{ MaNL: 'NL006', TenNL: 'Bột matcha', DonViTinh: 'gram', SoLuongLuong: 18 }, { MaNL: 'NL002', TenNL: 'Sữa tươi', DonViTinh: 'ml', SoLuongLuong: 140 }, { MaNL: 'NL008', TenNL: 'Đường nước', DonViTinh: 'ml', SoLuongLuong: 25 }, { MaNL: 'NL007', TenNL: 'Ly giấy 500ml', DonViTinh: 'cái', SoLuongLuong: 1 }],
  SP005: [{ MaNL: 'NL007', TenNL: 'Ly giấy 500ml', DonViTinh: 'cái', SoLuongLuong: 1 }],
  SP006: [{ MaNL: 'NL001', TenNL: 'Cà phê hạt Arabica', DonViTinh: 'gram', SoLuongLuong: 20 }, { MaNL: 'NL007', TenNL: 'Ly giấy 500ml', DonViTinh: 'cái', SoLuongLuong: 1 }],
}

const CUSTOMERS = [
  { MaKH: 'KHDEMO001', TenKH: 'Nguyễn Minh Anh', SDT: '0908111222', Email: 'anh.nguyen@example.com', DiemTichLuy: 1200, HangThanhVien: 'Silver', TrangThai: 'Active' },
  { MaKH: 'KHDEMO002', TenKH: 'Trần Hà My', SDT: '0908333444', Email: 'ha.my@example.com', DiemTichLuy: 6400, HangThanhVien: 'Gold', TrangThai: 'Active' },
  { MaKH: 'KHDEMO003', TenKH: 'Lê Quốc Bảo', SDT: '0908555666', Email: 'quoc.bao@example.com', DiemTichLuy: 11000, HangThanhVien: 'Gold', TrangThai: 'Active' },
]

const SUPPLIERS = [
  { MaNCC: 'NCC001', TenNCC: 'Công ty Sữa FreshMilk', SDT: '02838889901', Email: 'sales@freshmilk.vn', DiaChi: 'KCN Tân Bình, TP.HCM', TrangThai: 'Active' },
  { MaNCC: 'NCC002', TenNCC: 'Công ty Hạt Rang Việt', SDT: '02838889902', Email: 'coffee@rangviet.vn', DiaChi: 'Bình Thạnh, TP.HCM', TrangThai: 'Active' },
  { MaNCC: 'NCC003', TenNCC: 'Công ty Bao bì GreenCup', SDT: '02838889903', Email: 'hello@greencup.vn', DiaChi: 'Thủ Đức, TP.HCM', TrangThai: 'Active' },
]

const EMPLOYEES = [
  { MaNV: 'NV001', HoTen: 'Admin Hệ Thống', MaBP: 'BP005', TenBP: 'Kỹ thuật', SDT: '0909000001', Email: 'admin@fnbchain.com', LuongCoBan: 35000000, TrangThai: 'Active', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', TenDangNhap: 'admin@fnbchain.com', VaiTro: 'admin', TaiKhoanActive: true },
  { MaNV: 'NV002', HoTen: 'Nguyễn Điều Hành', MaBP: 'BP001', TenBP: 'Điều hành', SDT: '0909000002', Email: 'ops@fnbchain.com', LuongCoBan: 30000000, TrangThai: 'Active', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', TenDangNhap: 'ops@fnbchain.com', VaiTro: 'giam_doc_van_hanh', TaiKhoanActive: true },
  { MaNV: 'NV101', HoTen: 'Trần Quản Lý Q1', MaBP: 'BP001', TenBP: 'Điều hành', SDT: '0909000101', Email: 'ql.cn1@fnbchain.com', LuongCoBan: 18000000, TrangThai: 'Active', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', TenDangNhap: 'ql.cn1@fnbchain.com', VaiTro: 'quan_ly_chinhanh', TaiKhoanActive: true },
  { MaNV: 'NV102', HoTen: 'Lê Thu Ngân Q1', MaBP: 'BP002', TenBP: 'Thu ngân', SDT: '0909000102', Email: 'cash.cn1@fnbchain.com', LuongCoBan: 9000000, TrangThai: 'Active', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', TenDangNhap: 'cash.cn1@fnbchain.com', VaiTro: 'thu_ngan', TaiKhoanActive: true },
  { MaNV: 'NV103', HoTen: 'Phạm Kho Q1', MaBP: 'BP003', TenBP: 'Kho vận', SDT: '0909000103', Email: 'kho.cn1@fnbchain.com', LuongCoBan: 9500000, TrangThai: 'Active', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', TenDangNhap: 'kho.cn1@fnbchain.com', VaiTro: 'kho', TaiKhoanActive: true },
  { MaNV: 'NV201', HoTen: 'Đỗ Quản Lý Q7', MaBP: 'BP001', TenBP: 'Điều hành', SDT: '0909000201', Email: 'ql.cn2@fnbchain.com', LuongCoBan: 17500000, TrangThai: 'Active', MaCN: 'CN002', TenCN: 'FnB Chain Quận 7', TenDangNhap: 'ql.cn2@fnbchain.com', VaiTro: 'quan_ly_chinhanh', TaiKhoanActive: true },
  { MaNV: 'NV202', HoTen: 'Bùi Thu Ngân Q7', MaBP: 'BP002', TenBP: 'Thu ngân', SDT: '0909000202', Email: 'cash.cn2@fnbchain.com', LuongCoBan: 8800000, TrangThai: 'Active', MaCN: 'CN002', TenCN: 'FnB Chain Quận 7', TenDangNhap: 'cash.cn2@fnbchain.com', VaiTro: 'thu_ngan', TaiKhoanActive: true },
  { MaNV: 'NV203', HoTen: 'Hoàng Kho Q7', MaBP: 'BP003', TenBP: 'Kho vận', SDT: '0909000203', Email: 'kho.cn2@fnbchain.com', LuongCoBan: 9300000, TrangThai: 'Active', MaCN: 'CN002', TenCN: 'FnB Chain Quận 7', TenDangNhap: 'kho.cn2@fnbchain.com', VaiTro: 'kho', TaiKhoanActive: true },
]

const ACCOUNTS = [
  { maTK: 1, maNV: 'NV001', tenDangNhap: 'admin@fnbchain.com', matKhau: 'admin@123', vaiTro: 'admin', maCN: 'CN001', tenCN: 'FnB Chain Quận 1', hoTen: 'Admin Hệ Thống' },
  { maTK: 2, maNV: 'NV002', tenDangNhap: 'ops@fnbchain.com', matKhau: 'ops123', vaiTro: 'giam_doc_van_hanh', maCN: 'CN001', tenCN: 'FnB Chain Quận 1', hoTen: 'Nguyễn Điều Hành' },
  { maTK: 3, maNV: 'NV101', tenDangNhap: 'ql.cn1@fnbchain.com', matKhau: 'ql123', vaiTro: 'quan_ly_chinhanh', maCN: 'CN001', tenCN: 'FnB Chain Quận 1', hoTen: 'Trần Quản Lý Q1' },
  { maTK: 4, maNV: 'NV102', tenDangNhap: 'cash.cn1@fnbchain.com', matKhau: 'cash123', vaiTro: 'thu_ngan', maCN: 'CN001', tenCN: 'FnB Chain Quận 1', hoTen: 'Lê Thu Ngân Q1' },
  { maTK: 5, maNV: 'NV103', tenDangNhap: 'kho.cn1@fnbchain.com', matKhau: 'kho123', vaiTro: 'kho', maCN: 'CN001', tenCN: 'FnB Chain Quận 1', hoTen: 'Phạm Kho Q1' },
  { maTK: 6, maNV: 'NV201', tenDangNhap: 'ql.cn2@fnbchain.com', matKhau: 'ql223', vaiTro: 'quan_ly_chinhanh', maCN: 'CN002', tenCN: 'FnB Chain Quận 7', hoTen: 'Đỗ Quản Lý Q7' },
  { maTK: 7, maNV: 'NV202', tenDangNhap: 'cash.cn2@fnbchain.com', matKhau: 'cash223', vaiTro: 'thu_ngan', maCN: 'CN002', tenCN: 'FnB Chain Quận 7', hoTen: 'Bùi Thu Ngân Q7' },
  { maTK: 8, maNV: 'NV203', tenDangNhap: 'kho.cn2@fnbchain.com', matKhau: 'kho223', vaiTro: 'kho', maCN: 'CN002', tenCN: 'FnB Chain Quận 7', hoTen: 'Hoàng Kho Q7' },
]

const SHIFTS = [
  { MaCa: 'CA001', TenCa: 'Ca sáng', GioBatDau: '06:00', GioKetThuc: '12:00' },
  { MaCa: 'CA002', TenCa: 'Ca chiều', GioBatDau: '12:00', GioKetThuc: '18:00' },
  { MaCa: 'CA003', TenCa: 'Ca tối', GioBatDau: '18:00', GioKetThuc: '22:00' },
]

const ASSIGNMENTS = [
  { MaPC: 'PC001', MaNV: 'NV101', MaCN: 'CN001', MaCa: 'CA001', NgayLam: '2026-06-04', TrangThai: 'Done', HoTen: 'Trần Quản Lý Q1', TenCN: 'FnB Chain Quận 1', TenCa: 'Ca sáng' },
  { MaPC: 'PC002', MaNV: 'NV102', MaCN: 'CN001', MaCa: 'CA002', NgayLam: '2026-06-04', TrangThai: 'Assigned', HoTen: 'Lê Thu Ngân Q1', TenCN: 'FnB Chain Quận 1', TenCa: 'Ca chiều' },
  { MaPC: 'PC003', MaNV: 'NV103', MaCN: 'CN001', MaCa: 'CA001', NgayLam: '2026-06-05', TrangThai: 'Assigned', HoTen: 'Phạm Kho Q1', TenCN: 'FnB Chain Quận 1', TenCa: 'Ca sáng' },
]

const PURCHASE_ORDERS = [
  { MaPN: 'PNDEMO001', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNCC: 'NCC001', TenNCC: 'Công ty Sữa FreshMilk', MaNVLap: 'NV103', TenNhanVienLap: 'Phạm Kho Q1', NgayNhap: '2026-06-02T08:00:00', TongTien: 352000, TrangThai: 'Draft', NgayTao: '2026-06-02T08:00:00', chiTiet: [{ MaNL: 'NL002', TenNL: 'Sữa tươi', DonViTinh: 'ml', SoLuong: 4000, DonGia: 28, ThanhTien: 112000 }, { MaNL: 'NL007', TenNL: 'Ly giấy 500ml', DonViTinh: 'cái', SoLuong: 200, DonGia: 1200, ThanhTien: 240000 }] },
  { MaPN: 'PNDEMO002', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNCC: 'NCC002', TenNCC: 'Công ty Hạt Rang Việt', MaNVLap: 'NV103', TenNhanVienLap: 'Phạm Kho Q1', NgayNhap: '2026-06-03T08:00:00', TongTien: 1370000, TrangThai: 'Approved', NgayTao: '2026-06-03T08:00:00', chiTiet: [{ MaNL: 'NL001', TenNL: 'Cà phê hạt Arabica', DonViTinh: 'gram', SoLuong: 3000, DonGia: 420, ThanhTien: 1260000 }, { MaNL: 'NL003', TenNL: 'Siro caramel', DonViTinh: 'ml', SoLuong: 2000, DonGia: 55, ThanhTien: 110000 }] },
]

const EXPENSES = [
  { MaPC: 'PCDEMO001', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNV: 'NV101', TenNhanVien: 'Trần Quản Lý Q1', NgayChi: '2026-06-03', LoaiChi: 'Marketing & Advertising', SoTien: 2500000, MoTa: 'Chạy quảng cáo khai trương menu mới', TrangThai: 'Approved' },
  { MaPC: 'PCDEMO002', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNV: 'NV101', TenNhanVien: 'Trần Quản Lý Q1', NgayChi: '2026-06-04', LoaiChi: 'Other expenses', SoTien: 980000, MoTa: 'Mua vật tư vệ sinh và giấy in bill', TrangThai: 'Pending' },
]

const ORDERS = [
  { MaHD: 'HDDEMO001', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNV: 'NV102', TenNhanVien: 'Lê Thu Ngân Q1', MaKH: 'KHDEMO002', TenKH: 'Trần Hà My', SDTKH: '0908333444', NgayLap: '2026-06-03T09:30:00', LoaiDonHang: 'DineIn', TongTienHang: 142000, GiamGia: 0, TongThanhToan: 142000, TrangThai: 'Completed', chiTiet: [{ MaSP: 'SP002', TenSP: 'Latte Caramel', SoLuong: 2, DonGia: 55000, ThanhTien: 110000 }, { MaSP: 'SP005', TenSP: 'Croissant bơ', SoLuong: 1, DonGia: 32000, ThanhTien: 32000 }], thanhToan: [{ MaTT: 'TTDEMO001', MaHD: 'HDDEMO001', PhuongThuc: 'Card', SoTien: 142000, TrangThai: 'Success', LoaiGiaoDich: 'Payment', NgayTT: '2026-06-03T09:35:00' }] },
  { MaHD: 'HDDEMO002', MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNV: 'NV102', TenNhanVien: 'Lê Thu Ngân Q1', MaKH: 'KHDEMO001', TenKH: 'Nguyễn Minh Anh', SDTKH: '0908111222', NgayLap: '2026-06-04T10:10:00', LoaiDonHang: 'TakeAway', TongTienHang: 143000, GiamGia: 4000, TongThanhToan: 139000, TrangThai: 'Completed', chiTiet: [{ MaSP: 'SP003', TenSP: 'Trà sữa trân châu', SoLuong: 2, DonGia: 49000, ThanhTien: 98000 }, { MaSP: 'SP001', TenSP: 'Americano', SoLuong: 1, DonGia: 45000, ThanhTien: 45000 }], thanhToan: [{ MaTT: 'TTDEMO002', MaHD: 'HDDEMO002', PhuongThuc: 'E-Wallet', SoTien: 139000, TrangThai: 'Success', LoaiGiaoDich: 'Payment', NgayTT: '2026-06-04T10:15:00' }] },
  { MaHD: 'HDDEMO003', MaCN: 'CN002', TenCN: 'FnB Chain Quận 7', MaNV: 'NV202', TenNhanVien: 'Bùi Thu Ngân Q7', MaKH: null, TenKH: 'Khách vãng lai', SDTKH: null, NgayLap: '2026-06-04T11:00:00', LoaiDonHang: 'DineIn', TongTienHang: 62000, GiamGia: 0, TongThanhToan: 62000, TrangThai: 'Cancelled', chiTiet: [{ MaSP: 'SP004', TenSP: 'Matcha đá xay', SoLuong: 1, DonGia: 62000, ThanhTien: 62000 }], thanhToan: [] },
]

const INVENTORY_LOGS = [
  { MaLog: 1, MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNL: 'NL001', TenNL: 'Cà phê hạt Arabica', LoaiBienDong: 'Import', SoLuong: 3000, SoLuongTruoc: 9000, SoLuongSau: 12000, NguonPhatSinh: 'PHIEUNHAP', MaChungTu: 'PNDEMO002', NgayThayDoi: '2026-06-03T08:15:00', NgayGhi: '2026-06-03T08:15:00' },
  { MaLog: 2, MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNL: 'NL003', TenNL: 'Siro caramel', LoaiBienDong: 'Import', SoLuong: 2000, SoLuongTruoc: 1200, SoLuongSau: 3200, NguonPhatSinh: 'PHIEUNHAP', MaChungTu: 'PNDEMO002', NgayThayDoi: '2026-06-03T08:15:00', NgayGhi: '2026-06-03T08:15:00' },
  { MaLog: 3, MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNL: 'NL001', TenNL: 'Cà phê hạt Arabica', LoaiBienDong: 'Export', SoLuong: 32, SoLuongTruoc: 12032, SoLuongSau: 12000, NguonPhatSinh: 'HOADON', MaChungTu: 'HDDEMO001', NgayThayDoi: '2026-06-03T09:35:00', NgayGhi: '2026-06-03T09:35:00' },
  { MaLog: 4, MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNL: 'NL007', TenNL: 'Ly giấy 500ml', LoaiBienDong: 'Export', SoLuong: 3, SoLuongTruoc: 223, SoLuongSau: 220, NguonPhatSinh: 'HOADON', MaChungTu: 'HDDEMO001', NgayThayDoi: '2026-06-03T09:35:00', NgayGhi: '2026-06-03T09:35:00' },
  { MaLog: 5, MaCN: 'CN001', TenCN: 'FnB Chain Quận 1', MaNL: 'NL003', TenNL: 'Siro caramel', LoaiBienDong: 'Audit_Loss', SoLuong: 200, SoLuongTruoc: 3400, SoLuongSau: 3200, NguonPhatSinh: 'KIEMKHO', MaChungTu: 'KKDEMO001', NgayThayDoi: '2026-06-04T07:00:00', NgayGhi: '2026-06-04T07:00:00' },
  { MaLog: 6, MaCN: 'CN002', TenCN: 'FnB Chain Quận 7', MaNL: 'NL006', TenNL: 'Bột matcha', LoaiBienDong: 'Import', SoLuong: 700, SoLuongTruoc: 1800, SoLuongSau: 2500, NguonPhatSinh: 'PHIEUNHAP', MaChungTu: 'PNDEMO201', NgayThayDoi: '2026-06-04T06:45:00', NgayGhi: '2026-06-04T06:45:00' },
  { MaLog: 7, MaCN: 'CN002', TenCN: 'FnB Chain Quận 7', MaNL: 'NL008', TenNL: 'Đường nước', LoaiBienDong: 'Audit_Gain', SoLuong: 300, SoLuongTruoc: 4800, SoLuongSau: 5100, NguonPhatSinh: 'KIEMKHO', MaChungTu: 'KKDEMO201', NgayThayDoi: '2026-06-04T07:10:00', NgayGhi: '2026-06-04T07:10:00' },
]

function clone(v) { return JSON.parse(JSON.stringify(v)) }

function initialState() {
  return {
    branches: clone(BRANCHES), departments: clone(DEPARTMENTS), categories: clone(CATEGORIES), ingredients: clone(INGREDIENTS), inventory: clone(INVENTORY), products: clone(PRODUCTS), recipes: clone(RECIPES), customers: clone(CUSTOMERS), suppliers: clone(SUPPLIERS), employees: clone(EMPLOYEES), accounts: clone(ACCOUNTS), shifts: clone(SHIFTS), assignments: clone(ASSIGNMENTS), purchaseOrders: clone(PURCHASE_ORDERS), expenses: clone(EXPENSES), orders: clone(ORDERS), inventoryLogs: clone(INVENTORY_LOGS), nextIds: { order: 4, payment: 3, purchase: 3, expense: 3, assignment: 4, customer: 4, inventoryLog: 8 },
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY)
    return raw ? JSON.parse(raw) : initialState()
  } catch {
    return initialState()
  }
}

function saveState(state) { localStorage.setItem(MOCK_DB_KEY, JSON.stringify(state)) }

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('fnb_auth'))?.state?.user || null
  } catch {
    return null
  }
}

export function isMockModeEnabled() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('mock') === '1') {
    localStorage.setItem(MOCK_FLAG_KEY, '1')
    return true
  }
  return localStorage.getItem(MOCK_FLAG_KEY) === '1'
}

export function enableUiMock() {
  localStorage.setItem(MOCK_FLAG_KEY, '1')
  if (!localStorage.getItem(MOCK_DB_KEY)) saveState(initialState())
}

export function disableUiMock() { localStorage.removeItem(MOCK_FLAG_KEY) }
export function resetUiMockData() { saveState(initialState()) }

if (typeof window !== 'undefined') {
  window.enableUiMock = () => { enableUiMock(); window.location.reload() }
  window.disableUiMock = () => { disableUiMock(); window.location.reload() }
  window.resetUiMockData = () => { resetUiMockData(); window.location.reload() }
}

function ok(config, data, status = 200) {
  return Promise.resolve({ data, status, statusText: 'OK', headers: {}, config })
}

function fail(config, message, status = 400) {
  const err = new Error(message)
  err.response = { data: { success: false, message }, status, config }
  return Promise.reject(err)
}

function success(data, message = 'Thành công') { return { success: true, message, data } }
function paginated(data, total, page = 1, limit = 20) { return { success: true, data, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.max(1, Math.ceil(total / limit)) } } }

function withBranch(list, user, getter = (x) => x.MaCN) {
  if (!user) return list
  if (['role_admin', 'role_ops_director'].includes(user.vaiTro)) return list
  return list.filter((item) => getter(item) === user.maCN)
}

function getBranchName(state, maCN) { return state.branches.find((b) => b.MaCN === maCN)?.TenCN || maCN }
function getDeptName(state, maBP) { return state.departments.find((b) => b.MaBP === maBP)?.TenBP || maBP }
function getEmpName(state, maNV) { return state.employees.find((e) => e.MaNV === maNV)?.HoTen || maNV }
function getCustomer(state, maKH) { return state.customers.find((c) => c.MaKH === maKH) || null }
function getProduct(state, maSP) { return state.products.find((p) => p.MaSP === maSP) || null }
function getIngredient(state, maNL) { return state.ingredients.find((i) => i.MaNL === maNL) || null }

function pushInventoryLog(state, payload) {
  state.inventoryLogs.unshift({
    MaLog: state.nextIds.inventoryLog++,
    ...payload,
  })
}

function applyInventoryChange(state, { MaCN, MaNL, delta, LoaiBienDong, NguonPhatSinh, MaChungTu, NgayThayDoi, MaNVThucHien }) {
  const inv = state.inventory.find((x) => x.MaCN === MaCN && x.MaNL === MaNL)
  const ingredient = getIngredient(state, MaNL)
  if (!inv || !ingredient) return null
  const before = Number(inv.SoLuongTon || 0)
  const after = Math.max(0, before + Number(delta || 0))
  inv.SoLuongTon = after
  pushInventoryLog(state, {
    MaCN,
    TenCN: getBranchName(state, MaCN),
    MaNL,
    TenNL: ingredient.TenNL,
    LoaiBienDong,
    SoLuong: Math.abs(Number(delta || 0)),
    SoLuongTruoc: before,
    SoLuongSau: after,
    NguonPhatSinh,
    MaChungTu: MaChungTu || null,
    MaNVThucHien: MaNVThucHien || null,
    NgayThayDoi: NgayThayDoi || new Date().toISOString(),
    NgayGhi: NgayThayDoi || new Date().toISOString(),
  })
  return { before, after }
}

function buildDashboard(state, user, params = {}) {
  const maCN = params.maCN || user?.maCN
  const today = params.ngay || new Date().toISOString().slice(0, 10)
  const orders = withBranch(state.orders, { ...user, maCN }, (o) => o.MaCN).filter((o) => (o.NgayLap || '').startsWith(today))
  const completed = orders.filter((o) => o.TrangThai === 'Completed')
  const lowStock = withBranch(state.inventory, { ...user, maCN }, (i) => i.MaCN).filter((i) => i.SoLuongTon < i.TonToiThieu)
  return {
    Ngay: today,
    SoHoaDon: completed.length,
    TongDoanhThuTho: completed.reduce((s, i) => s + i.TongTienHang, 0),
    TongGiamGia: completed.reduce((s, i) => s + i.GiamGia, 0),
    DoanhThuThuan: completed.reduce((s, i) => s + i.TongThanhToan, 0),
    SoCanhBaoTonKho: lowStock.length,
  }
}

function buildRevenueByDay(state, user, params = {}) {
  const maCN = params.maCN || user?.maCN
  const month = params.thang || new Date().toISOString().slice(0, 7)
  return withBranch(state.orders, { ...user, maCN }, (o) => o.MaCN)
    .filter((o) => o.TrangThai === 'Completed' && (o.NgayLap || '').startsWith(month))
    .reduce((acc, o) => {
      const key = o.NgayLap.slice(0, 10)
      acc[key] ||= { Ngay: key, TongDoanhThuTho: 0, TongGiamGia: 0, DoanhThuThuan: 0 }
      acc[key].TongDoanhThuTho += o.TongTienHang
      acc[key].TongGiamGia += o.GiamGia
      acc[key].DoanhThuThuan += o.TongThanhToan
      return acc
    }, {})
}

function parseBody(config) {
  if (!config.data) return {}
  if (typeof config.data === 'string') {
    try { return JSON.parse(config.data) } catch { return {} }
  }
  return config.data
}

export function mockAdapter(config) {
  const state = loadState()
  const method = (config.method || 'get').toLowerCase()
  const url = (config.url || '').replace(/^\/api\/v1/, '')
  const params = config.params || {}
  const body = parseBody(config)
  const user = getCurrentUser()

  if (method === 'post' && url === '/auth/login') {
    const acc = state.accounts.find((a) => a.tenDangNhap === body.tenDangNhap && a.matKhau === body.matKhau)
    if (!acc) return fail(config, 'Sai tài khoản hoặc mật khẩu.', 401)
    return ok(config, success({ token: 'mock-token', user: { maTK: acc.maTK, maNV: acc.maNV, tenDangNhap: acc.tenDangNhap, vaiTro: acc.vaiTro, maCN: acc.maCN, tenCN: acc.tenCN, hoTen: acc.hoTen } }, 'Đăng nhập thành công'))
  }

  if (method === 'get' && url === '/chi-nhanh') return ok(config, success(state.branches))
  if (method === 'get' && url === '/chi-nhanh/bo-phan') return ok(config, success(state.departments))

  if (method === 'post' && url === '/chi-nhanh') {
    state.branches.push({ ...body, TrangThai: body.TrangThai || 'Active' }); saveState(state); return ok(config, success(body, 'Tạo chi nhánh thành công'), 201)
  }
  if (method === 'put' && url.startsWith('/chi-nhanh/')) {
    const id = decodeURIComponent(url.split('/').pop())
    const idx = state.branches.findIndex((b) => b.MaCN === id)
    if (idx >= 0) state.branches[idx] = { ...state.branches[idx], ...body }
    saveState(state)
    return ok(config, success(state.branches[idx], 'Cập nhật chi nhánh thành công'))
  }

  if (method === 'get' && url === '/loai-san-pham') return ok(config, success(state.categories))

  if (method === 'get' && url === '/san-pham') {
    let list = state.products.map((p) => ({ ...p, TenLoai: state.categories.find((c) => c.MaLoai === p.MaLoai)?.TenLoai || '' }))
    if (params.trangThai && params.trangThai !== '') list = list.filter((p) => p.TrangThai === params.trangThai)
    return ok(config, success(list))
  }
  if (method === 'get' && url.startsWith('/san-pham/')) {
    const maSP = decodeURIComponent(url.split('/')[2])
    const item = state.products.find((p) => p.MaSP === maSP)
    if (!item) return fail(config, 'Không tìm thấy sản phẩm', 404)
    return ok(config, success({ ...item, TenLoai: state.categories.find((c) => c.MaLoai === item.MaLoai)?.TenLoai || '', congthuc: state.recipes[maSP] || [] }))
  }
  if (method === 'post' && url === '/san-pham') {
    state.products.push({ ...body, GiaBan: Number(body.GiaBan || 0) })
    state.recipes[body.MaSP] = body.congthuc || []
    saveState(state)
    return ok(config, success(body, 'Tạo sản phẩm thành công'), 201)
  }
  if (method === 'put' && url.startsWith('/san-pham/')) {
    const maSP = decodeURIComponent(url.split('/')[2])
    const idx = state.products.findIndex((p) => p.MaSP === maSP)
    if (idx >= 0) state.products[idx] = { ...state.products[idx], ...body, GiaBan: Number(body.GiaBan || state.products[idx].GiaBan || 0) }
    if (body.congthuc) state.recipes[maSP] = body.congthuc
    saveState(state)
    return ok(config, success(state.products[idx], 'Cập nhật sản phẩm thành công'))
  }
  if (method === 'patch' && /\/san-pham\/[^/]+\/trang-thai$/.test(url)) {
    const maSP = decodeURIComponent(url.split('/')[2])
    const item = state.products.find((p) => p.MaSP === maSP)
    if (item) item.TrangThai = body.TrangThai
    saveState(state)
    return ok(config, success(item, 'Cập nhật trạng thái thành công'))
  }

  if (method === 'get' && url === '/khach-hang') return ok(config, paginated(state.customers, state.customers.length, params.page || 1, params.limit || 500))
  if (method === 'get' && url === '/khach-hang/tra-cuu') {
    const found = state.customers.find((c) => c.SDT === params.sdt)
    return ok(config, success(found || null))
  }
  if (method === 'post' && url === '/khach-hang') {
    const next = `KHDEMO${String(state.nextIds.customer++).padStart(3, '0')}`
    const item = { MaKH: next, TenKH: body.TenKH, SDT: body.SDT, Email: body.Email || null, DiemTichLuy: 0, HangThanhVien: 'Bronze', TrangThai: 'Active' }
    state.customers.push(item); saveState(state)
    return ok(config, success(item, 'Tạo khách hàng thành công'), 201)
  }

  if (method === 'get' && url === '/hoa-don') {
    let list = withBranch(state.orders, user, (o) => o.MaCN)
    if (params.trangThai) list = list.filter((o) => o.TrangThai === params.trangThai)
    if (params.ngay) list = list.filter((o) => (o.NgayLap || '').startsWith(params.ngay))
    list = [...list].sort((a, b) => (b.NgayLap || '').localeCompare(a.NgayLap || ''))
    return ok(config, paginated(list.map(({ chiTiet, thanhToan, ...rest }) => rest), list.length, params.page || 1, params.limit || 30))
  }
  if (method === 'get' && /^\/hoa-don\/[^/]+$/.test(url)) {
    const maHD = decodeURIComponent(url.split('/')[2])
    const item = state.orders.find((o) => o.MaHD === maHD)
    if (!item) return fail(config, 'Hóa đơn không tồn tại.', 404)
    return ok(config, success({ ...item, thanhToan: item.thanhToan?.[0] || null }))
  }
  if (method === 'post' && url === '/hoa-don') {
    const index = state.nextIds.order++
    const maHD = `HDMOCK${String(index).padStart(4, '0')}`
    const items = (body.items || []).map((it) => {
      const sp = getProduct(state, it.MaSP)
      return { MaSP: it.MaSP, TenSP: sp?.TenSP || it.MaSP, SoLuong: Number(it.SoLuong || 0), DonGia: Number(sp?.GiaBan || 0), ThanhTien: Number(sp?.GiaBan || 0) * Number(it.SoLuong || 0) }
    })
    const tongTienHang = items.reduce((s, i) => s + i.ThanhTien, 0)
    const kh = getCustomer(state, body.MaKH)
    const discountMap = { Bronze: 0, Silver: 0.03, Gold: 0.05, Platinum: 0.1 }
    const giamGia = kh ? Math.round(tongTienHang * (discountMap[kh.HangThanhVien] || 0)) : 0
    const tongThanhToan = tongTienHang - giamGia
    const payment = { MaTT: `TTMOCK${String(state.nextIds.payment++).padStart(4, '0')}`, MaHD: maHD, PhuongThuc: body.phuongThuc, SoTien: tongThanhToan, TrangThai: 'Success', LoaiGiaoDich: 'Payment', NgayTT: new Date().toISOString() }
    const order = { MaHD: maHD, MaCN: body.MaCN || user?.maCN || 'CN001', TenCN: getBranchName(state, body.MaCN || user?.maCN || 'CN001'), MaNV: user?.maNV || 'NV102', TenNhanVien: user?.hoTen || 'Mock User', MaKH: kh?.MaKH || null, TenKH: kh?.TenKH || 'Khách vãng lai', SDTKH: kh?.SDT || null, NgayLap: new Date().toISOString(), LoaiDonHang: 'DineIn', TongTienHang: tongTienHang, GiamGia: giamGia, TongThanhToan: tongThanhToan, TrangThai: 'Completed', chiTiet: items, thanhToan: [payment] }
    state.orders.unshift(order)
    items.forEach((it) => {
      ;(state.recipes[it.MaSP] || []).forEach((rc) => {
        const inv = state.inventory.find((x) => x.MaCN === order.MaCN && x.MaNL === rc.MaNL)
        const qty = Number(rc.SoLuongLuong || 0) * Number(it.SoLuong || 0)
        if (inv) {
          const before = inv.SoLuongTon
          inv.SoLuongTon = Math.max(0, before - qty)
          pushInventoryLog(state, { MaCN: order.MaCN, TenCN: order.TenCN, MaNL: rc.MaNL, TenNL: rc.TenNL, LoaiBienDong: 'Export', SoLuong: qty, SoLuongTruoc: before, SoLuongSau: inv.SoLuongTon, NguonPhatSinh: 'HOADON', MaChungTu: maHD, NgayThayDoi: order.NgayLap, NgayGhi: order.NgayLap })
        }
      })
    })
    saveState(state)
    return ok(config, success({ MaHD: maHD, MaTT: payment.MaTT, TongTienHang: tongTienHang, GiamGia: giamGia, TongThanhToan: tongThanhToan }, 'Tạo hóa đơn và thanh toán thành công'), 201)
  }
  if (method === 'patch' && /\/hoa-don\/[^/]+\/huy$/.test(url)) {
    const maHD = decodeURIComponent(url.split('/')[2])
    const item = state.orders.find((o) => o.MaHD === maHD)
    if (!item) return fail(config, 'Hóa đơn không tồn tại.', 404)
    if (item.TrangThai === 'Cancelled') return ok(config, success(null, 'Hóa đơn đã ở trạng thái huỷ.'))
    item.TrangThai = 'Cancelled'
    ;(item.chiTiet || []).forEach((it) => {
      ;(state.recipes[it.MaSP] || []).forEach((rc) => {
        const qty = Number(rc.SoLuongLuong || 0) * Number(it.SoLuong || 0)
        applyInventoryChange(state, {
          MaCN: item.MaCN,
          MaNL: rc.MaNL,
          delta: qty,
          LoaiBienDong: 'Audit_Gain',
          NguonPhatSinh: 'HUYHOADON',
          MaChungTu: maHD,
          NgayThayDoi: new Date().toISOString(),
          MaNVThucHien: user?.maNV,
        })
      })
    })
    saveState(state)
    return ok(config, success(null, 'Đã huỷ hóa đơn thành công.'))
  }

  if (method === 'get' && url === '/kho/ton-kho') {
    const list = withBranch(state.inventory, user, (i) => i.MaCN).map((i) => ({ ...i, TenCN: getBranchName(state, i.MaCN), ...(getIngredient(state, i.MaNL) || {}) }))
    return ok(config, success(list))
  }
  if (method === 'get' && url === '/kho/nhat-ky') return ok(config, success(withBranch(state.inventoryLogs, user, (i) => i.MaCN)))
  if (method === 'get' && url === '/kho/nguyen-lieu') return ok(config, success(state.ingredients))
  if (method === 'post' && url === '/kho/kiem-kho') {
    const maCN = body.MaCN || user?.maCN || 'CN001'
    const now = new Date().toISOString()
    ;(body.items || []).forEach((it, idx) => {
      const inv = state.inventory.find((x) => x.MaCN === maCN && x.MaNL === it.MaNL)
      if (!inv) return
      const actual = Number(it.SoLuongThucTe ?? it.SoLuongTon ?? inv.SoLuongTon)
      const before = Number(inv.SoLuongTon || 0)
      const delta = actual - before
      if (delta === 0) return
      applyInventoryChange(state, {
        MaCN: maCN,
        MaNL: it.MaNL,
        delta,
        LoaiBienDong: delta > 0 ? 'Audit_Gain' : 'Audit_Loss',
        NguonPhatSinh: 'KIEMKHO',
        MaChungTu: body.MaKK || `KKMOCK${String(idx + 1).padStart(3, '0')}`,
        NgayThayDoi: now,
        MaNVThucHien: user?.maNV,
      })
    })
    saveState(state)
    return ok(config, success(null, 'Tạo phiếu kiểm kho thành công', 201), 201)
  }

  if (method === 'get' && url === '/phieu-nhap') return ok(config, success(withBranch(state.purchaseOrders, user, (i) => i.MaCN)))
  if (method === 'post' && url === '/phieu-nhap') {
    const index = state.nextIds.purchase++
    const maPN = `PNMOCK${String(index).padStart(4, '0')}`
    const maCN = body.MaCN || user?.maCN || 'CN001'
    const ngayNhap = body.NgayNhap || new Date().toISOString()
    const details = (body.items || []).map((it) => ({ ...it, TenNL: getIngredient(state, it.MaNL)?.TenNL || it.MaNL, DonViTinh: getIngredient(state, it.MaNL)?.DonViTinh || '', ThanhTien: Number(it.SoLuong || 0) * Number(it.DonGia || 0) }))
    const item = { MaPN: maPN, MaCN: maCN, TenCN: getBranchName(state, maCN), MaNCC: body.MaNCC, TenNCC: state.suppliers.find((s) => s.MaNCC === body.MaNCC)?.TenNCC || body.MaNCC, MaNVLap: user?.maNV || 'NV103', TenNhanVienLap: user?.hoTen || 'Mock User', NgayNhap: ngayNhap, TongTien: details.reduce((s, i) => s + i.ThanhTien, 0), TrangThai: 'Approved', NgayTao: new Date().toISOString(), chiTiet: details }
    state.purchaseOrders.unshift(item)
    details.forEach((detail) => {
      applyInventoryChange(state, {
        MaCN: maCN,
        MaNL: detail.MaNL,
        delta: Number(detail.SoLuong || 0),
        LoaiBienDong: 'Import',
        NguonPhatSinh: 'PHIEUNHAP',
        MaChungTu: maPN,
        NgayThayDoi: ngayNhap,
        MaNVThucHien: user?.maNV,
      })
    })
    saveState(state)
    return ok(config, success({ MaPN: maPN }, 'Tạo phiếu nhập thành công', 201), 201)
  }

  if (method === 'get' && url === '/nha-cung-cap') return ok(config, success(state.suppliers))
  if (method === 'post' && url === '/nha-cung-cap') { state.suppliers.push(body); saveState(state); return ok(config, success(body, 'Tạo nhà cung cấp thành công'), 201) }
  if (method === 'put' && url.startsWith('/nha-cung-cap/')) { const id = decodeURIComponent(url.split('/').pop()); const idx = state.suppliers.findIndex((s) => s.MaNCC === id); if (idx >= 0) state.suppliers[idx] = { ...state.suppliers[idx], ...body }; saveState(state); return ok(config, success(state.suppliers[idx], 'Cập nhật nhà cung cấp thành công')) }

  if (method === 'get' && url === '/nhan-vien') return ok(config, success(withBranch(state.employees, user, (e) => e.MaCN)))
  if (method === 'post' && url === '/nhan-vien') { state.employees.push({ ...body, TenBP: getDeptName(state, body.MaBP), TenCN: getBranchName(state, body.MaCN), LuongCoBan: Number(body.LuongCoBan || 0), TaiKhoanActive: true }); saveState(state); return ok(config, success({ MaNV: body.MaNV }, 'Thêm nhân viên thành công', 201), 201) }
  if (method === 'put' && url.startsWith('/nhan-vien/')) { const id = decodeURIComponent(url.split('/').pop()); const idx = state.employees.findIndex((e) => e.MaNV === id); if (idx >= 0) state.employees[idx] = { ...state.employees[idx], ...body, TenBP: getDeptName(state, body.MaBP || state.employees[idx].MaBP), TenCN: getBranchName(state, body.MaCN || state.employees[idx].MaCN) }; saveState(state); return ok(config, success({ MaNV: id }, 'Cập nhật nhân viên thành công')) }

  if (method === 'get' && url === '/phan-cong/ca-lam') return ok(config, success(state.shifts))
  if (method === 'get' && url === '/phan-cong') return ok(config, success(withBranch(state.assignments, user, (a) => a.MaCN)))
  if (method === 'post' && url === '/phan-cong') { const maPC = `PCMOCK${String(state.nextIds.assignment++).padStart(4, '0')}`; const item = { MaPC: maPC, MaNV: body.MaNV, MaCN: body.MaCN || user?.maCN || 'CN001', MaCa: body.MaCa, NgayLam: body.NgayLam, TrangThai: 'Assigned', HoTen: getEmpName(state, body.MaNV), TenCN: getBranchName(state, body.MaCN || user?.maCN || 'CN001'), TenCa: state.shifts.find((s) => s.MaCa === body.MaCa)?.TenCa || body.MaCa }; state.assignments.push(item); saveState(state); return ok(config, success(item, 'Tạo phân công thành công', 201), 201) }
  if (method === 'delete' && url.startsWith('/phan-cong/')) { const id = decodeURIComponent(url.split('/').pop()); state.assignments = state.assignments.filter((a) => a.MaPC !== id); saveState(state); return ok(config, success(null, 'Đã xoá phân công')) }

  if (method === 'get' && url === '/phieu-chi') return ok(config, success(withBranch(state.expenses, user, (e) => e.MaCN)))
  if (method === 'post' && url === '/phieu-chi') { const maPC = `PCMOCK${String(state.nextIds.expense++).padStart(4, '0')}`; const item = { MaPC: maPC, MaCN: body.MaCN || user?.maCN || 'CN001', TenCN: getBranchName(state, body.MaCN || user?.maCN || 'CN001'), MaNV: user?.maNV || 'NV101', TenNhanVien: user?.hoTen || 'Mock User', NgayChi: body.NgayChi || new Date().toISOString().slice(0,10), LoaiChi: body.LoaiChi, SoTien: Number(body.SoTien || 0), MoTa: body.MoTa || '', TrangThai: 'Pending' }; state.expenses.unshift(item); saveState(state); return ok(config, success(item, 'Tạo phiếu chi thành công', 201), 201) }
  if (method === 'patch' && /\/phieu-chi\/[^/]+\/duyet$/.test(url)) { const id = decodeURIComponent(url.split('/')[2]); const item = state.expenses.find((e) => e.MaPC === id); if (item) item.TrangThai = 'Approved'; saveState(state); return ok(config, success(null, 'Đã duyệt phiếu chi')) }
  if (method === 'patch' && /\/phieu-chi\/[^/]+\/tu-choi$/.test(url)) { const id = decodeURIComponent(url.split('/')[2]); const item = state.expenses.find((e) => e.MaPC === id); if (item) item.TrangThai = 'Rejected'; saveState(state); return ok(config, success(null, 'Đã từ chối phiếu chi')) }

  if (method === 'get' && url === '/bao-cao/dashboard') return ok(config, success(buildDashboard(state, user, params)))
  if (method === 'get' && url === '/bao-cao/doanh-thu-theo-ngay') return ok(config, success(Object.values(buildRevenueByDay(state, user, params)).sort((a, b) => a.Ngay.localeCompare(b.Ngay))))
  if (method === 'get' && url === '/bao-cao/top-san-pham') {
    const map = {}
    withBranch(state.orders.filter((o) => o.TrangThai === 'Completed'), user, (o) => o.MaCN).forEach((o) => o.chiTiet.forEach((ct) => { map[ct.MaSP] ||= { MaSP: ct.MaSP, TenSP: ct.TenSP, TongSoLuongBan: 0, TongDoanhThu: 0 }; map[ct.MaSP].TongSoLuongBan += ct.SoLuong; map[ct.MaSP].TongDoanhThu += ct.ThanhTien }))
    return ok(config, success(Object.values(map).sort((a, b) => b.TongSoLuongBan - a.TongSoLuongBan).slice(0, Number(params.limit || 5))))
  }
  if (method === 'get' && url === '/bao-cao/canh-bao-ton-kho') {
    const list = withBranch(state.inventory, user, (i) => i.MaCN).filter((i) => i.SoLuongTon < i.TonToiThieu).map((i) => ({ ...i, TenCN: getBranchName(state, i.MaCN), ...(getIngredient(state, i.MaNL) || {}) }))
    return ok(config, success(list))
  }
  if (method === 'post' && url === '/bao-cao/lam-moi') return ok(config, success(null, 'Đã làm mới toàn bộ Materialized Views báo cáo.'))

  return fail(config, `Mock API chưa hỗ trợ endpoint: ${method.toUpperCase()} ${url}`, 501)
}
