-- ============================================================
-- SAMPLE DATA DEMO — FnB Chain Management System
-- Mục tiêu:
--   1) Seed dữ liệu nhỏ, deterministic, đúng schema app hiện tại
--   2) Có sẵn account để demo phân quyền theo role
--   3) Có dữ liệu đủ cho Dashboard / Kho / POS / Phiếu nhập / Phiếu chi
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 0. Đồng bộ bảng TAIKHOAN + role mới
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS TAIKHOAN (
    MaTK        SERIAL        PRIMARY KEY,
    MaNV        VARCHAR(20)   UNIQUE REFERENCES NHANVIEN(MaNV) ON DELETE CASCADE,
    TenDangNhap VARCHAR(100)  UNIQUE NOT NULL,
    MatKhau     VARCHAR(255)  NOT NULL,
    VaiTro      VARCHAR(30)   NOT NULL,
    IsActive    BOOLEAN       DEFAULT TRUE,
    CreatedAt   TIMESTAMPTZ   DEFAULT NOW()
);

DO $$
DECLARE
    v_constraint_name TEXT;
BEGIN
    SELECT con.conname
      INTO v_constraint_name
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
     WHERE rel.relname = 'taikhoan'
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%VaiTro%';

    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE TAIKHOAN DROP CONSTRAINT %I', v_constraint_name);
    END IF;
END $$;

ALTER TABLE TAIKHOAN
ADD CONSTRAINT taikhoan_vaitro_check
CHECK (VaiTro IN ('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh', 'thu_ngan', 'kho'));

-- ------------------------------------------------------------
-- 1. Dọn riêng sample transaction để re-run không nhân bản
-- ------------------------------------------------------------
DELETE FROM THANHTOAN WHERE MaHD IN ('HDDEMO001', 'HDDEMO002', 'HDDEMO003');
DELETE FROM CHITIET_HOADON WHERE MaHD IN ('HDDEMO001', 'HDDEMO002', 'HDDEMO003');
DELETE FROM HOADON WHERE MaHD IN ('HDDEMO001', 'HDDEMO002', 'HDDEMO003');

DELETE FROM CHITIET_PHIEUNHAP WHERE MaPN IN ('PNDEMO001', 'PNDEMO002', 'PNDEMO003');
DELETE FROM PHIEUNHAP WHERE MaPN IN ('PNDEMO001', 'PNDEMO002', 'PNDEMO003');

DELETE FROM PHIEUCHI WHERE MaPC IN ('PCDEMO001', 'PCDEMO002', 'PCDEMO003');
DELETE FROM PHANCONG WHERE MaNV IN ('NV101', 'NV102', 'NV103', 'NV201', 'NV202', 'NV203');
DELETE FROM NHATKYKHO WHERE MaChungTu IN ('HDDEMO001', 'HDDEMO002', 'PNDEMO002', 'KKDEMO001', 'KKDEMO002');

-- ------------------------------------------------------------
-- 2. Master data: Chi nhánh / Bộ phận / Nhân viên / Role accounts
-- ------------------------------------------------------------
INSERT INTO CHINHANH (MaCN, TenCN, DiaChi, SDT, Email, TrangThai) VALUES
('CN001', 'FnB Chain Quận 1', '12 Nguyễn Huệ, Quận 1, TP.HCM', '02838229901', 'cn001@fnbchain.com', 'Active'),
('CN002', 'FnB Chain Quận 7', '99 Nguyễn Thị Thập, Quận 7, TP.HCM', '02837779902', 'cn002@fnbchain.com', 'Active'),
('CN003', 'FnB Chain Hà Nội', '88 Trần Duy Hưng, Cầu Giấy, Hà Nội', '02432229903', 'cn003@fnbchain.com', 'Active')
ON CONFLICT (MaCN) DO UPDATE
SET TenCN = EXCLUDED.TenCN,
    DiaChi = EXCLUDED.DiaChi,
    SDT = EXCLUDED.SDT,
    Email = EXCLUDED.Email,
    TrangThai = EXCLUDED.TrangThai;

