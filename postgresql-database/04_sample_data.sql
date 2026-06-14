-- ============================================================
-- HỆ THỐNG QUẢN LÝ CHUỖI FnB - IE103
-- File: 04_sample_data.sql  (BẢN GỌN, MÃ ĐÚNG ĐỊNH DẠNG)
-- Mục đích: Dữ liệu mẫu vừa đủ để DEMO toàn bộ tính năng đã build
--           (POS, Kho/Nhập hàng, Chi phí, Phân công, CRM, Dashboard/Báo cáo).
-- Khác bản 1-triệu-dòng cũ: tất cả mã giao dịch dùng LPAD đúng chuẩn
--   (CN001, NV001, NL001, SP001...) nên các JOIN / Materialized View
--   chạy đúng -> tồn kho & dashboard có dữ liệu.
-- Chạy SAU 01/02/03, bằng superuser. Sau file này chạy 05 và 06.
-- ============================================================

SET synchronous_commit = OFF;
SET session_replication_role = 'replica';   -- tắt trigger/FK để nạp nhanh

-- ============================================================
-- TẦNG 0: DANH MỤC GỐC
-- ============================================================

-- 0. Chi nhánh (10)
INSERT INTO CHINHANH (MaCN, TenCN, DiaChi, SDT, Email, TrangThai)
SELECT 'CN' || LPAD(i::text, 3, '0'),
       'Chi nhánh ' || i,
       'Địa chỉ CN ' || i,
       '090' || LPAD(i::text, 7, '0'),
       'cn' || i || '@fnb.vn',
       'Active'
FROM generate_series(1, 10) i
ON CONFLICT (MaCN) DO NOTHING;

-- 1. Bộ phận
INSERT INTO BOPHAN (MaBP, TenBP) VALUES
('BP001', 'Management'),
('BP002', 'Kitchen/Bar'),
('BP003', 'Service'),
('BP004', 'Security'),
('BP005', 'Janitor')
ON CONFLICT (MaBP) DO NOTHING;

-- 2. Nhân viên (40)
INSERT INTO NHANVIEN (MaNV, HoTen, NgaySinh, SDT, DonGiaCa, TrangThai, MaBP)
SELECT 'NV' || LPAD(i::text, 3, '0'),
       'Nhân viên ' || i,
       DATE '1995-01-01' + (i * 17 % 3000) * interval '1 day',
       '03' || LPAD(i::text, 8, '0'),
       (floor(random() * 15 + 15)) * 10000,
       'Active',
       'BP' || LPAD((floor(random() * 5) + 1)::text, 3, '0')
FROM generate_series(1, 40) i
ON CONFLICT (MaNV) DO NOTHING;

-- 3. Loại sản phẩm
INSERT INTO LOAISANPHAM (MaLoai, TenLoai, MoTa) VALUES
('L01', 'Cà phê máy', 'Espresso based coffee'),
('L02', 'Cà phê truyền thống', 'Phin, bạc xỉu, cà phê sữa'),
('L03', 'Trà trái cây', 'Trà nền trái cây tươi'),
('L04', 'Trà sữa', 'Milk tea & topping'),
('L05', 'Đá xay', 'Blended & frappe'),
('L06', 'Nước ép & soda', 'Juice, soda, sparkling'),
('L07', 'Bánh ngọt', 'Pastry & dessert'),
('L08', 'Bữa sáng nhẹ', 'Toast, sandwich, croissant')
ON CONFLICT (MaLoai) DO UPDATE SET TenLoai = EXCLUDED.TenLoai, MoTa = EXCLUDED.MoTa;

-- 4. Sản phẩm (40) — giữ nguyên để khớp công thức ở 06
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
SELECT 'SP' || LPAD(row_number() OVER ()::text, 3, '0'), name, price, 'Available', maloai
FROM product_seed
ON CONFLICT (MaSP) DO UPDATE
SET TenSP = EXCLUDED.TenSP, GiaBanMacDinh = EXCLUDED.GiaBanMacDinh,
    TrangThai = EXCLUDED.TrangThai, MaLoai = EXCLUDED.MaLoai;

-- 5. Nguyên liệu (35) — giữ nguyên để khớp công thức ở 06
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
SELECT 'NL' || LPAD(row_number() OVER ()::text, 3, '0'), name, unit, 'Active'
FROM ingredient_seed
ON CONFLICT (MaNL) DO UPDATE
SET TenNL = EXCLUDED.TenNL, DonViTinh = EXCLUDED.DonViTinh, TrangThai = EXCLUDED.TrangThai;

