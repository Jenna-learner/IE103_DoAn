-- ============================================================
-- SCRIPT NẠP DỮ LIỆU SEEDING SỐ LƯỢNG LỚN (1 TRIỆU DÒNG)
-- ============================================================

-- Bỏ qua đồng bộ dữ liệu ổ đĩa tạm thời để nạp dữ liệu nhanh hơn
SET synchronous_commit = OFF; 

-- TẠM THỜI VÔ HIỆU HÓA TRIGGERS/FKS ĐỂ BULK INSERT SIÊU TỐC
SET session_replication_role = 'replica';

-- ============================================================
-- TẦNG 0: CHI NHÁNH (Bắt buộc phải có để gán dữ liệu)
-- ============================================================
INSERT INTO CHINHANH (MaCN, TenCN, DiaChi, SDT, Email, TrangThai)
SELECT 
    'CN' || i, 'Chi Nhánh ' || i, 'Địa chỉ CN ' || i, 
    '090' || LPAD(i::text, 7, '0'), 'cn'||i||'@fnb.vn', 'Active'
FROM generate_series(1, 10) i 
ON CONFLICT DO NOTHING;

-- ============================================================
-- TẦNG 1 & 2: DANH MỤC CƠ BẢN
-- ============================================================

-- 1. Loại sản phẩm
INSERT INTO LOAISANPHAM (MaLoai, TenLoai, MoTa)
SELECT 'L'||i, 'Loại '||i, 'Mô tả loại '||i 
FROM generate_series(1, 20) i 
ON CONFLICT DO NOTHING;

-- 2. Sản phẩm
INSERT INTO SANPHAM (MaSP, TenSP, GiaBanMacDinh, TrangThai, MaLoai)
SELECT 
    'SP'||i, 'Sản phẩm '||i, (floor(random()*100 + 20)) * 1000, 
    (ARRAY['Available', 'OutOfStock', 'Hidden'])[floor(random()*3)+1],
    'L'||(floor(random()*20)+1)
FROM generate_series(1, 200) i 
ON CONFLICT DO NOTHING;

-- 3. Nguyên liệu
INSERT INTO NGUYENLIEU (MaNL, TenNL, DonViTinh, TrangThai)
SELECT 
    'NL'||i, 'Nguyên liệu '||i, 
    (ARRAY['gram', 'ml', 'kg', 'cái'])[floor(random()*4)+1],
    'Active'
FROM generate_series(1, 100) i 
ON CONFLICT DO NOTHING;

-- 4. Tồn kho Chi nhánh (Tách ra từ Nguyên liệu)
INSERT INTO TONKHO_CHINHANH (MaCN, MaNL, SoLuongTon, TonToiThieu, GiaNhapGanNhat)
SELECT 
    'CN'||cn, 'NL'||nl, 
    floor(random()*5000 + 100), 500, (floor(random()*50 + 10)) * 1000
FROM generate_series(1, 10) cn, generate_series(1, 100) nl 
ON CONFLICT DO NOTHING;

-- 5. Bộ phận
INSERT INTO BOPHAN (MaBP, TenBP) VALUES 
('BP1', 'Management'), ('BP2', 'Kitchen/Bar'), ('BP3', 'Service'), 
('BP4', 'Security'), ('BP5', 'Janitor') 
ON CONFLICT DO NOTHING;

-- 6. Nhân viên
INSERT INTO NHANVIEN (MaNV, HoTen, NgaySinh, SDT, DonGiaCa, TrangThai, MaBP)
SELECT 
    'NV'||i, 'Nhân viên '||i, 
    '1990-01-01'::date + (random()*5000)::int * interval '1 day',
    '03'||LPAD(i::text, 8, '0'), (floor(random()*15 + 15)) * 10000, 
    'Active', 'BP'||(floor(random()*5)+1)
FROM generate_series(1, 500) i 
ON CONFLICT DO NOTHING;

-- 7. Khách hàng
INSERT INTO KHACHHANG (MaKH, HoTen, SDT, DiemTichLuy, HangThanhVien)
SELECT 
    'KH'||i, 'Khách hàng '||i, '08'||LPAD(i::text, 8, '0'), floor(random()*20000),
    (ARRAY['Bronze', 'Silver', 'Gold', 'Platinum'])[floor(random()*4)+1]
FROM generate_series(1, 5000) i 
ON CONFLICT DO NOTHING;

-- 8. Nhà cung cấp
INSERT INTO NHACUNGCAP (MaNCC, TenNCC, SDT, DiaChi, Email)
SELECT 
    'NCC'||i, 'Công ty '||i, '028'||LPAD(i::text, 7, '0'), 
    'Địa chỉ '||i, 'ncc'||i||'@gmail.com'