INSERT INTO BOPHAN (MaBP, TenBP, MoTa) VALUES
('BP001', 'Điều hành', 'Điều hành và giám sát vận hành'),
('BP002', 'Thu ngân', 'Bán hàng tại quầy POS'),
('BP003', 'Kho vận', 'Quản lý tồn kho và nhập hàng'),
('BP004', 'Pha chế', 'Pha chế / bếp'),
('BP005', 'Kỹ thuật', 'Quản trị hệ thống và tài khoản')
ON CONFLICT (MaBP) DO UPDATE
SET TenBP = EXCLUDED.TenBP,
    MoTa = EXCLUDED.MoTa;

-- [FIXED] Loại bỏ ChucVu, đổi LuongCoBan thành DonGiaCa chuẩn 100% Schema file 01
INSERT INTO NHANVIEN (MaNV, HoTen, MaBP, SDT, Email, DonGiaCa, TrangThai) VALUES
('NV001', 'Admin Hệ Thống', 'BP005', '0909000001', 'admin@fnbchain.com', 35000000, 'Active'),
('NV002', 'Nguyễn Điều Hành', 'BP001', '0909000002', 'ops@fnbchain.com', 30000000, 'Active'),
('NV101', 'Trần Quản Lý Q1', 'BP001', '0909000101', 'ql.cn1@fnbchain.com', 18000000, 'Active'),
('NV102', 'Lê Thu Ngân Q1', 'BP002', '0909000102', 'cash.cn1@fnbchain.com', 9000000, 'Active'),
('NV103', 'Phạm Kho Q1', 'BP003', '0909000103', 'kho.cn1@fnbchain.com', 9500000, 'Active'),
('NV201', 'Đỗ Quản Lý Q7', 'BP001', '0909000201', 'ql.cn2@fnbchain.com', 17500000, 'Active'),
('NV202', 'Bùi Thu Ngân Q7', 'BP002', '0909000202', 'cash.cn2@fnbchain.com', 8800000, 'Active'),
('NV203', 'Hoàng Kho Q7', 'BP003', '0909000203', 'kho.cn2@fnbchain.com', 9300000, 'Active')
ON CONFLICT (MaNV) DO UPDATE
SET HoTen = EXCLUDED.HoTen,
    MaBP = EXCLUDED.MaBP,
    SDT = EXCLUDED.SDT,
    Email = EXCLUDED.Email,
    DonGiaCa = EXCLUDED.DonGiaCa,
    TrangThai = EXCLUDED.TrangThai;

DELETE FROM NHANVIEN_CHINHANH WHERE MaNV IN ('NV001', 'NV002', 'NV101', 'NV102', 'NV103', 'NV201', 'NV202', 'NV203');
-- [FIXED] Bổ sung thêm cột VaiTroTaiCN để điều hướng chức vụ theo chi nhánh
INSERT INTO NHANVIEN_CHINHANH (MaNV, MaCN, VaiTroTaiCN) VALUES
('NV001', 'CN001', 'Admin'),
('NV002', 'CN001', 'HQ_Manager'),
('NV101', 'CN001', 'Manager'),
('NV102', 'CN001', 'Cashier'),
('NV103', 'CN001', 'Warehouse'),
('NV201', 'CN002', 'Manager'),
('NV202', 'CN002', 'Cashier'),
('NV203', 'CN002', 'Warehouse');

INSERT INTO TAIKHOAN (MaNV, TenDangNhap, MatKhau, VaiTro, IsActive) VALUES
('NV001', 'admin@fnbchain.com', crypt('admin@123', gen_salt('bf')), 'admin', TRUE),
('NV002', 'ops@fnbchain.com', crypt('ops123', gen_salt('bf')), 'giam_doc_van_hanh', TRUE),
('NV101', 'ql.cn1@fnbchain.com', crypt('ql123', gen_salt('bf')), 'quan_ly_chinhanh', TRUE),
('NV102', 'cash.cn1@fnbchain.com', crypt('cash123', gen_salt('bf')), 'thu_ngan', TRUE),
('NV103', 'kho.cn1@fnbchain.com', crypt('kho123', gen_salt('bf')), 'kho', TRUE)
ON CONFLICT (MaNV) DO UPDATE
SET TenDangNhap = EXCLUDED.TenDangNhap,
    MatKhau = EXCLUDED.MatKhau,
    VaiTro = EXCLUDED.VaiTro,
    IsActive = TRUE;