-- 6. Nhà cung cấp (15)
INSERT INTO NHACUNGCAP (MaNCC, TenNCC, SDT, DiaChi, Email)
SELECT 'NCC' || i, 'Công ty ' || i, '028' || LPAD(i::text, 7, '0'),
       'Địa chỉ NCC ' || i, 'ncc' || i || '@gmail.com'
FROM generate_series(1, 15) i
ON CONFLICT (MaNCC) DO NOTHING;

-- 7. Ca làm
INSERT INTO CALAM (MaCL, TenCL, GioBatDau, GioKetThuc) VALUES
('CL001', 'Morning Shift', '06:00', '12:00'),
('CL002', 'Afternoon Shift', '12:00', '18:00'),
('CL003', 'Night Shift', '18:00', '23:59:59')
ON CONFLICT (MaCL) DO NOTHING;

-- 8. Khách hàng (300) — phân bổ ĐỀU 4 hạng (~75 KH/hạng) để báo cáo hội viên rõ ràng
--    Điểm khớp đúng ngưỡng hạng để nhất quán (Platinum>=15000, Gold>=10000, Silver>=5000)
INSERT INTO KHACHHANG (MaKH, HoTen, SDT, DiemTichLuy, HangThanhVien)
SELECT 'KH' || i, 'Khách hàng ' || i, '08' || LPAD(i::text, 8, '0'),
       d.diem, d.hang
FROM generate_series(1, 300) i
CROSS JOIN LATERAL (
  SELECT CASE (i % 4)
           WHEN 0 THEN 15000 + (i * 7 % 5000)   -- Platinum
           WHEN 1 THEN 10000 + (i * 7 % 4999)    -- Gold
           WHEN 2 THEN 5000  + (i * 7 % 4999)    -- Silver
           ELSE        (i * 7 % 4999)            -- Bronze
         END AS diem,
         CASE (i % 4)
           WHEN 0 THEN 'Platinum'
           WHEN 1 THEN 'Gold'
           WHEN 2 THEN 'Silver'
           ELSE        'Bronze'
         END AS hang
) d
ON CONFLICT (MaKH) DO UPDATE
SET HoTen = EXCLUDED.HoTen, SDT = EXCLUDED.SDT,
    DiemTichLuy = EXCLUDED.DiemTichLuy, HangThanhVien = EXCLUDED.HangThanhVien;

-- 9. Tồn kho: mọi chi nhánh × 35 nguyên liệu (MÃ ĐÚNG qua JOIN bảng gốc)
INSERT INTO TONKHO_CHINHANH (MaCN, MaNL, SoLuongTon, TonToiThieu, GiaNhapGanNhat)
SELECT cn.MaCN, nl.MaNL,
       (floor(random() * 4000) + 1000)::numeric, 500,
       (floor(random() * 40) + 10) * 1000
FROM CHINHANH cn CROSS JOIN NGUYENLIEU nl
ON CONFLICT (MaCN, MaNL) DO NOTHING;

-- Vài dòng dưới ngưỡng để có cảnh báo tồn kho trên dashboard
UPDATE TONKHO_CHINHANH SET SoLuongTon = 50
WHERE (MaCN, MaNL) IN (
  ('CN001','NL003'), ('CN001','NL015'), ('CN002','NL010'),
  ('CN003','NL001'), ('CN002','NL029')
);

