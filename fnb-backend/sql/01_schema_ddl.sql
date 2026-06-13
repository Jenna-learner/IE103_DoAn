-- ============================================================
-- HỆ THỐNG QUẢN LÝ CHUỖI FnB - IE103
-- File: 01_schema_ddl.sql
-- Mô tả: DDL đầy đủ - Tạo bảng, Khoá chính, Khoá ngoại,
--        Ràng buộc (Constraints), Index
-- Schema tổng hợp từ tài liệu gốc + feedback cải tiến (multi-branch)
-- ============================================================

-- Xoá schema cũ nếu có (thứ tự đảo ngược theo dependency)
DROP TABLE IF EXISTS TAIKHOAN          CASCADE;
DROP TABLE IF EXISTS CONGTHUC          CASCADE;
DROP TABLE IF EXISTS NHATKYKHO         CASCADE;
DROP TABLE IF EXISTS CHITIET_PHIEUNHAP CASCADE;
DROP TABLE IF EXISTS PHIEUNHAP         CASCADE;
DROP TABLE IF EXISTS CHITIET_HOADON    CASCADE;
DROP TABLE IF EXISTS THANHTOAN         CASCADE;
DROP TABLE IF EXISTS HOADON            CASCADE;
DROP TABLE IF EXISTS PHANCONG          CASCADE;
DROP TABLE IF EXISTS NHANVIEN_CHINHANH CASCADE;
DROP TABLE IF EXISTS PHIEUCHI          CASCADE;
DROP TABLE IF EXISTS TONKHO_CHINHANH   CASCADE;
DROP TABLE IF EXISTS KHACHHANG         CASCADE;
DROP TABLE IF EXISTS NHANVIEN          CASCADE;
DROP TABLE IF EXISTS CALAM             CASCADE;
DROP TABLE IF EXISTS BOPHAN            CASCADE;
DROP TABLE IF EXISTS SANPHAM           CASCADE;
DROP TABLE IF EXISTS LOAISANPHAM       CASCADE;
DROP TABLE IF EXISTS NGUYENLIEU        CASCADE;
DROP TABLE IF EXISTS NHACUNGCAP        CASCADE;
DROP TABLE IF EXISTS CHINHANH          CASCADE;

-- ============================================================
-- VÁ LỖI ĐỒNG BỘ: HÀM LPAD CHO KIỂU BIGINT
-- ============================================================
CREATE OR REPLACE FUNCTION lpad(string_to_pad bigint, length integer, pad_string text)
RETURNS text AS $$
BEGIN
    RETURN lpad(string_to_pad::text, length, pad_string);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Kích hoạt thư viện mã hóa mật khẩu Bcrypt hệ thống
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- DOMAIN 1: CHI NHÁNH (Branch)
-- ============================================================

