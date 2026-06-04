-- ============================================================
-- HỆ THỐNG QUẢN LÝ CHUỖI FnB - IE103
-- File: 03_security_roles.sql
-- Mô tả: An toàn thông tin - Xác thực, Phân quyền,
--        Import/Export, Backup/Restore
-- ============================================================

-- ============================================================
-- PHẦN 1: TẠO ROLES (Vai trò)
-- ============================================================

-- Role cơ sở (không đăng nhập trực tiếp)
-- Sử dụng khối DO để kiểm tra xem role đã tồn tại chưa nhằm tránh phát sinh lỗi ERROR
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_admin') THEN CREATE ROLE role_admin; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_hq_manager') THEN CREATE ROLE role_hq_manager; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_branch_manager') THEN CREATE ROLE role_branch_manager; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_cashier') THEN CREATE ROLE role_cashier; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_warehouse_staff') THEN CREATE ROLE role_warehouse_staff; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_hr_staff') THEN CREATE ROLE role_hr_staff; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'role_readonly') THEN CREATE ROLE role_readonly; END IF;
END $$;

-- ============================================================
-- PHẦN 2: PHÂN QUYỀN (GRANT/REVOKE)
-- ============================================================

-- 2.1 role_readonly: chỉ SELECT trên views và materialized views
GRANT SELECT ON v_BangLuongNhanVien  TO role_readonly;
GRANT SELECT ON v_CanhBaoTonKho      TO role_readonly;
GRANT SELECT ON v_HoaDonChiTiet      TO role_readonly;
GRANT SELECT ON v_TongHopTaiChinh    TO role_readonly;
GRANT SELECT ON mv_doanhthu_ngay     TO role_readonly;
GRANT SELECT ON mv_top_sanpham       TO role_readonly;

-- 2.2 role_cashier: bán hàng tại quầy
GRANT SELECT ON SANPHAM, LOAISANPHAM    TO role_cashier;
GRANT SELECT ON KHACHHANG               TO role_cashier;
GRANT SELECT, INSERT, UPDATE ON HOADON  TO role_cashier;
GRANT SELECT, INSERT, UPDATE, DELETE ON CHITIET_HOADON TO role_cashier;
GRANT SELECT, INSERT ON THANHTOAN       TO role_cashier;
GRANT SELECT ON CHINHANH                TO role_cashier;
GRANT SELECT ON NHANVIEN                TO role_cashier;
GRANT SELECT ON CALAM, PHANCONG         TO role_cashier;
GRANT SELECT ON v_HoaDonChiTiet         TO role_cashier;

-- 2.3 role_warehouse_staff: quản lý kho
GRANT SELECT ON NGUYENLIEU, TONKHO_CHINHANH, NHATKYKHO TO role_warehouse_staff;
GRANT SELECT, INSERT, UPDATE ON PHIEUNHAP               TO role_warehouse_staff;
GRANT SELECT, INSERT, UPDATE, DELETE ON CHITIET_PHIEUNHAP TO role_warehouse_staff;
GRANT SELECT ON v_CanhBaoTonKho                         TO role_warehouse_staff;
GRANT SELECT ON NHACUNGCAP                              TO role_warehouse_staff;
GRANT SELECT ON CALAM, PHANCONG, NHANVIEN              TO role_warehouse_staff;

-- 2.4 role_hr_staff: quản lý nhân sự
GRANT SELECT ON NHANVIEN, BOPHAN, CALAM, PHANCONG, NHANVIEN_CHINHANH TO role_hr_staff;
GRANT INSERT, UPDATE ON NHANVIEN, PHANCONG, NHANVIEN_CHINHANH         TO role_hr_staff;
GRANT SELECT ON v_BangLuongNhanVien                                    TO role_hr_staff;
GRANT SELECT, INSERT, UPDATE ON TAIKHOAN TO role_hr_staff;
GRANT USAGE, SELECT ON SEQUENCE taikhoan_matk_seq TO role_hr_staff; -- Quyền tăng ID tự động cho tài khoản mới