-- 10. Công thức sản phẩm (CONGTHUC) — để trigger trừ kho khi bán hoạt động
INSERT INTO CONGTHUC (MaSP, MaNL, DinhMuc) VALUES
-- L01 - Cà phê máy
('SP001','NL001',18),
('SP002','NL001',18),('SP002','NL029',100),
('SP003','NL001',18),('SP003','NL003',120),
('SP004','NL001',18),('SP004','NL003',150),('SP004','NL006',20),
('SP005','NL001',18),('SP005','NL003',120),('SP005','NL009',25),
('SP006','NL001',25),('SP006','NL029',100),
('SP007','NL001',25),('SP007','NL023',1),('SP007','NL029',100),
-- L02 - Cà phê truyền thống
('SP008','NL002',20),('SP008','NL003',80),('SP008','NL004',30),
('SP009','NL002',20),('SP009','NL004',30),('SP009','NL029',120),
('SP010','NL002',20),('SP010','NL027',15),('SP010','NL029',120),
('SP011','NL002',20),('SP011','NL004',30),
('SP012','NL002',20),('SP012','NL027',15),
-- L03 - Trà trái cây
('SP013','NL013',5),('SP013','NL018',60),('SP013','NL023',1),
('SP014','NL013',5),('SP014','NL019',60),
('SP015','NL014',5),('SP015','NL021',30),
('SP016','NL013',5),('SP016','NL022',1),('SP016','NL027',20),
('SP017','NL013',5),('SP017','NL020',40),
-- L04 - Trà sữa
('SP018','NL012',8),('SP018','NL003',100),('SP018','NL005',30),('SP018','NL015',50),
('SP019','NL012',8),('SP019','NL003',100),('SP019','NL005',30),
('SP020','NL010',8),('SP020','NL003',120),('SP020','NL005',30),
('SP021','NL003',120),('SP021','NL005',30),('SP021','NL015',40),
('SP022','NL003',200),('SP022','NL015',50),('SP022','NL027',20),
-- L05 - Đá xay
('SP023','NL010',10),('SP023','NL003',120),('SP023','NL029',150),
('SP024','NL009',30),('SP024','NL003',120),('SP024','NL029',150),
('SP025','NL009',20),('SP025','NL003',120),('SP025','NL029',150),
('SP026','NL006',25),('SP026','NL003',120),('SP026','NL029',150),
('SP027','NL001',18),('SP027','NL009',25),('SP027','NL003',120),('SP027','NL029',150),
-- L06 - Nước ép & soda
('SP028','NL028',150),('SP028','NL022',1),('SP028','NL026',5),
('SP029','NL028',150),('SP029','NL021',25),('SP029','NL027',20),
('SP030','NL023',3),
('SP031','NL024',200),
('SP032','NL025',200),
-- L07 - Bánh ngọt
('SP033','NL035',1),('SP033','NL033',10),
('SP034','NL035',1),('SP034','NL009',15),
('SP035','NL034',60),('SP035','NL011',5),
('SP036','NL034',80),('SP036','NL021',20),
('SP037','NL034',50),('SP037','NL022',1),
-- L08 - Bữa sáng nhẹ
('SP038','NL034',30),('SP038','NL033',10),
('SP039','NL033',20),
('SP040','NL033',10)
ON CONFLICT (MaSP, MaNL) DO UPDATE SET DinhMuc = EXCLUDED.DinhMuc;

-- ============================================================
-- TẦNG 1: GIAO DỊCH (gọn, ngày gần đây, MÃ ĐÚNG)
-- ============================================================

-- 1. Hóa đơn (3.000 đơn Completed, rải đều 90 ngày gần nhất)
INSERT INTO HOADON (MaHD, MaCN, MaKH, MaNV, NgayLap, LoaiDonHang, TongTienHang, GiamGia, TongThanhToan, TrangThai)
SELECT 'HD' || LPAD(i::text, 6, '0'),
       'CN' || LPAD((floor(random() * 10) + 1)::text, 3, '0'),
       'KH' || (floor(random() * 300) + 1),
       'NV' || LPAD((floor(random() * 40) + 1)::text, 3, '0'),
       NOW() - (random() * 90) * interval '1 day',
       (ARRAY['DineIn','TakeAway','Delivery'])[floor(random() * 3) + 1],
       0, 0, 0,
       'Completed'
FROM generate_series(1, 3000) i
ON CONFLICT (MaHD) DO NOTHING;

-- 2. Chi tiết hóa đơn (1..3 dòng/đơn, SP001..SP040)
INSERT INTO CHITIET_HOADON (MaHD, MaSP, SoLuong, GiaBanTaiThoiDiem)
SELECT 'HD' || LPAD(s.id::text, 6, '0'),
       'SP' || LPAD((floor(random() * 40) + 1)::text, 3, '0'),
       (floor(random() * 4) + 1)::int,
       (floor(random() * 80) + 25) * 1000
FROM generate_series(1, 3000) AS s(id),
     generate_series(1, (floor(random() * 3) + 1)::int)
ON CONFLICT (MaHD, MaSP) DO NOTHING;

