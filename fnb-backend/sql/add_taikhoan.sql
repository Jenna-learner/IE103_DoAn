-- ============================================================
-- BẢNG BỔ SUNG: TAIKHOAN (Tài khoản đăng nhập)
-- Chạy 1 lần sau khi đã có schema chính từ DB production/demo.
-- Bảng này liên kết NHANVIEN với thông tin đăng nhập ứng dụng.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS TAIKHOAN (
    MaTK        SERIAL        PRIMARY KEY,
    MaNV        VARCHAR(20)   UNIQUE REFERENCES NHANVIEN(MaNV) ON DELETE CASCADE,
    TenDangNhap VARCHAR(100)  UNIQUE NOT NULL,
    MatKhau     VARCHAR(255)  NOT NULL,          -- bcrypt hash
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

-- Tài khoản admin mặc định: admin@fnbchain.com / admin@123
INSERT INTO TAIKHOAN (MaNV, TenDangNhap, MatKhau, VaiTro)
SELECT
    'NV001',
    'admin@fnbchain.com',
    crypt('admin@123', gen_salt('bf')),
    'admin'
WHERE EXISTS (SELECT 1 FROM NHANVIEN WHERE MaNV = 'NV001')
ON CONFLICT (MaNV) DO UPDATE
SET
    TenDangNhap = EXCLUDED.TenDangNhap,
    MatKhau = EXCLUDED.MatKhau,
    VaiTro = EXCLUDED.VaiTro,
    IsActive = TRUE;

-- Lệnh chạy trên psql:
-- psql -h <zerotier-db-ip> -U postgres -d fnb_chain_db -f sql/add_taikhoan.sql