-- ------------------------------------------------------------
-- 3. Danh mục menu / CRM / nhà cung cấp
-- ------------------------------------------------------------
INSERT INTO LOAISANPHAM (MaLoai, TenLoai, MoTa) VALUES
('L001', 'Cà phê', 'Nhóm cà phê pha máy và pha phin'),
('L002', 'Trà sữa', 'Nhóm trà sữa và topping'),
('L003', 'Đá xay', 'Nhóm thức uống blended'),
('L004', 'Bánh ngọt', 'Bánh ăn kèm')
ON CONFLICT (MaLoai) DO UPDATE
SET TenLoai = EXCLUDED.TenLoai,
    MoTa = EXCLUDED.MoTa;

INSERT INTO KHACHHANG (MaKH, HoTen, SDT, Email, DiemTichLuy, HangThanhVien) VALUES
('KHDEMO001', 'Nguyễn Minh Anh', '0908111222', 'anh.nguyen@example.com', 1200, 'Silver'),
('KHDEMO002', 'Trần Hà My', '0908333444', 'ha.my@example.com', 6400, 'Gold'),
('KHDEMO003', 'Lê Quốc Bảo', '0908555666', 'quoc.bao@example.com', 11000, 'Gold')
ON CONFLICT (MaKH) DO UPDATE
SET HoTen = EXCLUDED.HoTen,
    SDT = EXCLUDED.SDT,
    Email = EXCLUDED.Email,
    DiemTichLuy = EXCLUDED.DiemTichLuy,
    HangThanhVien = EXCLUDED.HangThanhVien;

INSERT INTO NHACUNGCAP (MaNCC, TenNCC, SDT, Email, DiaChi, TrangThai) VALUES
('NCC001', 'Công ty Sữa FreshMilk', '02838889901', 'sales@freshmilk.vn', 'KCN Tân Bình, TP.HCM', 'Active'),
('NCC002', 'Công ty Hạt Rang Việt', '02838889902', 'coffee@rangviet.vn', 'Bình Thạnh, TP.HCM', 'Active'),
('NCC003', 'Công ty Bao bì GreenCup', '02838889903', 'hello@greencup.vn', 'Thủ Đức, TP.HCM', 'Active')
ON CONFLICT (MaNCC) DO UPDATE
SET TenNCC = EXCLUDED.TenNCC,
    SDT = EXCLUDED.SDT,
    Email = EXCLUDED.Email,
    DiaChi = EXCLUDED.DiaChi,
    TrangThai = EXCLUDED.TrangThai;

-- ------------------------------------------------------------
-- 4. Nguyên liệu / tồn kho / công thức / sản phẩm
-- ------------------------------------------------------------
-- [FIXED] Đổi tên cột LoaiVARCHAR thành Loai (hoặc cột tương ứng) nếu cần, ở đây giữ nguyên tên cột theo file của bạn
INSERT INTO NGUYENLIEU (MaNL, TenNL, DonViTinh, TrangThai) VALUES
('NL001', 'Cà phê hạt Arabica', 'gram', 'Active'),
('NL002', 'Sữa tươi', 'ml', 'Active'),
('NL003', 'Siro caramel', 'ml', 'Active'),
('NL004', 'Trà nhài', 'gram', 'Active'),
('NL005', 'Trân châu đen', 'gram', 'Active'),
('NL006', 'Bột matcha', 'gram', 'Active'),
('NL007', 'Ly giấy 500ml', 'cái', 'Active'),
('NL008', 'Đường nước', 'ml', 'Active')
ON CONFLICT (MaNL) DO UPDATE
SET TenNL = EXCLUDED.TenNL,
    DonViTinh = EXCLUDED.DonViTinh,
    TrangThai = EXCLUDED.TrangThai;