-- 3. Tính lại tổng tiền hóa đơn theo chi tiết (trigger đang tắt)
UPDATE HOADON hd
SET TongTienHang = t.tong, TongThanhToan = t.tong
FROM (SELECT MaHD, SUM(SoLuong * GiaBanTaiThoiDiem) AS tong
      FROM CHITIET_HOADON GROUP BY MaHD) t
WHERE hd.MaHD = t.MaHD;

-- 4. Thanh toán (mỗi đơn > 0 một giao dịch Success)
INSERT INTO THANHTOAN (MaTT, MaHD, PhuongThuc, SoTien, NgayTT, TrangThai, LoaiGiaoDich)
SELECT 'TT' || substring(hd.MaHD from 3),
       hd.MaHD,
       (ARRAY['Cash','Card','EWallet','BankTransfer'])[floor(random() * 4) + 1],
       hd.TongThanhToan, hd.NgayLap, 'Success', 'Payment'
FROM HOADON hd
WHERE hd.TongThanhToan > 0
ON CONFLICT (MaTT) DO NOTHING;

-- 5. Phiếu nhập (60) + chi tiết — round-robin chi nhánh để MỌI chi nhánh đều có phiếu nhập
INSERT INTO PHIEUNHAP (MaPN, MaCN, MaNCC, MaNVLap, NgayNhap, TongTien, TrangThai)
SELECT 'PN' || LPAD(i::text, 5, '0'),
       'CN' || LPAD(((i % 10) + 1)::text, 3, '0'),
       'NCC' || ((i % 15) + 1),
       'NV' || LPAD(((i % 40) + 1)::text, 3, '0'),
       NOW() - (floor(random() * 75)) * interval '1 day',
       0, 'Received'
FROM generate_series(1, 60) i
ON CONFLICT (MaPN) DO NOTHING;

INSERT INTO CHITIET_PHIEUNHAP (MaPN, MaNL, SoLuong, DonGia)
SELECT 'PN' || LPAD(s.id::text, 5, '0'),
       'NL' || LPAD((floor(random() * 35) + 1)::text, 3, '0'),
       (floor(random() * 200) + 20)::numeric,
       (floor(random() * 40) + 10) * 1000
FROM generate_series(1, 60) AS s(id),
     generate_series(1, (floor(random() * 4) + 1)::int)
ON CONFLICT (MaPN, MaNL) DO NOTHING;

UPDATE PHIEUNHAP pn
SET TongTien = t.tong
FROM (SELECT MaPN, SUM(SoLuong * DonGia) AS tong FROM CHITIET_PHIEUNHAP GROUP BY MaPN) t
WHERE pn.MaPN = t.MaPN;

-- 6. Phiếu chi (400) cho phần tài chính/chi phí
--    Round-robin chi nhánh & loại chi -> đủ 10 chi nhánh + đủ 8 loại; ~80% Approved
--    Ngày trong 75 ngày gần nhất -> tháng hiện tại có đủ dữ liệu để báo cáo
INSERT INTO PHIEUCHI (MaPC, MaCN, MaNV, NgayChi, LoaiChi, SoTien, MoTa, TrangThai)
SELECT 'PC' || LPAD(i::text, 5, '0'),
       'CN' || LPAD(((i % 10) + 1)::text, 3, '0'),
       'NV' || LPAD(((i % 40) + 1)::text, 3, '0'),
       NOW() - (floor(random() * 75)) * interval '1 day',
       (ARRAY['Electricity','Water','Internet','Premises',
              'Maintenance & Repair','Marketing & Advertising',
              'Taxes & Fees','Other expenses'])[(i % 8) + 1],
       (floor(random() * 9) + 1) * 500000,
       'Chi phí vận hành demo ' || i,
       CASE WHEN i % 5 = 0 THEN 'Pending' ELSE 'Approved' END
FROM generate_series(1, 400) i
ON CONFLICT (MaPC) DO NOTHING;

-- 7. Nhật ký kho (1.500 dòng, MÃ ĐÚNG)
INSERT INTO NHATKYKHO (MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau, NguonPhatSinh, MaNVThucHien, NgayGhi)
SELECT 'CN' || LPAD((floor(random() * 10) + 1)::text, 3, '0'),
       'NL' || LPAD((floor(random() * 35) + 1)::text, 3, '0'),
       (ARRAY['Import','Export','Adjustment','Wastage'])[floor(random() * 4) + 1],
       (floor(random() * 100) + 1)::numeric, 500, 400,
       (ARRAY['PHIEUNHAP','HOADON','KIEMKHO'])[floor(random() * 3) + 1],
       'NV' || LPAD((floor(random() * 40) + 1)::text, 3, '0'),
       NOW() - (random() * 90) * interval '1 day'
