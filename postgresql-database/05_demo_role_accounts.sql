-- Demo accounts seed bổ sung cho từng role
-- Không thay đổi schema setup hiện có. Chạy sau 01/02/03 và sau khi đã có CHINHANH/BOPHAN.

BEGIN;

INSERT INTO BOPHAN (MaBP, TenBP, MoTa) 
VALUES ('BP005', 'Ban Giám Đốc & Admin', 'Bộ phận quản trị hệ thống cấp cao toàn chuỗi')
ON CONFLICT (MaBP) DO NOTHING;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin và giám đốc vận hành không gắn chi nhánh cố định
DELETE FROM NHANVIEN_CHINHANH WHERE MaNV IN ('NV001', 'NV002');

INSERT INTO NHANVIEN (MaNV, HoTen, MaBP, SDT, Email, DonGiaCa, TrangThai) VALUES
('AD001', 'Admin Demo 1', 'BP005', '0911000001', 'admin1@fnbchain.com', 25000000, 'Active'),
('AD002', 'Admin Demo 2', 'BP005', '0911000002', 'admin2@fnbchain.com', 25000000, 'Active'),
('AD003', 'Admin Demo 3', 'BP005', '0911000003', 'admin3@fnbchain.com', 25000000, 'Active'),
('AD004', 'Admin Demo 4', 'BP005', '0911000004', 'admin4@fnbchain.com', 25000000, 'Active'),
('AD005', 'Admin Demo 5', 'BP005', '0911000005', 'admin5@fnbchain.com', 25000000, 'Active'),
('OP001', 'Ops Demo 1', 'BP001', '0912000001', 'ops1@fnbchain.com', 22000000, 'Active'),
('OP002', 'Ops Demo 2', 'BP001', '0912000002', 'ops2@fnbchain.com', 22000000, 'Active'),
('OP003', 'Ops Demo 3', 'BP001', '0912000003', 'ops3@fnbchain.com', 22000000, 'Active'),
('OP004', 'Ops Demo 4', 'BP001', '0912000004', 'ops4@fnbchain.com', 22000000, 'Active'),
('OP005', 'Ops Demo 5', 'BP001', '0912000005', 'ops5@fnbchain.com', 22000000, 'Active'),
('BM001', 'Branch Manager 1', 'BP001', '0913000001', 'manager1@fnbchain.com', 18000000, 'Active'),
('BM002', 'Branch Manager 2', 'BP001', '0913000002', 'manager2@fnbchain.com', 18000000, 'Active'),
('BM003', 'Branch Manager 3', 'BP001', '0913000003', 'manager3@fnbchain.com', 18000000, 'Active'),
('BM004', 'Branch Manager 4', 'BP001', '0913000004', 'manager4@fnbchain.com', 18000000, 'Active'),
('BM005', 'Branch Manager 5', 'BP001', '0913000005', 'manager5@fnbchain.com', 18000000, 'Active'),
('CA001', 'Cashier Demo 1', 'BP002', '0914000001', 'cashier1@fnbchain.com', 9000000, 'Active'),
('CA002', 'Cashier Demo 2', 'BP002', '0914000002', 'cashier2@fnbchain.com', 9000000, 'Active'),
('CA003', 'Cashier Demo 3', 'BP002', '0914000003', 'cashier3@fnbchain.com', 9000000, 'Active'),
('CA004', 'Cashier Demo 4', 'BP002', '0914000004', 'cashier4@fnbchain.com', 9000000, 'Active'),
('CA005', 'Cashier Demo 5', 'BP002', '0914000005', 'cashier5@fnbchain.com', 9000000, 'Active'),
('WH001', 'Warehouse Demo 1', 'BP003', '0915000001', 'warehouse1@fnbchain.com', 9500000, 'Active'),
('WH002', 'Warehouse Demo 2', 'BP003', '0915000002', 'warehouse2@fnbchain.com', 9500000, 'Active'),
('WH003', 'Warehouse Demo 3', 'BP003', '0915000003', 'warehouse3@fnbchain.com', 9500000, 'Active'),
('WH004', 'Warehouse Demo 4', 'BP003', '0915000004', 'warehouse4@fnbchain.com', 9500000, 'Active'),
('WH005', 'Warehouse Demo 5', 'BP003', '0915000005', 'warehouse5@fnbchain.com', 9500000, 'Active')
ON CONFLICT (MaNV) DO UPDATE
SET HoTen = EXCLUDED.HoTen,
    MaBP = EXCLUDED.MaBP,
    SDT = EXCLUDED.SDT,
    Email = EXCLUDED.Email,
    DonGiaCa = EXCLUDED.DonGiaCa,
    TrangThai = 'Active';

