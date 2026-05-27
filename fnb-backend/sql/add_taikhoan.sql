-- ============================================================
-- BẢNG BỔ SUNG: TAIKHOAN (Tài khoản đăng nhập)
-- Chạy 1 lần sau khi đã có schema chính từ 01_schema_ddl.sql
-- Lý do: Schema gốc (NHANVIEN) không có trường mật khẩu.
-- Bảng này liên kết NHANVIEN với thông tin đăng nhập ứng dụng.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAIKHOAN (
    MaTK        SERIAL        PRIMARY KEY,
    MaNV        VARCHAR(20)   UNIQUE REFERENCES NHANVIEN(MaNV) ON DELETE CASCADE,
    TenDangNhap VARCHAR(100)  UNIQUE NOT NULL,
    MatKhau     VARCHAR(255)  NOT NULL,          -- bcrypt hash
    VaiTro      VARCHAR(30)   NOT NULL
                CHECK (VaiTro IN ('admin', 'quan_ly_chinhanh', 'thu_ngan', 'kho')),
    -- Vai trò map với RBAC của DB:
    --   admin              → Toàn quyền hệ thống
    --   quan_ly_chinhanh   → Quản lý chi nhánh
    --   thu_ngan           → Thu ngân tại quầy POS
    --   kho                → Nhân viên kho vận
    IsActive    BOOLEAN       DEFAULT TRUE,
    CreatedAt   TIMESTAMPTZ   DEFAULT NOW()
);

-- Tài khoản admin mặc định (MatKhau: Admin@123)
-- Hash bcrypt của "Admin@123":
INSERT INTO TAIKHOAN (MaNV, TenDangNhap, MatKhau, VaiTro)
SELECT 'NV001', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'
WHERE EXISTS (SELECT 1 FROM NHANVIEN WHERE MaNV = 'NV001')
ON CONFLICT DO NOTHING;

-- Lệnh chạy trên psql:
-- psql -h 171.249.255.75 -U postgres -d fnb_chain_db -f sql/add_taikhoan.sql