INSERT INTO TONKHO_CHINHANH (MaCN, MaNL, SoLuongTon, TonToiThieu, GiaNhapGanNhat) VALUES
('CN001', 'NL001', 12000, 8000, 420),
('CN001', 'NL002', 18000, 12000, 28),
('CN001', 'NL003', 3200, 4000, 55),
('CN001', 'NL004', 7000, 5000, 180),
('CN001', 'NL005', 2800, 2500, 70),
('CN001', 'NL006', 1500, 1800, 320),
('CN001', 'NL007', 220, 300, 1200),
('CN001', 'NL008', 6000, 4500, 18),
('CN002', 'NL001', 9000, 8000, 415),
('CN002', 'NL002', 13000, 12000, 28),
('CN002', 'NL003', 4500, 3500, 56),
('CN002', 'NL004', 6400, 5000, 181),
('CN002', 'NL005', 2100, 2500, 71),
('CN002', 'NL006', 2500, 1800, 318),
('CN002', 'NL007', 340, 300, 1180),
('CN002', 'NL008', 5100, 4500, 18)
ON CONFLICT (MaCN, MaNL) DO UPDATE
SET SoLuongTon = EXCLUDED.SoLuongTon,
    TonToiThieu = EXCLUDED.TonToiThieu,
    GiaNhapGanNhat = EXCLUDED.GiaNhapGanNhat;

INSERT INTO SANPHAM (MaSP, TenSP, MaLoai, GiaBanMacDinh, TrangThai) VALUES
('SP001', 'Americano', 'L001', 45000, 'Available'),
('SP002', 'Latte Caramel', 'L001', 55000, 'Available'),
('SP003', 'Trà sữa trân châu', 'L002', 49000, 'Available'),
('SP004', 'Matcha đá xay', 'L003', 62000, 'Available'),
('SP005', 'Croissant bơ', 'L004', 32000, 'Available'),
('SP006', 'Cold Brew', 'L001', 52000, 'Hidden') 
ON CONFLICT (MaSP) DO UPDATE
SET TenSP = EXCLUDED.TenSP,
    MaLoai = EXCLUDED.MaLoai,
    GiaBanMacDinh = EXCLUDED.GiaBanMacDinh,
    TrangThai = EXCLUDED.TrangThai;

DELETE FROM CONGTHUC WHERE MaSP IN ('SP001', 'SP002', 'SP003', 'SP004', 'SP005', 'SP006');
INSERT INTO CONGTHUC (MaSP, MaNL, DinhMuc) VALUES
('SP001', 'NL001', 18), ('SP001', 'NL007', 1),
('SP002', 'NL001', 16), ('SP002', 'NL002', 180), ('SP002', 'NL003', 25), ('SP002', 'NL007', 1),
('SP003', 'NL004', 14), ('SP003', 'NL002', 120), ('SP003', 'NL005', 80), ('SP003', 'NL008', 30), ('SP003', 'NL007', 1),
('SP004', 'NL006', 18), ('SP004', 'NL002', 140), ('SP004', 'NL008', 25), ('SP004', 'NL007', 1),
('SP005', 'NL007', 1),
('SP006', 'NL001', 20), ('SP006', 'NL007', 1);

-- ------------------------------------------------------------
-- 5. Ca làm + phân công
-- ------------------------------------------------------------
INSERT INTO CALAM (MaCL, TenCL, GioBatDau, GioKetThuc, TrangThai) VALUES
('CA001', 'Ca sáng', '06:00', '12:00', 'Active'),
('CA002', 'Ca chiều', '12:00', '18:00', 'Active'),
('CA003', 'Ca tối', '18:00', '22:00', 'Active')
ON CONFLICT (MaCL) DO UPDATE
SET TenCL = EXCLUDED.TenCL,
    GioBatDau = EXCLUDED.GioBatDau,
    GioKetThuc = EXCLUDED.GioKetThuc,
    TrangThai = EXCLUDED.TrangThai;

INSERT INTO PHANCONG (MaNV, MaCN, MaCL, Ngay, TrangThai) VALUES
('NV101', 'CN001', 'CA001', '2026-06-01', 'Done'),  
('NV102', 'CN001', 'CA002', '2026-06-01', 'Done'),  
('NV103', 'CN001', 'CA001', '2026-06-02', 'Assigned'),
('NV201', 'CN002', 'CA002', '2026-06-01', 'Done'),  
('NV202', 'CN002', 'CA001', '2026-06-01', 'Absent')
ON CONFLICT (MaNV, MaCN, MaCL, Ngay) DO UPDATE
SET TrangThai = EXCLUDED.TrangThai;

