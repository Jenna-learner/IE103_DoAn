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
-- ĐOẠN CODE ĐÃ ĐƯỢC CHUẨN HÓA ĐỒNG BỘ:
INSERT INTO CHINHANH (MaCN, TenCN, DiaChi, SDT, Email, TrangThai)
SELECT 
    'CN' || LPAD(i::text, 3, '0'), 
    'Chi Nhánh ' || i, 
    'Địa chỉ CN ' || i, 
    '090' || LPAD(i::text, 7, '0'), 
    'cn'||i||'@fnb.vn', 
    'Active'
FROM generate_series(1, 10) i 
ON CONFLICT DO NOTHING;

-- ============================================================
-- TẦNG 1 & 2: DANH MỤC CƠ BẢN
-- ============================================================

-- 1. Loại sản phẩm
INSERT INTO LOAISANPHAM (MaLoai, TenLoai, MoTa) VALUES
('L01', 'Cà phê máy', 'Espresso based coffee'),
('L02', 'Cà phê truyền thống', 'Phin, bạc xỉu, cà phê sữa'),
('L03', 'Trà trái cây', 'Trà nền trái cây tươi'),
('L04', 'Trà sữa', 'Milk tea & topping'),
('L05', 'Đá xay', 'Blended & frappe'),
('L06', 'Nước ép & soda', 'Juice, soda, sparkling'),
('L07', 'Bánh ngọt', 'Pastry & dessert'),
('L08', 'Bữa sáng nhẹ', 'Toast, sandwich, croissant')
ON CONFLICT (MaLoai) DO UPDATE
SET TenLoai = EXCLUDED.TenLoai,
    MoTa = EXCLUDED.MoTa;

-- 2. Sản phẩm
WITH product_seed(name, price, maloai) AS (
    SELECT * FROM (VALUES
        ('Espresso', 39000, 'L01'),
        ('Americano', 45000, 'L01'),
        ('Cappuccino', 55000, 'L01'),
        ('Latte Caramel', 59000, 'L01'),
        ('Mocha', 62000, 'L01'),
        ('Cold Brew Original', 52000, 'L01'),
        ('Cold Brew Cam', 56000, 'L01'),
        ('Bạc xỉu', 42000, 'L02'),
        ('Cà phê sữa đá', 39000, 'L02'),
        ('Cà phê đen đá', 35000, 'L02'),
        ('Phin sữa nóng', 43000, 'L02'),
        ('Phin đen nóng', 39000, 'L02'),
        ('Trà đào cam sả', 55000, 'L03'),
        ('Trà vải hoa hồng', 58000, 'L03'),
        ('Trà dâu hibiscus', 56000, 'L03'),
        ('Trà chanh mật ong', 45000, 'L03'),
        ('Trà xoài nhiệt đới', 57000, 'L03'),
        ('Trà sữa trân châu đường đen', 59000, 'L04'),
        ('Trà sữa ô long', 57000, 'L04'),
        ('Trà sữa matcha', 62000, 'L04'),
        ('Trà sữa khoai môn', 58000, 'L04'),
        ('Sữa tươi trân châu đường đen', 61000, 'L04'),
        ('Matcha đá xay', 65000, 'L05'),
        ('Chocolate đá xay', 63000, 'L05'),
        ('Cookies & Cream đá xay', 66000, 'L05'),
        ('Caramel Frappe', 67000, 'L05'),
        ('Mocha Frappe', 69000, 'L05'),
        ('Soda chanh bạc hà', 49000, 'L06'),
        ('Soda việt quất', 52000, 'L06'),
        ('Nước ép cam', 52000, 'L06'),
        ('Nước ép dưa hấu', 49000, 'L06'),
        ('Nước ép ổi hồng', 54000, 'L06'),
        ('Croissant bơ', 32000, 'L07'),
        ('Pain au chocolat', 36000, 'L07'),
        ('Tiramisu', 52000, 'L07'),
        ('Cheesecake việt quất', 56000, 'L07'),
        ('Mousse chanh dây', 49000, 'L07'),
        ('Sandwich trứng phô mai', 45000, 'L08'),
        ('Toast bơ tỏi', 39000, 'L08'),
        ('Bánh mì gà xé', 48000, 'L08')
    ) AS v(name, price, maloai)
)
INSERT INTO SANPHAM (MaSP, TenSP, GiaBanMacDinh, TrangThai, MaLoai)
SELECT
    'SP' || LPAD(row_number() OVER (), 3, '0'),
    name,
    price,
    'Available',
    maloai
