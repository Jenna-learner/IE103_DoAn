# 🍜 Hệ Thống Quản Lý Chuỗi FnB — IE103

Cơ sở dữ liệu PostgreSQL cho hệ thống quản lý chuỗi nhà hàng/quán ăn (Food & Beverage). Đây là đồ án môn **IE103 - Quản trị cơ sở dữ liệu**, thiết kế theo mô hình **multi-branch** (đa chi nhánh).

---

## 📁 Cấu Trúc Thư Mục Đề Xuất

```
fnb-chain-db/
│
├── sql/
│   ├── 01_schema_ddl.sql          # DDL: tạo bảng, ràng buộc, index
│   ├── 02_triggers_procedures.sql # Triggers, Stored Procedures, Views
│   ├── 03_security_roles.sql      # Roles, Users, Permissions, RLS
│   ├── 04_sample_data.sql         # Seed data (~1 triệu dòng)
│   └── add_taikhoan.sql           # Script bổ sung bảng TAIKHOAN (patch)
│
├── docs/
│   ├── erd.png                    # Entity-Relationship Diagram
│   └── data_dictionary.md         # Mô tả chi tiết các bảng & cột
│
├── backup/                        # (gitignore) chứa file .dump backup
│   └── .gitkeep
│
├── .gitignore
└── README.md
```

> **Thứ tự chạy:** `01` → `02` → `03` → `add_taikhoan.sql` → `04`

---

## 📋 Tổng Quan Schema

Hệ thống gồm **21 bảng** tổ chức thành 7 nhóm nghiệp vụ:

| Nhóm | Bảng |
|------|------|
| **Chi nhánh** | `CHINHANH` |
| **Nhân sự** | `BOPHAN`, `NHANVIEN`, `TAIKHOAN`, `NHANVIEN_CHINHANH`, `CALAM`, `PHANCONG` |
| **Sản phẩm** | `LOAISANPHAM`, `SANPHAM`, `CONGTHUC` |
| **Kho** | `NGUYENLIEU`, `TONKHO_CHINHANH`, `NHATKYKHO`, `NHACUNGCAP`, `PHIEUNHAP`, `CHITIET_PHIEUNHAP` |
| **Bán hàng** | `KHACHHANG`, `HOADON`, `CHITIET_HOADON`, `THANHTOAN` |
| **Tài chính** | `PHIEUCHI` |

---

## 📄 Mô Tả Các File SQL

### `01_schema_ddl.sql` — Cấu Trúc Cơ Sở Dữ Liệu
Tạo toàn bộ schema từ đầu (DROP → CREATE).

- **21 bảng** với khóa chính, khóa ngoại, ràng buộc CHECK
- **29 index** tối ưu tốc độ truy vấn (BTREE, GIN)
- Ghi chú `COMMENT ON TABLE/COLUMN` đầy đủ cho từng bảng/cột
- Thiết kế chuẩn cho môi trường multi-branch (nhiều chi nhánh dùng chung dữ liệu)

### `02_triggers_procedures.sql` — Logic Nghiệp Vụ
Tự động hóa các tính toán và kiểm soát dữ liệu.

**8 Triggers:**
- Tính lại `TongTienHang`, `TongThanhToan` khi chi tiết hóa đơn thay đổi
- Tính lại `TongTien` phiếu nhập theo chi tiết
- Xuất kho & ghi nhật ký khi hóa đơn chuyển sang `Completed`
- Đảo bút toán kho khi hủy hóa đơn
- Cập nhật tồn kho khi phiếu nhập được xác nhận (`Received`)
- Kiểm soát thanh toán không vượt tổng tiền hóa đơn
- Kiểm tra xung đột ca làm việc khi phân công
- Tự động cập nhật `UpdatedAt` trên tất cả bảng chính

**5 Stored Procedures:**
- `sp_TinhLuongThang` — tính lương nhân viên theo tháng (dùng **Explicit Cursor**)
- `sp_CapNhatDiemVaHang` — cập nhật điểm tích lũy & hạng thành viên khách hàng
- `sp_DieuChinhTonKho` — điều chỉnh tồn kho thủ công (kiểm kho thực tế)
- `sp_CreateDraftOrder` — tạo hóa đơn nháp mới
- `sp_RefreshAllMaterializedViews` — làm mới toàn bộ Materialized Views

**6 Views & Materialized Views:**
- `v_BangLuongNhanVien` — bảng lương theo tháng
- `v_CanhBaoTonKho` — cảnh báo tồn kho dưới mức tối thiểu
- `v_HoaDonChiTiet` — chi tiết hóa đơn đầy đủ thông tin CRM
- `v_TongHopTaiChinh` — thống kê P&L tổng hợp 12 tháng gần nhất
- `mv_doanhthu_ngay` — *(Materialized)* doanh thu thực tế theo ngày/chi nhánh
- `mv_top_sanpham` — *(Materialized)* top sản phẩm bán chạy toàn chuỗi