-- ------------------------------------------------------------
-- 6. Phiếu nhập demo
-- ------------------------------------------------------------
INSERT INTO PHIEUNHAP (MaPN, MaCN, MaNCC, MaNVLap, NgayNhap, TongTien, TrangThai) VALUES
('PNDEMO001', 'CN001', 'NCC001', 'NV103', CURRENT_DATE - INTERVAL '2 day', 0, 'Draft'),
('PNDEMO002', 'CN001', 'NCC002', 'NV103', CURRENT_DATE - INTERVAL '1 day', 0, 'Draft'),
('PNDEMO003', 'CN002', 'NCC003', 'NV203', CURRENT_DATE, 0, 'Cancelled');

INSERT INTO CHITIET_PHIEUNHAP (MaPN, MaNL, SoLuong, DonGia) VALUES
('PNDEMO001', 'NL002', 4000, 28),
('PNDEMO001', 'NL007', 200, 1200),
('PNDEMO002', 'NL001', 3000, 420),
('PNDEMO002', 'NL003', 2000, 55),
('PNDEMO003', 'NL005', 1500, 70);

UPDATE PHIEUNHAP
SET TongTien = (
    SELECT COALESCE(SUM(SoLuong * DonGia), 0)
    FROM CHITIET_PHIEUNHAP
    WHERE MaPN = PHIEUNHAP.MaPN
)
WHERE MaPN IN ('PNDEMO001', 'PNDEMO002', 'PNDEMO003');

UPDATE PHIEUNHAP
SET TrangThai = 'Received'
WHERE MaPN = 'PNDEMO002';

-- ------------------------------------------------------------
-- 7. Hóa đơn demo (tạo theo đúng flow trigger)
-- ------------------------------------------------------------
-- Bước 1: Khởi tạo hóa đơn ở trạng thái Pending
INSERT INTO HOADON (MaHD, MaCN, MaNV, MaKH, GiamGia, TrangThai) VALUES
('HDDEMO001', 'CN001', 'NV102', 'KHDEMO002', 0, 'Pending'),
('HDDEMO002', 'CN001', 'NV102', 'KHDEMO001', 0, 'Pending'),
('HDDEMO003', 'CN002', 'NV202', NULL,        0, 'Pending')
ON CONFLICT (MaHD) DO UPDATE SET TrangThai = EXCLUDED.TrangThai;

-- Bước 2: Nạp chi tiết món (Lúc này trigger trg_chitiet_hoadon_recalc sẽ tự tính TongThanhToan)
INSERT INTO CHITIET_HOADON (MaHD, MaSP, SoLuong, GiaBanTaiThoiDiem) VALUES
('HDDEMO001', 'SP002', 2, 55000),
('HDDEMO001', 'SP005', 1, 32000),
('HDDEMO002', 'SP003', 2, 49000),
('HDDEMO002', 'SP001', 1, 45000),
('HDDEMO003', 'SP004', 1, 62000)
ON CONFLICT (MaHD, MaSP) DO UPDATE SET SoLuong = EXCLUDED.SoLuong;

-- Bước 3: Nạp tiền vào bảng THANHTOAN 
-- (Trigger trg_thanhtoan_complete_hoadon sẽ tự kiểm tra và TỰ ĐỘNG chuyển HOADON 001 và 002 sang 'Completed')
INSERT INTO THANHTOAN (MaTT, MaHD, PhuongThuc, SoTien, TrangThai, LoaiGiaoDich) VALUES
('TTDEMO001', 'HDDEMO001', 'Card',     142000, 'Success', 'Payment'),
('TTDEMO002', 'HDDEMO002', 'EWallet',  143000, 'Success', 'Payment') -- Đổi 'E-Wallet' thành 'EWallet' cho khớp check constraint bảng THANHTOAN
ON CONFLICT (MaTT) DO UPDATE SET TrangThai = EXCLUDED.TrangThai;