FROM generate_series(1, 1500) i;

-- 7b. Điều chỉnh kiểm kho & Hao hụt/hư hỏng (200 dòng) — dành riêng cho báo cáo nhập hàng
--     Số liệu trước/sau hợp lệ (sau = trước - lượng, không âm), đủ 10 chi nhánh,
--     60 ngày gần nhất, kèm ghi chú để báo cáo dễ đọc.
INSERT INTO NHATKYKHO (MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau, NguonPhatSinh, MaNVThucHien, GhiChu, NgayGhi)
SELECT 'CN' || LPAD(((i % 10) + 1)::text, 3, '0'),
       'NL' || LPAD(((i % 35) + 1)::text, 3, '0'),
       CASE WHEN i % 2 = 0 THEN 'Adjustment' ELSE 'Wastage' END,
       sl.qty,
       sl.truoc,
       GREATEST(sl.truoc - sl.qty, 0),
       'KIEMKHO',
       'NV' || LPAD(((i % 40) + 1)::text, 3, '0'),
       CASE WHEN i % 2 = 0 THEN 'Điều chỉnh sau kiểm kho định kỳ'
            ELSE 'Hao hụt/hư hỏng trong bảo quản' END,
       NOW() - (floor(random() * 60)) * interval '1 day'
FROM generate_series(1, 200) i
CROSS JOIN LATERAL (
  SELECT (floor(random() * 70) + 10)::numeric  AS qty,
         (floor(random() * 500) + 300)::numeric AS truoc
) sl;

-- 8. Phân công ca (300 dòng, 30 ngày gần nhất, MÃ ĐÚNG)
INSERT INTO PHANCONG (MaPC, MaNV, MaCN, MaCL, NgayPhanCong, TrangThai)
SELECT 'PCG' || LPAD(g.rn::text, 6, '0'),
       g.manv, g.macn, g.macl, g.ngay,
       (ARRAY['Scheduled','Done','Done','Absent'])[floor(random() * 4) + 1]
FROM (
  SELECT row_number() OVER () AS rn, manv, macn, macl, ngay
  FROM (
    SELECT DISTINCT
           'NV' || LPAD((floor(random() * 40) + 1)::text, 3, '0') AS manv,
           'CN' || LPAD((floor(random() * 10) + 1)::text, 3, '0') AS macn,
           'CL' || LPAD((floor(random() * 3) + 1)::text, 3, '0') AS macl,
           (CURRENT_DATE - (floor(random() * 30))::int) AS ngay
    FROM generate_series(1, 600) i
  ) u
  LIMIT 300
) g
ON CONFLICT (MaPC) DO NOTHING;

-- 8b. Phân công ca ĐÃ LÀM ('Done') cho NV001–NV040 — để dashboard/báo cáo LƯƠNG có số.
--     Mỗi nhân viên gắn 1 chi nhánh cố định (round-robin đủ 10 CN) + 15 ca 'Done',
--     ngày rải ~28 ngày gần nhất -> tháng hiện tại có dữ liệu lương ở mọi chi nhánh.
--     Mã PCD... riêng biệt nên không đụng block 8 ở trên.
INSERT INTO PHANCONG (MaPC, MaNV, MaCN, MaCL, NgayPhanCong, TrangThai)
SELECT 'PCD' || LPAD(((e - 1) * 15 + k)::text, 6, '0'),
       'NV' || LPAD(e::text, 3, '0'),
       'CN' || LPAD(((e % 10) + 1)::text, 3, '0'),
       'CL' || LPAD(((k % 3) + 1)::text, 3, '0'),
       CURRENT_DATE - ((k - 1) * 2),
       'Done'
FROM generate_series(1, 40) e
CROSS JOIN generate_series(1, 15) k
ON CONFLICT (MaPC) DO NOTHING;

-- ============================================================
-- KẾT THÚC: bật lại trigger/FK + làm mới báo cáo
-- ============================================================
SET session_replication_role = 'origin';

REFRESH MATERIALIZED VIEW mv_doanhthu_ngay;
REFRESH MATERIALIZED VIEW mv_top_sanpham;