-- 2.5 role_branch_manager: quản lý chi nhánh
GRANT role_cashier           TO role_branch_manager;
GRANT role_warehouse_staff   TO role_branch_manager;
GRANT role_hr_staff          TO role_branch_manager;
GRANT SELECT, INSERT, UPDATE ON PHIEUCHI TO role_branch_manager;
GRANT SELECT ON mv_doanhthu_ngay, mv_top_sanpham TO role_branch_manager;
GRANT SELECT ON v_TongHopTaiChinh  TO role_branch_manager;
GRANT SELECT ON TAIKHOAN TO role_branch_manager;

-- 2.6 role_hq_manager: quản lý tổng (toàn chuỗi)
GRANT role_branch_manager TO role_hq_manager;
GRANT SELECT, INSERT, UPDATE ON CHINHANH     TO role_hq_manager;
GRANT SELECT, INSERT, UPDATE ON NHACUNGCAP   TO role_hq_manager;
GRANT SELECT, INSERT, UPDATE ON SANPHAM, LOAISANPHAM, CONGTHUC TO role_hq_manager;
GRANT SELECT, INSERT, UPDATE ON NGUYENLIEU   TO role_hq_manager;
GRANT SELECT, UPDATE ON TAIKHOAN TO role_hq_manager;

-- [FIXED] Sửa đổi cú pháp chỉ định đích danh Materialized View thông qua từ khoá TABLE chuẩn PostgreSQL
GRANT ALL PRIVILEGES ON TABLE mv_doanhthu_ngay, mv_top_sanpham TO role_hq_manager;

-- 2.7 role_admin: toàn quyền
GRANT ALL PRIVILEGES ON ALL TABLES     IN SCHEMA public TO role_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES  IN SCHEMA public TO role_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS  IN SCHEMA public TO role_admin;
GRANT ALL PRIVILEGES ON ALL PROCEDURES IN SCHEMA public TO role_admin;

-- ============================================================
-- PHẦN 3: TẠO USER và GÁN ROLE
-- ============================================================

-- Tạo user thực tế sử dụng khối DO để bỏ qua nếu user đã tồn tại sẵn trong hệ thống
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_admin') THEN CREATE USER app_admin WITH PASSWORD 'Admin@Str0ng!2026' VALID UNTIL '2027-01-01'; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_cashier_user') THEN CREATE USER app_cashier_user WITH PASSWORD 'Cash!er2026' VALID UNTIL '2027-01-01'; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_warehouse_user') THEN CREATE USER app_warehouse_user WITH PASSWORD 'War3house2026!' VALID UNTIL '2027-01-01'; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_hr_user') THEN CREATE USER app_hr_user WITH PASSWORD 'HR_Staff@2026' VALID UNTIL '2027-01-01'; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_manager_user') THEN CREATE USER app_manager_user WITH PASSWORD 'Mgr@Br4nch2026' VALID UNTIL '2027-01-01'; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_hq_user') THEN CREATE USER app_hq_user WITH PASSWORD 'HQ_Mgr!2026' VALID UNTIL '2027-01-01'; END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_readonly_user') THEN CREATE USER app_readonly_user WITH PASSWORD 'Read0nly@2026' VALID UNTIL '2027-01-01'; END IF;
END $$;

-- Gán role cho user
GRANT role_admin           TO app_admin;
GRANT role_cashier         TO app_cashier_user;
GRANT role_warehouse_staff TO app_warehouse_user;
GRANT role_hr_staff        TO app_hr_user;
GRANT role_branch_manager  TO app_manager_user;
GRANT role_hq_manager      TO app_hq_user;
GRANT role_readonly        TO app_readonly_user;

-- ============================================================
-- PHẦN 4: ROW LEVEL SECURITY (RLS) theo Chi Nhánh
-- ============================================================