DELETE FROM NHANVIEN_CHINHANH WHERE MaNV IN (
'AD001','AD002','AD003','AD004','AD005',
'OP001','OP002','OP003','OP004','OP005',
'BM001','BM002','BM003','BM004','BM005',
'CA001','CA002','CA003','CA004','CA005',
'WH001','WH002','WH003','WH004','WH005');

INSERT INTO NHANVIEN_CHINHANH (MaNV, MaCN, VaiTroTaiCN) VALUES
('BM001', 'CN001', 'Manager'),
('BM002', 'CN002', 'Manager'),
('BM003', 'CN003', 'Manager'),
('BM004', 'CN001', 'Manager'),
('BM005', 'CN002', 'Manager'),
('CA001', 'CN001', 'Cashier'),
('CA002', 'CN002', 'Cashier'),
('CA003', 'CN003', 'Cashier'),
('CA004', 'CN001', 'Cashier'),
('CA005', 'CN002', 'Cashier'),
('WH001', 'CN001', 'Warehouse'),
('WH002', 'CN002', 'Warehouse'),
('WH003', 'CN003', 'Warehouse'),
('WH004', 'CN001', 'Warehouse'),
('WH005', 'CN002', 'Warehouse');

INSERT INTO TAIKHOAN (MaNV, TenDangNhap, MatKhau, VaiTro, IsActive) VALUES
('AD001', 'admin1@fnbchain.com', crypt('admin123', gen_salt('bf')), 'admin', TRUE),
('AD002', 'admin2@fnbchain.com', crypt('admin123', gen_salt('bf')), 'admin', TRUE),
('AD003', 'admin3@fnbchain.com', crypt('admin123', gen_salt('bf')), 'admin', TRUE),
('AD004', 'admin4@fnbchain.com', crypt('admin123', gen_salt('bf')), 'admin', TRUE),
('AD005', 'admin5@fnbchain.com', crypt('admin123', gen_salt('bf')), 'admin', TRUE),
('OP001', 'ops1@fnbchain.com', crypt('ops123', gen_salt('bf')), 'giam_doc_van_hanh', TRUE),
('OP002', 'ops2@fnbchain.com', crypt('ops123', gen_salt('bf')), 'giam_doc_van_hanh', TRUE),
('OP003', 'ops3@fnbchain.com', crypt('ops123', gen_salt('bf')), 'giam_doc_van_hanh', TRUE),
('OP004', 'ops4@fnbchain.com', crypt('ops123', gen_salt('bf')), 'giam_doc_van_hanh', TRUE),
('OP005', 'ops5@fnbchain.com', crypt('ops123', gen_salt('bf')), 'giam_doc_van_hanh', TRUE),
('BM001', 'manager1@fnbchain.com', crypt('manager123', gen_salt('bf')), 'quan_ly_chinhanh', TRUE),
('BM002', 'manager2@fnbchain.com', crypt('manager123', gen_salt('bf')), 'quan_ly_chinhanh', TRUE),
('BM003', 'manager3@fnbchain.com', crypt('manager123', gen_salt('bf')), 'quan_ly_chinhanh', TRUE),
('BM004', 'manager4@fnbchain.com', crypt('manager123', gen_salt('bf')), 'quan_ly_chinhanh', TRUE),
('BM005', 'manager5@fnbchain.com', crypt('manager123', gen_salt('bf')), 'quan_ly_chinhanh', TRUE),
('CA001', 'cashier1@fnbchain.com', crypt('cash123', gen_salt('bf')), 'thu_ngan', TRUE),
('CA002', 'cashier2@fnbchain.com', crypt('cash123', gen_salt('bf')), 'thu_ngan', TRUE),
('CA003', 'cashier3@fnbchain.com', crypt('cash123', gen_salt('bf')), 'thu_ngan', TRUE),
('CA004', 'cashier4@fnbchain.com', crypt('cash123', gen_salt('bf')), 'thu_ngan', TRUE),
('CA005', 'cashier5@fnbchain.com', crypt('cash123', gen_salt('bf')), 'thu_ngan', TRUE),
('WH001', 'warehouse1@fnbchain.com', crypt('kho123', gen_salt('bf')), 'kho', TRUE),
('WH002', 'warehouse2@fnbchain.com', crypt('kho123', gen_salt('bf')), 'kho', TRUE),
('WH003', 'warehouse3@fnbchain.com', crypt('kho123', gen_salt('bf')), 'kho', TRUE),
('WH004', 'warehouse4@fnbchain.com', crypt('kho123', gen_salt('bf')), 'kho', TRUE),
('WH005', 'warehouse5@fnbchain.com', crypt('kho123', gen_salt('bf')), 'kho', TRUE)
ON CONFLICT (MaNV) DO UPDATE
SET TenDangNhap = EXCLUDED.TenDangNhap,
    MatKhau = EXCLUDED.MatKhau,
    VaiTro = EXCLUDED.VaiTro,
    IsActive = TRUE;

COMMIT;