CREATE TABLE CHINHANH (
    MaCN        VARCHAR(20)  PRIMARY KEY,
    TenCN       VARCHAR(100) NOT NULL,
    DiaChi      TEXT         NOT NULL,
    SDT         VARCHAR(15)  UNIQUE NOT NULL,
    Email       VARCHAR(100) UNIQUE,
    TrangThai   VARCHAR(20)  NOT NULL DEFAULT 'Active'
                             CHECK (TrangThai IN ('Active', 'Inactive')),
    CreatedAt   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UpdatedAt   TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  CHINHANH          IS 'Danh sách các chi nhánh trong chuỗi FnB';
COMMENT ON COLUMN CHINHANH.MaCN     IS 'Mã định danh chi nhánh (VD: CN001)';
COMMENT ON COLUMN CHINHANH.TenCN    IS 'Tên chi nhánh';
COMMENT ON COLUMN CHINHANH.TrangThai IS 'Active: đang hoạt động | Inactive: tạm đóng/đã đóng';

-- ============================================================
-- DOMAIN 6: NHẬN SỰ (HR) - ĐƯỢC ĐƯA LÊN TRƯỚC ĐỂ TRÁNH LỖI PHỤ THUỘC KHOÁ NGOẠI
-- ============================================================

CREATE TABLE BOPHAN (
    MaBP    VARCHAR(20)  PRIMARY KEY,
    TenBP   VARCHAR(50)  NOT NULL UNIQUE,
    MoTa    TEXT
);

COMMENT ON TABLE BOPHAN IS 'Danh mục bộ phận trong tổ chức (Management, Kitchen/Bar, Service, ...)';

CREATE TABLE NHANVIEN (
    MaNV        VARCHAR(20)    PRIMARY KEY,
    HoTen       VARCHAR(100)   NOT NULL,
    NgaySinh    DATE           CHECK (NgaySinh <= CURRENT_DATE - INTERVAL '16 years'),
    SDT         VARCHAR(15)    UNIQUE NOT NULL,
    Email       VARCHAR(100)   UNIQUE,
    DonGiaCa    NUMERIC(15,2)  NOT NULL DEFAULT 0 CHECK (DonGiaCa >= 0), -- VÁ LỖI CHECK CONSTRAINT CHO BACKEND
    TrangThai   VARCHAR(20)    NOT NULL DEFAULT 'Active'
                               CHECK (TrangThai IN ('Active', 'Resigned', 'Suspended')),
    MaBP        VARCHAR(20)    NOT NULL REFERENCES BOPHAN(MaBP)
                               ON DELETE RESTRICT ON UPDATE CASCADE,
    CreatedAt   TIMESTAMP      NOT NULL DEFAULT NOW(),
    UpdatedAt   TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  NHANVIEN          IS 'Hồ sơ nhân viên toàn chuỗi';
COMMENT ON COLUMN NHANVIEN.DonGiaCa IS 'Lương/ca - dùng để tính tổng lương qua Stored Procedure';
COMMENT ON COLUMN NHANVIEN.NgaySinh IS 'CHECK đảm bảo nhân viên >= 16 tuổi';
COMMENT ON COLUMN NHANVIEN.TrangThai IS 'Active: đang làm | Resigned: đã nghỉ | Suspended: tạm đình chỉ';

CREATE INDEX idx_nhanvien_hoten ON NHANVIEN USING BTREE (HoTen);
CREATE INDEX idx_nhanvien_mabp  ON NHANVIEN USING BTREE (MaBP);

CREATE TABLE TAIKHOAN (
    MaTK        SERIAL        PRIMARY KEY,
    MaNV        VARCHAR(20)   NOT NULL UNIQUE,
    TenDangNhap VARCHAR(100)  NOT NULL UNIQUE,
    MatKhau     VARCHAR(255)  NOT NULL,
    VaiTro      VARCHAR(30)   NOT NULL,
    IsActive    BOOLEAN       NOT NULL DEFAULT TRUE,
    CreatedAt   TIMESTAMP     NOT NULL DEFAULT NOW(),
    UpdatedAt   TIMESTAMP     NOT NULL DEFAULT NOW(),
    
    -- Khóa ngoại liên kết sang bảng NHANVIEN
    CONSTRAINT fk_taikhoan_nhanvien 
        FOREIGN KEY (MaNV) REFERENCES NHANVIEN(MaNV) 
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    -- Ràng buộc các phân quyền cố định trong hệ thống FnB
    CONSTRAINT taikhoan_vaitro_check 
        CHECK (VaiTro IN ('admin', 'giam_doc_van_hanh', 'quan_ly_chinhanh', 'thu_ngan', 'kho'))
);

COMMENT ON TABLE  TAIKHOAN             IS 'Bảng lưu trữ thông tin đăng nhập và phân quyền của nhân viên';
COMMENT ON COLUMN TAIKHOAN.MaTK        IS 'Mã tự tăng định danh tài khoản';
COMMENT ON COLUMN TAIKHOAN.MaNV        IS 'Mã nhân viên sở hữu tài khoản (1 nhân viên chỉ có tối đa 1 tài khoản)';
COMMENT ON COLUMN TAIKHOAN.TenDangNhap IS 'Tên đăng nhập (thường dùng Email nhân viên), duy nhất toàn hệ thống';
COMMENT ON COLUMN TAIKHOAN.MatKhau     IS 'Mật khẩu đã được mã hóa (VD: bằng pgcrypto)';
COMMENT ON COLUMN TAIKHOAN.VaiTro      IS 'Phân quyền hệ thống để check điều hướng chức năng';

-- Index hỗ trợ tăng tốc độ truy vấn khi User thực hiện Đăng nhập (Login)
CREATE INDEX idx_taikhoan_login ON TAIKHOAN USING BTREE (TenDangNhap) WHERE IsActive = TRUE;

CREATE TABLE NHANVIEN_CHINHANH (
    MaNV        VARCHAR(20)  NOT NULL REFERENCES NHANVIEN(MaNV) ON DELETE CASCADE,
    MaCN        VARCHAR(20)  NOT NULL REFERENCES CHINHANH(MaCN) ON DELETE RESTRICT,
    TuNgay      DATE         NOT NULL DEFAULT CURRENT_DATE,
    DenNgay     DATE,        -- NULL nghĩa là vẫn đang làm tại chi nhánh này
    VaiTroTaiCN VARCHAR(50)  NOT NULL DEFAULT 'Staff',
    PRIMARY KEY (MaNV, MaCN, TuNgay),
    CHECK (DenNgay IS NULL OR DenNgay > TuNgay)
);

COMMENT ON TABLE  NHANVIEN_CHINHANH           IS 'Lịch sử nhân viên làm việc tại từng chi nhánh';
COMMENT ON COLUMN NHANVIEN_CHINHANH.DenNgay   IS 'NULL = đang công tác tại chi nhánh này';
COMMENT ON COLUMN NHANVIEN_CHINHANH.VaiTroTaiCN IS 'Vai trò: Manager, Cashier, Kitchen, Waiter, ...';

CREATE TABLE CALAM (
    MaCL        VARCHAR(20)  PRIMARY KEY,
    TenCL       VARCHAR(50)  NOT NULL UNIQUE,
    GioBatDau   TIME         NOT NULL,
    GioKetThuc  TIME         NOT NULL,
    TrangThai   VARCHAR(20)  NOT NULL DEFAULT 'Active'
                             CHECK (TrangThai IN ('Active', 'Inactive')),
    CHECK (GioKetThuc > GioBatDau)
);

COMMENT ON TABLE  CALAM             IS 'Danh mục ca làm việc (Morning Shift, Afternoon Shift, Night Shift)';
COMMENT ON COLUMN CALAM.GioBatDau   IS 'Hệ thống giả định ca trong cùng ngày; chưa hỗ trợ ca qua đêm';

CREATE TABLE PHANCONG (
    MaPC         VARCHAR(20)    PRIMARY KEY,
    MaNV         VARCHAR(20)    NOT NULL,
    MaCN         VARCHAR(20)    NOT NULL,
    MaCL         VARCHAR(20)    NOT NULL, 
    NgayPhanCong DATE          NOT NULL,
    TrangThai    VARCHAR(20)    NOT NULL DEFAULT 'Scheduled',
    CreatedAt    TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  PHANCONG         IS 'Phân công ca làm việc theo ngày và chi nhánh';
COMMENT ON COLUMN PHANCONG.TrangThai IS 'Assigned: đã phân | Done: đã làm | Absent: vắng | Cancelled: huỷ';

-- VÁ LỖI SỬA TÊN CỘT ĐỒNG NHẤT: Đổi "Ngay" thành "NgayPhanCong"
CREATE INDEX idx_phancong_manv_ngay ON PHANCONG USING BTREE (MaNV, NgayPhanCong);
CREATE INDEX idx_phancong_macn_ngay ON PHANCONG USING BTREE (MaCN, NgayPhanCong);

-- ============================================================
-- DOMAIN 2: THỰC ĐƠN (Menu)
-- ============================================================

CREATE TABLE LOAISANPHAM (
    MaLoai  VARCHAR(20)  PRIMARY KEY,
    TenLoai VARCHAR(100) NOT NULL UNIQUE,
    MoTa    TEXT
);

COMMENT ON TABLE  LOAISANPHAM         IS 'Danh mục loại sản phẩm (cà phê, trà, bánh, ...)';
COMMENT ON COLUMN LOAISANPHAM.MaLoai  IS 'Mã loại sản phẩm. Độ dài ngắn để tối ưu index';
COMMENT ON COLUMN LOAISANPHAM.TenLoai IS 'Tên loại, unique để tránh trùng danh mục';

CREATE TABLE SANPHAM (
    MaSP            VARCHAR(20)    PRIMARY KEY,
    TenSP           VARCHAR(100)   NOT NULL,
    MoTa            TEXT,
    GiaBanMacDinh   NUMERIC(15,2)  NOT NULL CHECK (GiaBanMacDinh > 0),
    TrangThai       VARCHAR(20)    NOT NULL DEFAULT 'Available'
                                   CHECK (TrangThai IN ('Available', 'OutOfStock', 'Hidden')),
    MaLoai          VARCHAR(20)    NOT NULL
                                   REFERENCES LOAISANPHAM(MaLoai)
                                   ON DELETE RESTRICT ON UPDATE CASCADE,
    CreatedAt       TIMESTAMP      NOT NULL DEFAULT NOW(),
    UpdatedAt       TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  SANPHAM                  IS 'Danh mục sản phẩm / món ăn / thức uống';
COMMENT ON COLUMN SANPHAM.GiaBanMacDinh    IS 'Giá bán mặc định toàn hệ thống; từng chi nhánh có thể ghi đè (BANGGIA_CHINHANH)';
COMMENT ON COLUMN SANPHAM.TrangThai        IS 'Available: đang bán | OutOfStock: hết | Hidden: ẩn/ngừng KD (Soft Delete)';

CREATE INDEX idx_sanpham_tensp ON SANPHAM USING BTREE (TenSP);
CREATE INDEX idx_sanpham_maloai ON SANPHAM USING BTREE (MaLoai);

-- ============================================================
-- DOMAIN 3: NGUYÊN LIỆU & TỒN KHO (Inventory)
-- ============================================================

CREATE TABLE NGUYENLIEU (
    MaNL        VARCHAR(20)  PRIMARY KEY,
    TenNL       VARCHAR(100) NOT NULL,
    DonViTinh   VARCHAR(20)  NOT NULL,   -- g, ml, kg, cái, ...
    TrangThai   VARCHAR(20)  NOT NULL DEFAULT 'Active'
                             CHECK (TrangThai IN ('Active', 'Inactive')),
    CreatedAt   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UpdatedAt   TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  NGUYENLIEU           IS 'Danh mục nguyên liệu toàn hệ thống';
COMMENT ON COLUMN NGUYENLIEU.DonViTinh IS 'Đơn vị tính: g, ml, kg, cái...';
COMMENT ON COLUMN NGUYENLIEU.TrangThai IS 'Active: đang dùng | Inactive: ngừng sử dụng';

CREATE INDEX idx_nguyenlieu_tennl ON NGUYENLIEU USING BTREE (TenNL);

CREATE TABLE TONKHO_CHINHANH (
    MaCN            VARCHAR(20)    NOT NULL REFERENCES CHINHANH(MaCN) ON DELETE RESTRICT,
    MaNL            VARCHAR(20)    NOT NULL REFERENCES NGUYENLIEU(MaNL) ON DELETE RESTRICT,
    SoLuongTon      NUMERIC(12,3)  NOT NULL DEFAULT 0 CHECK (SoLuongTon >= 0),
    TonToiThieu     NUMERIC(12,3)  NOT NULL DEFAULT 0 CHECK (TonToiThieu >= 0),
    GiaNhapGanNhat  NUMERIC(15,2)  CHECK (GiaNhapGanNhat > 0),
    UpdatedAt       TIMESTAMP      NOT NULL DEFAULT NOW(),
    PRIMARY KEY (MaCN, MaNL)
);

COMMENT ON TABLE  TONKHO_CHINHANH               IS 'Tồn kho nguyên liệu theo từng chi nhánh';
COMMENT ON COLUMN TONKHO_CHINHANH.SoLuongTon    IS 'Số lượng tồn hiện tại; tự động cập nhật qua Trigger';
COMMENT ON COLUMN TONKHO_CHINHANH.TonToiThieu   IS 'Ngưỡng cảnh báo nhập hàng';
COMMENT ON COLUMN TONKHO_CHINHANH.GiaNhapGanNhat IS 'Giá nhập gần nhất để tính vốn tồn kho';

CREATE TABLE NHATKYKHO (
    MaLog           BIGSERIAL    PRIMARY KEY,
    MaCN            VARCHAR(20)  NOT NULL REFERENCES CHINHANH(MaCN),
    MaNL            VARCHAR(20)  NOT NULL REFERENCES NGUYENLIEU(MaNL),
    LoaiBienDong    VARCHAR(20)  NOT NULL
                                 CHECK (LoaiBienDong IN (
                                     'Import',        -- Nhập hàng
                                     'Export',        -- Xuất để chế biến (bán hàng)
                                     'Adjustment',    -- Điều chỉnh kiểm kho
                                     'Wastage',       -- Hao hụt/hư hỏng
                                     'TransferOut',   -- Chuyển kho ra
                                     'TransferIn',    -- Chuyển kho vào
                                     'ReverseExport'  -- Đảo bút toán khi huỷ đơn
                                 )),
    SoLuong         NUMERIC(12,3) NOT NULL CHECK (SoLuong > 0),
    SoLuongTruoc    NUMERIC(12,3) NOT NULL CHECK (SoLuongTruoc >= 0),
    SoLuongSau      NUMERIC(12,3) NOT NULL CHECK (SoLuongSau >= 0),
    NguonPhatSinh   VARCHAR(30)  NOT NULL
                                 CHECK (NguonPhatSinh IN (
                                     'PHIEUNHAP', 'HOADON', 'DIEUCHUYEN',
                                     'KIEMKHO', 'MANUAL'
                                 )),
    MaChungTu       VARCHAR(20),   -- MaPN hoặc MaHD hoặc mã chứng từ khác
    MaNVThucHien    VARCHAR(20)  REFERENCES NHANVIEN(MaNV) ON DELETE SET NULL,
    GhiChu          TEXT,
    NgayGhi         TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  NHATKYKHO               IS 'Nhật ký biến động kho - tự động tạo qua Trigger, không chỉnh tay';
COMMENT ON COLUMN NHATKYKHO.SoLuongTruoc IS 'Tồn kho trước khi biến động - phục vụ audit';
COMMENT ON COLUMN NHATKYKHO.SoLuongSau   IS 'Tồn kho sau khi biến động - phục vụ audit';
COMMENT ON COLUMN NHATKYKHO.MaChungTu    IS 'Mã hóa đơn hoặc mã phiếu nhập gây ra biến động';

CREATE INDEX idx_nhatkykho_macn_manl ON NHATKYKHO USING BTREE (MaCN, MaNL);
CREATE INDEX idx_nhatkykho_ngayghi   ON NHATKYKHO USING BTREE (NgayGhi DESC);
CREATE INDEX idx_nhatkykho_machustu  ON NHATKYKHO USING BTREE (MaChungTu) WHERE MaChungTu IS NOT NULL;

-- ============================================================
-- DOMAIN 4: NHẬP HÀNG (Procurement)
-- ============================================================

CREATE TABLE NHACUNGCAP (
    MaNCC       VARCHAR(20)  PRIMARY KEY,
    TenNCC      VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15)  NOT NULL UNIQUE,
    DiaChi      TEXT         NOT NULL,
    Email       VARCHAR(100) UNIQUE,
    TrangThai   VARCHAR(20)  NOT NULL DEFAULT 'Active'
                             CHECK (TrangThai IN ('Active', 'Inactive')),
    CreatedAt   TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE NHACUNGCAP IS 'Danh mục nhà cung cấp nguyên liệu';
CREATE INDEX idx_nhacungcap_tenncc ON NHACUNGCAP USING BTREE (TenNCC);

CREATE TABLE PHIEUNHAP (
    MaPN        VARCHAR(20)    PRIMARY KEY,
    MaCN        VARCHAR(20)    NOT NULL REFERENCES CHINHANH(MaCN) ON DELETE RESTRICT,
    MaNCC       VARCHAR(20)    NOT NULL REFERENCES NHACUNGCAP(MaNCC) ON DELETE RESTRICT,
    MaNVLap     VARCHAR(20)    REFERENCES NHANVIEN(MaNV) ON DELETE SET NULL,
    NgayNhap    TIMESTAMP      NOT NULL DEFAULT NOW(),
    TongTien    NUMERIC(15,2)  NOT NULL DEFAULT 0 CHECK (TongTien >= 0),
    TrangThai   VARCHAR(20)    NOT NULL DEFAULT 'Draft'
                               CHECK (TrangThai IN ('Draft', 'Received', 'Cancelled')),
    GhiChu      TEXT,
    CreatedAt   TIMESTAMP      NOT NULL DEFAULT NOW(),
    UpdatedAt   TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  PHIEUNHAP          IS 'Phiếu nhập hàng nguyên liệu từ nhà cung cấp';
COMMENT ON COLUMN PHIEUNHAP.TrangThai IS 'Draft: đang lập | Received: đã nhận hàng | Cancelled: đã huỷ';
COMMENT ON COLUMN PHIEUNHAP.TongTien  IS 'Tự động tính qua Trigger sau khi cập nhật chi tiết';

CREATE INDEX idx_phieunhap_macn     ON PHIEUNHAP USING BTREE (MaCN);
CREATE INDEX idx_phieunhap_mancc    ON PHIEUNHAP USING BTREE (MaNCC);
CREATE INDEX idx_phieunhap_ngaynhap ON PHIEUNHAP USING BTREE (NgayNhap DESC);

CREATE TABLE CHITIET_PHIEUNHAP (
    MaPN      VARCHAR(20)    NOT NULL REFERENCES PHIEUNHAP(MaPN)
                             ON DELETE CASCADE ON UPDATE CASCADE,
    MaNL      VARCHAR(20)    NOT NULL REFERENCES NGUYENLIEU(MaNL)
                             ON DELETE RESTRICT ON UPDATE CASCADE,
    SoLuong   NUMERIC(12,3)  NOT NULL CHECK (SoLuong > 0),
    DonGia    NUMERIC(15,2)  NOT NULL CHECK (DonGia > 0),
    PRIMARY KEY (MaPN, MaNL)
);

COMMENT ON TABLE  CHITIET_PHIEUNHAP        IS 'Chi tiết nguyên liệu trong phiếu nhập';
COMMENT ON COLUMN CHITIET_PHIEUNHAP.DonGia IS 'Đơn giá nhập tại thời điểm đó để lưu lịch sử';

-- ============================================================
-- DOMAIN 5: BÁN HÀNG & CRM (Sales & CRM)
-- ============================================================

CREATE TABLE KHACHHANG (
    MaKH            VARCHAR(20)  PRIMARY KEY,
    HoTen           VARCHAR(100) NOT NULL,
    SDT             VARCHAR(15)  UNIQUE NOT NULL,
    Email           VARCHAR(100) UNIQUE,
    NgaySinh        DATE,
    DiemTichLuy     INTEGER      NOT NULL DEFAULT 0 CHECK (DiemTichLuy >= 0),
    HangThanhVien   VARCHAR(20)  NOT NULL DEFAULT 'Bronze'
                                 CHECK (HangThanhVien IN ('Bronze', 'Silver', 'Gold', 'Platinum')), 
    TrangThai       VARCHAR(20)  NOT NULL DEFAULT 'Active'
                                 CHECK (TrangThai IN ('Active', 'Inactive')),
    CreatedAt       TIMESTAMP    NOT NULL DEFAULT NOW(),
    UpdatedAt       TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  KHACHHANG                IS 'Khách hàng thành viên (loyalty)';
COMMENT ON COLUMN KHACHHANG.DiemTichLuy    IS 'Tự động cộng qua Stored Procedure khi hóa đơn hoàn tất';
COMMENT ON COLUMN KHACHHANG.HangThanhVien  IS 'Bronze(<5k) Silver(5k-10k) Gold(10k-15k) Platinum(>=15k)';

CREATE INDEX idx_khachhang_sdt   ON KHACHHANG USING BTREE (SDT);
CREATE INDEX idx_khachhang_hoten ON KHACHHANG USING BTREE (HoTen);

CREATE TABLE HOADON (
    MaHD            VARCHAR(20)    PRIMARY KEY,
    MaCN            VARCHAR(20)    NOT NULL REFERENCES CHINHANH(MaCN) ON DELETE RESTRICT,
    MaKH            VARCHAR(20)    REFERENCES KHACHHANG(MaKH) ON DELETE SET NULL,
    MaNV            VARCHAR(20)    NOT NULL REFERENCES NHANVIEN(MaNV) ON DELETE RESTRICT,
    NgayLap         TIMESTAMP      NOT NULL DEFAULT NOW(),
    LoaiDonHang     VARCHAR(20)    NOT NULL DEFAULT 'DineIn'
                                   CHECK (LoaiDonHang IN ('DineIn', 'TakeAway', 'Delivery')),
    TongTienHang    NUMERIC(15,2)  NOT NULL DEFAULT 0 CHECK (TongTienHang >= 0),
    GiamGia         NUMERIC(15,2)  NOT NULL DEFAULT 0 CHECK (GiamGia >= 0),
    TongThanhToan   NUMERIC(15,2)  NOT NULL DEFAULT 0 CHECK (TongThanhToan >= 0),
    TrangThai       VARCHAR(20)    NOT NULL DEFAULT 'Pending'
                                   CHECK (TrangThai IN ('Pending', 'Completed', 'Cancelled')),
    GhiChu          TEXT,
    CreatedAt       TIMESTAMP      NOT NULL DEFAULT NOW(),
    UpdatedAt       TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  HOADON                IS 'Hóa đơn bán hàng';
COMMENT ON COLUMN HOADON.MaKH           IS 'NULL nếu khách vãng lai (chưa đăng ký thành viên)';
COMMENT ON COLUMN HOADON.TongTienHang   IS 'Tổng tiền trước giảm giá - tự động tính qua Trigger';
COMMENT ON COLUMN HOADON.TongThanhToan  IS 'Tổng tiền sau giảm giá = TongTienHang - GiamGia';
COMMENT ON COLUMN HOADON.TrangThai      IS 'Pending: đang mở | Completed: đã thanh toán đủ | Cancelled: đã huỷ';

CREATE INDEX idx_hoadon_macn    ON HOADON USING BTREE (MaCN);
CREATE INDEX idx_hoadon_ngaylap ON HOADON USING BTREE (NgayLap DESC);
CREATE INDEX idx_hoadon_makh    ON HOADON USING BTREE (MaKH) WHERE MaKH IS NOT NULL;
CREATE INDEX idx_hoadon_manv    ON HOADON USING BTREE (MaNV);
CREATE INDEX idx_hoadon_pending ON HOADON USING BTREE (MaCN, NgayLap) WHERE TrangThai = 'Pending';

CREATE TABLE CHITIET_HOADON (
    MaHD                VARCHAR(20)    NOT NULL REFERENCES HOADON(MaHD) ON DELETE CASCADE ON UPDATE CASCADE,
    MaSP                VARCHAR(20)    NOT NULL REFERENCES SANPHAM(MaSP) ON DELETE RESTRICT ON UPDATE CASCADE,
    SoLuong             INTEGER        NOT NULL CHECK (SoLuong > 0),
    GiaBanTaiThoiDiem   NUMERIC(15,2)  NOT NULL CHECK (GiaBanTaiThoiDiem > 0),
    ThanhTien           NUMERIC(15,2)  NOT NULL GENERATED ALWAYS AS (SoLuong * GiaBanTaiThoiDiem) STORED,
    PRIMARY KEY (MaHD, MaSP)
);

COMMENT ON TABLE  CHITIET_HOADON                    IS 'Chi tiết sản phẩm trong hóa đơn';
COMMENT ON COLUMN CHITIET_HOADON.GiaBanTaiThoiDiem  IS 'Lưu giá tại lúc lập bill, tránh sai lệch khi đổi giá sau';
COMMENT ON COLUMN CHITIET_HOADON.ThanhTien           IS 'Cột tính toán tự động: SoLuong * GiaBanTaiThoiDiem';

CREATE INDEX idx_ct_hoadon_masp ON CHITIET_HOADON USING BTREE (MaSP);

CREATE TABLE THANHTOAN (
    MaTT            VARCHAR(20)    PRIMARY KEY,
    MaHD            VARCHAR(20)    NOT NULL REFERENCES HOADON(MaHD) ON DELETE RESTRICT,
    PhuongThuc      VARCHAR(30)    NOT NULL
                                   CHECK (PhuongThuc IN (
                                       'Cash', 'BankTransfer', 'Card', 'EWallet', 'Mixed'
                                   )),
    SoTien          NUMERIC(15,2)  NOT NULL CHECK (SoTien > 0),
    NgayTT          TIMESTAMP      NOT NULL DEFAULT NOW(),
    TrangThai       VARCHAR(20)    NOT NULL DEFAULT 'Processing'
                                   CHECK (TrangThai IN (
                                       'Processing', 'Success', 'Failed', 'Refunded'
                                   )),
    LoaiGiaoDich    VARCHAR(20)    NOT NULL DEFAULT 'Payment'
                                   CHECK (LoaiGiaoDich IN ('Payment', 'Refund')),
    ThongTinChiTiet JSONB,          -- Metadata từ API ngân hàng/ví điện tử
    CreatedAt       TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  THANHTOAN                   IS 'Bản ghi thanh toán; 1 hóa đơn có thể có nhiều dòng (split payment, retry)';
COMMENT ON COLUMN THANHTOAN.ThongTinChiTiet   IS 'JSONB: mã giao dịch ví điện tử, số thẻ masking, mã phản hồi API ngân hàng';
COMMENT ON COLUMN THANHTOAN.LoaiGiaoDich      IS 'Payment: thu tiền | Refund: hoàn tiền';

CREATE INDEX idx_thanhtoan_mahd     ON THANHTOAN USING BTREE (MaHD);
CREATE INDEX idx_thanhtoan_ngaytt   ON THANHTOAN USING BTREE (NgayTT DESC);
CREATE INDEX idx_thanhtoan_success  ON THANHTOAN USING BTREE (MaHD, SoTien) WHERE TrangThai = 'Success';

-- ============================================================
-- DOMAIN 2 (tiếp): CÔNG THỨC SẢN PHẨM
-- ============================================================

CREATE TABLE CONGTHUC (
    MaSP      VARCHAR(20)    NOT NULL REFERENCES SANPHAM(MaSP) ON DELETE CASCADE ON UPDATE CASCADE,
    MaNL      VARCHAR(20)    NOT NULL REFERENCES NGUYENLIEU(MaNL) ON DELETE RESTRICT ON UPDATE CASCADE,
    DinhMuc   NUMERIC(12,3)  NOT NULL CHECK (DinhMuc > 0),
    PRIMARY KEY (MaSP, MaNL)
);

COMMENT ON TABLE  CONGTHUC         IS 'Công thức nguyên liệu của từng sản phẩm';
COMMENT ON COLUMN CONGTHUC.DinhMuc IS 'Lượng nguyên liệu cần cho 1 đơn vị sản phẩm (g, ml, cái...)';

CREATE INDEX idx_congthuc_manl ON CONGTHUC USING BTREE (MaNL);

-- ============================================================
-- DOMAIN 7: CHI PHÍ VẬN HÀNH (Finance)
-- ============================================================

CREATE TABLE PHIEUCHI (
    MaPC        VARCHAR(20)    PRIMARY KEY,
    MaCN        VARCHAR(20)    NOT NULL REFERENCES CHINHANH(MaCN) ON DELETE RESTRICT,
    MaNV        VARCHAR(20)    NOT NULL REFERENCES NHANVIEN(MaNV) ON DELETE RESTRICT,
    NgayChi     TIMESTAMP      NOT NULL DEFAULT NOW(),
    LoaiChi     VARCHAR(100)   NOT NULL
                               CHECK (LoaiChi IN (
                                   'Electricity', 'Water', 'Internet', 'Premises',
                                   'Maintenance & Repair', 'Marketing & Advertising',
                                   'Taxes & Fees', 'Other expenses'
                               )),
    SoTien      NUMERIC(15,2)  NOT NULL CHECK (SoTien > 0),
    MoTa        TEXT,
    TrangThai   VARCHAR(20)    NOT NULL DEFAULT 'Approved'
                               CHECK (TrangThai IN ('Pending', 'Approved', 'Rejected')),
    CreatedAt   TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  PHIEUCHI         IS 'Phiếu chi phí vận hành của chi nhánh';
COMMENT ON COLUMN PHIEUCHI.LoaiChi IS 'Loại chi phí: điện, nước, internet, mặt bằng, sửa chữa, marketing, thuế, khác';

CREATE INDEX idx_phieuchi_macn    ON PHIEUCHI USING BTREE (MaCN);
CREATE INDEX idx_phieuchi_ngaychi ON PHIEUCHI USING BTREE (NgayChi DESC);

-- ============================================================
-- CẤU HÌNH KHÓA NGOẠI AN TOÀN CHO BẢNG PHANCONG  
-- ============================================================

-- 1. Khóa ngoại liên kết với bảng NHANVIEN (Hỗ trợ ON DELETE CASCADE để xóa phân công ca trơn tru từ UI)
ALTER TABLE PHANCONG DROP CONSTRAINT IF EXISTS phancong_manv_fkey;
ALTER TABLE PHANCONG ADD CONSTRAINT phancong_manv_fkey 
    FOREIGN KEY (MaNV) REFERENCES NHANVIEN(MaNV) ON DELETE CASCADE;

-- 2. Khóa ngoại liên kết với bảng CHINHANH
ALTER TABLE PHANCONG DROP CONSTRAINT IF EXISTS phancong_macn_fkey;
ALTER TABLE PHANCONG ADD CONSTRAINT phancong_macn_fkey 
    FOREIGN KEY (MaCN) REFERENCES CHINHANH(MaCN) ON DELETE RESTRICT;

-- 3. Khóa ngoại liên kết với bảng CALAM (Khớp với trường dữ liệu MaCL)
ALTER TABLE PHANCONG DROP CONSTRAINT IF EXISTS phancong_maca_fkey;
ALTER TABLE PHANCONG ADD CONSTRAINT phancong_maca_fkey 
    FOREIGN KEY (MaCL) REFERENCES CALAM(MaCL) ON DELETE RESTRICT;