-- Bật RLS trên các bảng nhạy cảm theo chi nhánh
ALTER TABLE HOADON              ENABLE ROW LEVEL SECURITY;
ALTER TABLE PHIEUNHAP           ENABLE ROW LEVEL SECURITY;
ALTER TABLE PHIEUCHI            ENABLE ROW LEVEL SECURITY;
ALTER TABLE TONKHO_CHINHANH     ENABLE ROW LEVEL SECURITY;
ALTER TABLE NHATKYKHO           ENABLE ROW LEVEL SECURITY;
ALTER TABLE PHANCONG            ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAIKHOAN 			ENABLE ROW LEVEL SECURITY;

-- Hàm hỗ trợ: lấy danh sách MaCN của user hiện tại
CREATE OR REPLACE FUNCTION fn_get_current_user_branches()
RETURNS TABLE (macn VARCHAR(20))
LANGUAGE sql STABLE AS $$
    SELECT MaCN FROM NHANVIEN_CHINHANH
    WHERE MaNV = current_setting('app.current_employee_id', true)
      AND (DenNgay IS NULL OR DenNgay >= CURRENT_DATE);
$$;

-- Policy: Branch Manager chỉ thấy dữ liệu chi nhánh của mình
-- Xoá policy cũ trước nếu có để tránh lỗi trùng lặp khi chạy lại file
DROP POLICY IF EXISTS policy_hoadon_branch ON HOADON;
CREATE POLICY policy_hoadon_branch ON HOADON
    USING (
        pg_has_role(current_user, 'role_admin', 'MEMBER')
        OR MaCN IN (SELECT macn FROM fn_get_current_user_branches())
    );

DROP POLICY IF EXISTS policy_phieunhap_branch ON PHIEUNHAP;
CREATE POLICY policy_phieunhap_branch ON PHIEUNHAP
    USING (
        pg_has_role(current_user, 'role_admin', 'MEMBER')
        OR MaCN IN (SELECT macn FROM fn_get_current_user_branches())
    );

DROP POLICY IF EXISTS policy_tonkho_branch ON TONKHO_CHINHANH;
CREATE POLICY policy_tonkho_branch ON TONKHO_CHINHANH
    USING (
        pg_has_role(current_user, 'role_admin', 'MEMBER')
        OR MaCN IN (SELECT macn FROM fn_get_current_user_branches())
    );

-- Tạo Policy cho bảng TAIKHOAN
DROP POLICY IF EXISTS policy_taikhoan_security ON TAIKHOAN;
CREATE POLICY policy_taikhoan_security ON TAIKHOAN
    USING (
        -- 1. Admin được xem toàn bộ
        pg_has_role(current_user, 'role_admin', 'MEMBER')
        -- 2. Quản lý tổng (HQ) hoặc Nhân sự (HR) được xem toàn bộ tài khoản để quản lý
        OR pg_has_role(current_user, 'role_hq_manager', 'MEMBER')
        OR pg_has_role(current_user, 'role_hr_staff', 'MEMBER')
        -- 3. Chính nhân viên đó ĐƯỢC XEM tài khoản của chính mình (để đổi mật khẩu, xem profile)
        OR MaNV = current_setting('app.current_employee_id', true)
        -- 4. Branch Manager chỉ xem được tài khoản của nhân viên thuộc chi nhánh mình quản lý
        OR MaNV IN (
            SELECT MaNV FROM NHANVIEN_CHINHANH 
            WHERE MaCN IN (SELECT macn FROM fn_get_current_user_branches())
        )
    );

-- ============================================================
-- PHẦN 5: IMPORT / EXPORT DỮ LIỆU
-- ============================================================

-- 5.1 Export bảng ra CSV (chạy trên psql hoặc pgAdmin)

-- Export danh sách sản phẩm
-- \COPY SANPHAM TO '/backup/export_sanpham.csv' WITH (FORMAT CSV, HEADER, ENCODING 'UTF8');