### `03_security_roles.sql` — Bảo Mật & Phân Quyền
Hệ thống phân quyền theo mô hình RBAC (Role-Based Access Control).

**7 Roles (vai trò):**

| Role | Mô tả |
|------|-------|
| `role_admin` | Toàn quyền hệ thống |
| `role_hq_manager` | Quản lý tổng toàn chuỗi |
| `role_branch_manager` | Quản lý chi nhánh |
| `role_cashier` | Thu ngân — bán hàng tại quầy |
| `role_warehouse_staff` | Nhân viên kho |
| `role_hr_staff` | Nhân viên nhân sự |
| `role_readonly` | Chỉ đọc báo cáo |

**Row Level Security (RLS):** Bật trên 7 bảng nhạy cảm (`HOADON`, `PHIEUNHAP`, `PHIEUCHI`, `TONKHO_CHINHANH`, `NHATKYKHO`, `PHANCONG`, `TAIKHOAN`) — nhân viên chỉ thấy dữ liệu thuộc chi nhánh của mình.

**7 Database Users** ánh xạ 1-1 với các role ở trên (`app_admin`, `app_cashier_user`, ...).

File này cũng bao gồm hướng dẫn **Import/Export CSV** và chiến lược **Backup/Restore** với `pg_dump`/`pg_restore`.

### `04_sample_data.sql` — Dữ Liệu Mẫu (~1 Triệu Dòng)
Nạp dữ liệu kiểm thử khối lượng lớn dùng `generate_series`.

| Bảng | Số dòng |
|------|---------|
| `CHINHANH` | 10 |
| `SANPHAM` | 200 |
| `NGUYENLIEU` | 100 |
| `NHANVIEN` | 500 |
| `KHACHHANG` | 5.000 |
| `HOADON` | **1.000.000** |
| `CHITIET_HOADON` | ~2.000.000 |
| `THANHTOAN` | 1.000.000 |
| `NHATKYKHO` | 100.000 |

> Sử dụng `SET session_replication_role = 'replica'` để tắt triggers trong lúc bulk insert, sau đó bật lại.

### `add_taikhoan.sql` — Patch: Bảng TAIKHOAN
Script bổ sung chạy **một lần** sau khi có schema chính. Tạo bảng `TAIKHOAN` nếu chưa tồn tại và chèn tài khoản admin mặc định.

- Yêu cầu extension `pgcrypto` (mã hóa mật khẩu bằng `bcrypt`)
- Tài khoản mặc định: `admin@fnbchain.com` / `admin@123`
- Có guard `ON CONFLICT DO UPDATE` — an toàn khi chạy lại

> **Lưu ý bảo mật:** Đổi mật khẩu admin ngay sau khi deploy lên môi trường production.

---

## 🚀 Hướng Dẫn Khởi Tạo

### Yêu cầu
- PostgreSQL **14+**
- Extension `pgcrypto` (cho mã hóa mật khẩu)

### Chạy lần đầu
```bash
# 1. Tạo database
psql -U postgres -c "CREATE DATABASE fnb_chain_db;"

# 2. Chạy theo đúng thứ tự
psql -U postgres -d fnb_chain_db -f sql/01_schema_ddl.sql
psql -U postgres -d fnb_chain_db -f sql/02_triggers_procedures.sql
psql -U postgres -d fnb_chain_db -f sql/03_security_roles.sql
psql -U postgres -d fnb_chain_db -f sql/add_taikhoan.sql

# 3. (Tuỳ chọn) Nạp dữ liệu mẫu — mất vài phút do ~1 triệu dòng
psql -U postgres -d fnb_chain_db -f sql/04_sample_data.sql
```

### Đặt context nhân viên khi đăng nhập (dùng với RLS)
```sql
-- Gọi sau khi xác thực user, trước khi chạy query nghiệp vụ
SET app.current_employee_id = 'NV001';
```

---

## 🔒 Tài Khoản Mặc Định

| Database User | Role | Mật khẩu |
|---------------|------|-----------|
| `app_admin` | `role_admin` | `Admin@Str0ng!2026` |
| `app_cashier_user` | `role_cashier` | `Cash!er2026` |
| `app_warehouse_user` | `role_warehouse_staff` | `War3house2026!` |
| `app_hr_user` | `role_hr_staff` | `HR_Staff@2026` |
| `app_manager_user` | `role_branch_manager` | `Mgr@Br4nch2026` |
| `app_hq_user` | `role_hq_manager` | `HQ_Mgr!2026` |
| `app_readonly_user` | `role_readonly` | `Read0nly@2026` |

> ⚠️ **Đây là mật khẩu demo.** Thay thế bằng secrets manager hoặc biến môi trường trước khi deploy thực tế.

---

## 📝 .gitignore Đề Xuất

```gitignore
# Backup files
backup/*.dump
backup/*.sql
!backup/.gitkeep

# Môi trường local
*.env
.env.*

# Editor
.vscode/
.idea/
```