FROM product_seed
ON CONFLICT (MaSP) DO UPDATE
SET TenSP = EXCLUDED.TenSP,
    GiaBanMacDinh = EXCLUDED.GiaBanMacDinh,
    TrangThai = EXCLUDED.TrangThai,
    MaLoai = EXCLUDED.MaLoai;

-- 3. Nguyên liệu
WITH ingredient_seed(name, unit) AS (
    SELECT * FROM (VALUES
        ('Hạt cà phê Arabica', 'gram'),
        ('Hạt cà phê Robusta', 'gram'),
        ('Sữa tươi thanh trùng', 'ml'),
        ('Sữa đặc', 'ml'),
        ('Kem béo thực vật', 'ml'),
        ('Siro caramel', 'ml'),
        ('Siro vanilla', 'ml'),
        ('Siro hazelnut', 'ml'),
        ('Sốt chocolate', 'ml'),
        ('Bột matcha', 'gram'),
        ('Bột cacao', 'gram'),
        ('Trà ô long', 'gram'),
        ('Trà nhài', 'gram'),
        ('Trà hibiscus', 'gram'),
        ('Trân châu đen', 'gram'),
        ('Thạch cà phê', 'gram'),
        ('Nha đam', 'gram'),
        ('Đào ngâm', 'gram'),
        ('Vải ngâm', 'gram'),
        ('Xoài puree', 'ml'),
        ('Dâu puree', 'ml'),
        ('Chanh vàng', 'quả'),
        ('Cam vàng', 'quả'),
        ('Dưa hấu', 'gram'),
        ('Ổi hồng', 'gram'),
        ('Lá bạc hà', 'gram'),
        ('Đường nước', 'ml'),
        ('Nước soda', 'ml'),
        ('Đá viên', 'gram'),
        ('Ly giấy 500ml', 'cái'),
        ('Nắp ly 500ml', 'cái'),
        ('Ống hút giấy', 'cái'),
        ('Bơ lạt', 'gram'),
        ('Phô mai kem', 'gram'),
        ('Bánh croissant đông lạnh', 'cái')
    ) AS v(name, unit)
)
INSERT INTO NGUYENLIEU (MaNL, TenNL, DonViTinh, TrangThai)
SELECT
    'NL' || LPAD(row_number() OVER (), 3, '0'),
    name,
    unit,
    'Active'
FROM ingredient_seed
ON CONFLICT (MaNL) DO UPDATE
SET TenNL = EXCLUDED.TenNL,
    DonViTinh = EXCLUDED.DonViTinh,
    TrangThai = EXCLUDED.TrangThai;

-- 4. Tồn kho Chi nhánh (Tách ra từ Nguyên liệu)
INSERT INTO TONKHO_CHINHANH (MaCN, MaNL, SoLuongTon, TonToiThieu, GiaNhapGanNhat)
SELECT 
    'CN'||cn, 'NL'||nl, 
    floor(random()*5000 + 100), 500, (floor(random()*50 + 10)) * 1000
FROM generate_series(1, 10) cn, generate_series(1, 35) nl 
ON CONFLICT DO NOTHING;

-- 5. Bộ phận
INSERT INTO BOPHAN (MaBP, TenBP) VALUES 
('BP001', 'Management'), 
('BP002', 'Kitchen/Bar'), 
('BP003', 'Service'), 
('BP004', 'Security'), 
('BP005', 'Janitor') 
ON CONFLICT (MaBP) DO NOTHING;