FROM generate_series(1, 100) i 
ON CONFLICT DO NOTHING;

-- 9. Ca làm
INSERT INTO CALAM (MaCL, TenCL, GioBatDau, GioKetThuc) VALUES 
('CL1', 'Morning Shift', '06:00', '12:00'), 
('CL2', 'Afternoon Shift', '12:00', '18:00'), 
('CL3', 'Night Shift', '18:00', '23:59:59')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TẦNG 3: GIAO DỊCH VÀ CHỨNG TỪ (HEAVY LOAD)
-- ============================================================

-- 1. Tạo 1 TRIỆU Hóa đơn
INSERT INTO HOADON (MaHD, MaCN, NgayLap, TongTienHang, GiamGia, TongThanhToan, MaKH, MaNV, LoaiDonHang, TrangThai)
SELECT 
    'HD' || i,
    'CN' || (floor(random()*10)+1),
    NOW() - (random() * interval '730 days'),
    150000, 0, 150000, -- Dữ liệu giả định để tránh Trigger chạy lâu
    'KH' || (floor(random()*5000)+1),
    'NV' || (floor(random()*500)+1),
    (ARRAY['DineIn', 'TakeAway', 'Delivery'])[floor(random()*3)+1],
    'Completed'
FROM generate_series(1, 1000000) i 
ON CONFLICT DO NOTHING;

-- 2. Tạo Phiếu nhập hàng
INSERT INTO PHIEUNHAP (MaPN, MaCN, NgayNhap, TongTien, MaNCC, TrangThai)
SELECT 
    'PN'||i, 
    'CN' || (floor(random()*10)+1),
    NOW() - (random() * interval '730 days'), 
    5000000, 'NCC'||(floor(random()*100)+1), 'Received'
FROM generate_series(1, 5000) i 
ON CONFLICT DO NOTHING;

-- ============================================================
-- TẦNG 4: CHI TIẾT (HEAVY LOAD)
-- ============================================================

-- 1. Chi tiết hóa đơn (Sinh ngẫu nhiên món cho 1 triệu HD)
INSERT INTO CHITIET_HOADON (MaHD, MaSP, SoLuong, GiaBanTaiThoiDiem)
SELECT 
    'HD' || s.id,
    'SP' || (floor(random() * 200) + 1),
    (floor(random() * 5) + 1)::int,
    (floor(random() * 100 + 20)) * 1000
FROM 
    generate_series(1, 1000000) AS s(id),
    generate_series(1, floor(random() * 3 + 1)::int) 
ON CONFLICT (MaHD, MaSP) DO NOTHING;

-- 2. Thanh toán (Gắn đúng chuẩn Enum)
INSERT INTO THANHTOAN (MaTT, MaHD, PhuongThuc, SoTien, NgayTT, TrangThai, LoaiGiaoDich)
SELECT 
    'TT'||i, 'HD'||i,
    (ARRAY['Cash', 'EWallet', 'Card', 'BankTransfer'])[floor(random()*4)+1],
    150000, NOW() - (random()*730 * interval '1 day'),
    'Success', 'Payment'
FROM generate_series(1, 1000000) i 
ON CONFLICT DO NOTHING;

-- 3. Nhật ký kho
INSERT INTO NHATKYKHO (MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau, NguonPhatSinh, NgayGhi)
SELECT 
    'CN' || (floor(random()*10)+1),
    'NL' || (floor(random()*100)+1),
    (ARRAY['Import', 'Export', 'Adjustment', 'Wastage'])[floor(random()*4)+1],
    floor(random()*100 + 1), 500, 400,
    (ARRAY['PHIEUNHAP', 'HOADON', 'KIEMKHO'])[floor(random()*3)+1],
    NOW() - (random()*730 * interval '1 day')
FROM generate_series(1, 100000) i 
ON CONFLICT DO NOTHING;

-- 4. Phân công ca làm
INSERT INTO PHANCONG (MaNV, MaCN, MaCL, Ngay, TrangThai)
SELECT 
    'NV'||(floor(random()*500)+1),
    'CN'||(floor(random()*10)+1),
    'CL'||(floor(random()*3)+1),
    CURRENT_DATE - (i * interval '1 day'),
    'Done'
FROM generate_series(0, 365) i, generate_series(1, 20) 
ON CONFLICT (MaNV, MaCN, MaCL, Ngay) DO NOTHING;

-- BẬT LẠI TRIGGERS SAU KHI NẠP XONG
SET session_replication_role = 'origin';

-- LÀM MỚI MATERIALIZED VIEWS ĐỂ CẬP NHẬT 1 TRIỆU DATA
REFRESH MATERIALIZED VIEW mv_doanhthu_ngay;
REFRESH MATERIALIZED VIEW mv_top_sanpham;