-- Export hóa đơn tháng hiện tại
-- \COPY (
--     SELECT * FROM HOADON
--     WHERE DATE_TRUNC('month', NgayLap) = DATE_TRUNC('month', NOW())
-- ) TO '/backup/hoadon_thang_hien_tai.csv' WITH (FORMAT CSV, HEADER, ENCODING 'UTF8');

-- Export báo cáo doanh thu tổng hợp
-- \COPY (SELECT * FROM mv_doanhthu_ngay ORDER BY MaCN, Ngay)
--     TO '/backup/doanhthu_summary.csv' WITH (FORMAT CSV, HEADER, ENCODING 'UTF8');

-- 5.2 Import dữ liệu mẫu từ CSV
-- \COPY LOAISANPHAM(MaLoai, TenLoai, MoTa)
--     FROM '/data/loaisanpham.csv' WITH (FORMAT CSV, HEADER, ENCODING 'UTF8');

-- 5.3 Export toàn bộ schema (dùng pg_dump trên terminal)
-- pg_dump -U postgres -d fnb_chain_db --schema-only -f /backup/schema_only.sql
-- pg_dump -U postgres -d fnb_chain_db --data-only  -f /backup/data_only.sql
-- pg_dump -U postgres -d fnb_chain_db -F c -f /backup/full_backup.dump  (custom format, nén)

-- ============================================================
-- PHẦN 6: BACKUP & RESTORE (Script hướng dẫn)
-- ============================================================

/*
===== BACKUP =====

1. Full backup (custom format, có thể restore từng bảng):
   pg_dump -U postgres -d fnb_chain_db -F c -b -v \
       -f "/backup/fnb_chain_$(date +%Y%m%d_%H%M).dump"

2. Plain SQL backup:
   pg_dump -U postgres -d fnb_chain_db -F p -f "/backup/fnb_chain_plain.sql"

3. Chỉ backup schema:
   pg_dump -U postgres -d fnb_chain_db --schema-only \
       -f "/backup/schema_$(date +%Y%m%d).sql"

4. Chỉ backup data (không kèm DDL):
   pg_dump -U postgres -d fnb_chain_db --data-only \
       -f "/backup/data_$(date +%Y%m%d).sql"

===== RESTORE =====

1. Restore từ custom format:
   pg_restore -U postgres -d fnb_chain_db -v \
       "/backup/fnb_chain_20260522_2300.dump"

2. Restore từ plain SQL:
   psql -U postgres -d fnb_chain_db -f "/backup/fnb_chain_plain.sql"

3. Restore 1 bảng cụ thể từ custom format:
   pg_restore -U postgres -d fnb_chain_db -t HOADON \
       "/backup/fnb_chain_20260522_2300.dump"

===== CHIẾN LƯỢC BACKUP ĐỀ XUẤT =====
- Full backup: mỗi đêm lúc 02:00 AM
- Backup schema: mỗi khi thay đổi cấu trúc
- Lưu 30 ngày backup gần nhất
- Thử restore mỗi tháng để kiểm tra tính hợp lệ
- Lưu backup tại 2 địa điểm khác nhau (local + cloud)

Script cron tự động (Linux):
0 2 * * * pg_dump -U postgres -d fnb_chain_db -F c \
    -f "/backup/fnb_$(date +\%Y\%m\%d).dump" && \
    find /backup -name "fnb_*.dump" -mtime +30 -delete
*/

-- ============================================================
-- PHẦN 7: REFRESH MATERIALIZED VIEWS (Job hàng ngày)
-- ============================================================

-- Procedure để refresh tất cả MV
CREATE OR REPLACE PROCEDURE sp_RefreshAllMaterializedViews()
LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doanhthu_ngay;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_sanpham;
    RAISE NOTICE 'Đã refresh tất cả Materialized Views lúc %', NOW();
END;
$$;

-- Gọi: CALL sp_RefreshAllMaterializedViews();
-- Hoặc lên lịch với pg_cron: SELECT cron.schedule('0 1 * * *', 'CALL sp_RefreshAllMaterializedViews()');