-- Bước 4: Riêng hóa đơn HDDEMO003 không thanh toán mà bị HỦY, bạn chạy lệnh update này
-- (Trigger trg_hoadon_reverse_inventory sẽ tự động nhảy vào đảo bút toán kho nếu cần)
UPDATE HOADON SET TrangThai = 'Cancelled' WHERE MaHD = 'HDDEMO003';

-- ------------------------------------------------------------
-- 8. Phiếu chi demo
-- ------------------------------------------------------------
INSERT INTO PHIEUCHI (MaPC, MaCN, MaNV, NgayChi, LoaiChi, SoTien, MoTa, TrangThai) VALUES
('PCDEMO001', 'CN001', 'NV101', CURRENT_DATE - INTERVAL '1 day', 'Marketing & Advertising', 2500000, 'Chạy quảng cáo khai trương menu mới', 'Approved'),
('PCDEMO002', 'CN001', 'NV101', CURRENT_DATE, 'Other expenses', 980000, 'Mua vật tư vệ sinh và giấy in bill', 'Pending'),
('PCDEMO003', 'CN002', 'NV201', CURRENT_DATE - INTERVAL '2 day', 'Maintenance & Repair', 1500000, 'Sửa máy xay quầy pha chế', 'Rejected');

-- ------------------------------------------------------------
-- 9. Bổ sung log kiểm kho demo để màn KiemKho có lịch sử
-- ------------------------------------------------------------
WITH prev AS (
    SELECT SoLuongTon AS SoLuongTruoc
    FROM TONKHO_CHINHANH
    WHERE MaCN = 'CN001' AND MaNL = 'NL003'
),
upd AS (
    UPDATE TONKHO_CHINHANH
    SET SoLuongTon = GREATEST((SELECT SoLuongTruoc FROM prev) - 200, 0)
    WHERE MaCN = 'CN001' AND MaNL = 'NL003'
    RETURNING SoLuongTon AS SoLuongSau
)
INSERT INTO NHATKYKHO (
    MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau,
    NguonPhatSinh, MaChungTu, MaNVThucHien
)
SELECT 'CN001', 'NL003', 'Wastage', 200, prev.SoLuongTruoc, upd.SoLuongSau, 'KIEMKHO', 'KKDEMO001', 'NV103' FROM prev, upd;

WITH prev AS (
    SELECT SoLuongTon AS SoLuongTruoc
    FROM TONKHO_CHINHANH
    WHERE MaCN = 'CN001' AND MaNL = 'NL007'
),
upd AS (
    UPDATE TONKHO_CHINHANH
    SET SoLuongTon = (SELECT SoLuongTruoc FROM prev) + 100
    WHERE MaCN = 'CN001' AND MaNL = 'NL007'
    RETURNING SoLuongTon AS SoLuongSau
)
INSERT INTO NHATKYKHO (
    MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau,
    NguonPhatSinh, MaChungTu, MaNVThucHien
)
SELECT 'CN001', 'NL007', 'Adjustment', 100, prev.SoLuongTruoc, upd.SoLuongSau, 'KIEMKHO', 'KKDEMO002', 'NV103' FROM prev, upd;

-- ------------------------------------------------------------
-- 10. Compatibility view: NGUOIDUNG
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW NGUOIDUNG AS
SELECT
    tk.MaTK,
    tk.TenDangNhap,
    tk.VaiTro,
    tk.IsActive,
    nv.MaNV,
    nv.HoTen,
    nv.Email,
    nc.MaCN,
    cn.TenCN
FROM TAIKHOAN tk
JOIN NHANVIEN nv ON nv.MaNV = tk.MaNV
LEFT JOIN NHANVIEN_CHINHANH nc ON nc.MaNV = nv.MaNV
LEFT JOIN CHINHANH cn ON cn.MaCN = nc.MaCN;

COMMIT;

DO $$
BEGIN
    CALL sp_RefreshAllMaterializedViews();
EXCEPTION
    WHEN undefined_function THEN
        RAISE NOTICE 'sp_RefreshAllMaterializedViews() chưa tồn tại, bỏ qua bước refresh MV.';
END $$;