-- 6. Nhân viên
INSERT INTO NHANVIEN (MaNV, HoTen, NgaySinh, SDT, DonGiaCa, TrangThai, MaBP)
SELECT 
    'NV' || LPAD(i::text, 3, '0'), 
    'Nhân viên '||i, 
    '1990-01-01'::date + (random()*5000)::int * interval '1 day',
    '03'||LPAD(i::text, 8, '0'), (floor(random()*15 + 15)) * 10000, 
    'Active', 'BP'||LPAD((floor(random()*5)+1)::text, 3, '0') 
FROM generate_series(1, 500) i 
ON CONFLICT (MaNV) DO NOTHING;

-- 7. Khách hàng
WITH khachhang_seed AS (
    SELECT 
        'KH' || i AS MaKH,
        'Khách hàng ' || i AS HoTen,
        '08' || LPAD(i::text, 8, '0') AS SDT,
        FLOOR(RANDOM() * 25000)::INT AS DiemTichLuy -- Sinh ngẫu nhiên điểm từ 0 đến 25,000
    FROM generate_series(1, 5000) i
)
INSERT INTO KHACHHANG (MaKH, HoTen, SDT, DiemTichLuy, HangThanhVien)
SELECT 
    MaKH,
    HoTen,
    SDT,
    DiemTichLuy,
    -- Ép logic phân hạng dựa theo số điểm vừa được sinh ra ở trên
    CASE 
        WHEN DiemTichLuy >= 15000 THEN 'Platinum'
        WHEN DiemTichLuy >= 10000 THEN 'Gold'
        WHEN DiemTichLuy >= 5000 THEN 'Silver'
        ELSE 'Bronze'
    END AS HangThanhVien
FROM khachhang_seed
ON CONFLICT (MaKH) DO UPDATE 
SET HoTen = EXCLUDED.HoTen,
    SDT = EXCLUDED.SDT,
    DiemTichLuy = EXCLUDED.DiemTichLuy,
    HangThanhVien = EXCLUDED.HangThanhVien;

-- 8. Nhà cung cấp
INSERT INTO NHACUNGCAP (MaNCC, TenNCC, SDT, DiaChi, Email)
SELECT 
    'NCC'||i, 'Công ty '||i, '028'||LPAD(i::text, 7, '0'), 
    'Địa chỉ '||i, 'ncc'||i||'@gmail.com'
FROM generate_series(1, 100) i 
ON CONFLICT DO NOTHING;

-- 9. Ca làm
INSERT INTO CALAM (MaCL, TenCL, GioBatDau, GioKetThuc) VALUES 
('CL001', 'Morning Shift', '06:00', '12:00'), 
('CL002', 'Afternoon Shift', '12:00', '18:00'), 
('CL003', 'Night Shift', '18:00', '23:59:59')
ON CONFLICT (MaCL) DO NOTHING; 

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
    'SP' || LPAD((floor(random() * 40) + 1)::text, 3, '0'),
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
INSERT INTO PHANCONG (MaPC, MaNV, MaCN, MaCL, NgayPhanCong, TrangThai)
SELECT 
    'PC' || i,  
    'NV' || (floor(random()*100)+1),
    'CN' || (floor(random()*10)+1),
    'CL' || LPAD((floor(random()*3)+1)::text, 3, '0'), 
    NOW() - (random()*30 * interval '1 day'),
    'Scheduled'
FROM generate_series(1, 50000) i
ON CONFLICT (MaPC) DO NOTHING; 

-- BẬT LẠI TRIGGERS SAU KHI NẠP XONG
SET session_replication_role = 'origin';

-- LÀM MỚI MATERIALIZED VIEWS ĐỂ CẬP NHẬT 1 TRIỆU DATA
REFRESH MATERIALIZED VIEW mv_doanhthu_ngay;
REFRESH MATERIALIZED VIEW mv_top_sanpham;
