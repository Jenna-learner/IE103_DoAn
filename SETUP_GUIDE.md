# FnB Chain Management System — Hướng Dẫn Setup

> Stack: **React.js + Vite** | **Node.js + Express** | **pg (node-postgres)** | **PostgreSQL via ZeroTier One**

---

## Cấu trúc thư mục Backend (đã điều chỉnh theo schema thực tế)

```
fnb-backend/
├── server.js                          ← Entry point (13 route groups)
├── package.json
├── .env                               ← Tạo từ .env.example
├── .env.example
├── .gitignore
│
├── sql/
│   └── add_taikhoan.sql               ← ⚠️ Chạy 1 lần để tạo bảng TAIKHOAN (đăng nhập)
│                                         (Schema chính đã có sẵn trong DB)
│
└── src/
    ├── config/
    │   └── db.js                      ← pg Pool → ZeroTier 171.249.255.75:5432
    │
    ├── middleware/
    │   ├── auth.js                    ← JWT + authorize(vaiTro)
    │   └── errorHandler.js            ← Global error handler
    │
    ├── utils/
    │   ├── response.js                ← success() / error() / paginated()
    │   └── magen.js                   ← Sinh mã chứng từ (HD, PN, PC, TT, KH...)
    │
    ├── controllers/                   ← Logic nghiệp vụ (khớp với 20 bảng DB)
    │   ├── auth.controller.js         ← Login dùng TAIKHOAN + NHANVIEN
    │   ├── sanpham.controller.js      ← SANPHAM + CONGTHUC + LOAISANPHAM
    │   ├── loaisanpham.controller.js  ← LOAISANPHAM (danh mục menu)
    │   ├── hoadon.controller.js       ← HOADON + CHITIET_HOADON + THANHTOAN
    │   │                                 ⚡ Triggers tự xử lý kho & CRM
    │   ├── khachhang.controller.js    ← KHACHHANG (CRM: Bronze/Silver/Gold/Diamond)
    │   ├── kho.controller.js          ← TONKHO_CHINHANH + NHATKYKHO + NGUYENLIEU
    │   ├── phieunhap.controller.js    ← PHIEUNHAP + CHITIET_PHIEUNHAP
    │   │                                 ⚡ Trigger tự cộng kho khi Approved
    │   ├── phancong.controller.js     ← PHANCONG + CALAM (ca làm việc)
    │   ├── phieuchi.controller.js     ← PHIEUCHI (chi phí vận hành)
    │   ├── baocao.controller.js       ← Materialized Views + Views báo cáo
    │   ├── nhanvien.controller.js     ← NHANVIEN + TAIKHOAN + NHANVIEN_CHINHANH
    │   ├── nhacungcap.controller.js   ← NHACUNGCAP
    │   └── chinhanh.controller.js     ← CHINHANH + BOPHAN
    │
    └── routes/                        ← API Endpoints
        ├── auth.routes.js
        ├── sanpham.routes.js
        ├── loaisanpham.routes.js
        ├── hoadon.routes.js
        ├── khachhang.routes.js
        ├── kho.routes.js
        ├── phieunhap.routes.js
        ├── phancong.routes.js
        ├── phieuchi.routes.js
        ├── baocao.routes.js
        ├── nhanvien.routes.js
        ├── nhacungcap.routes.js
        └── chinhanh.routes.js

        [Các file cũ bên dưới đã lỗi thời - không được import, có thể xoá:]
        ├── product.routes.js  (→ thay bởi sanpham.routes.js)
        ├── order.routes.js    (→ thay bởi hoadon.routes.js)
        ├── customer.routes.js (→ thay bởi khachhang.routes.js)
        ├── inventory.routes.js (→ thay bởi kho.routes.js)
        ├── purchaseOrder.routes.js (→ thay bởi phieunhap.routes.js)
        ├── shift.routes.js    (→ thay bởi phancong.routes.js)
        ├── expense.routes.js  (→ thay bởi phieuchi.routes.js)
        ├── report.routes.js   (→ thay bởi baocao.routes.js)
        ├── user.routes.js     (→ thay bởi nhanvien.routes.js)
        └── category.routes.js (→ thay bởi loaisanpham.routes.js)
```

---

## BƯỚC 1 — Cài Dependencies

```bash
cd fnb-backend
npm install
```

---

## BƯỚC 2 — Tạo file .env

```bash
cp .env.example .env
```

Nội dung `.env` (đã điền sẵn thông tin ZeroTier):
```
DB_HOST=171.249.255.75
DB_PORT=5432
DB_NAME=fnb_chain_db
DB_USER=postgres
DB_PASSWORD=nhule875
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=8h
PORT=5000
FRONTEND_URL=http://localhost:5173
```

> ⚠️ Đảm bảo ZeroTier One đang chạy và đã join vào mạng trước khi khởi động server.

---

## BƯỚC 3 — Tạo bảng TAIKHOAN (chỉ chạy 1 lần)

Schema chính (01_schema_ddl.sql) không có bảng đăng nhập.
Chạy file bổ sung để tạo bảng TAIKHOAN:

```bash
# Windows PowerShell:
$env:PGPASSWORD="nhule875"
psql -h 171.249.255.75 -U postgres -d fnb_chain_db -f sql/add_taikhoan.sql

# Hoặc dùng pgAdmin 4:
# Mở Query Tool → paste nội dung sql/add_taikhoan.sql → Execute (F5)
```

Sau khi chạy, tài khoản admin mặc định: **admin / Admin@123** (gắn với NV001)

---

## BƯỚC 4 — Chạy Backend

```bash
# Development (nodemon tự reload):
npm run dev

# Production:
npm start
```

Server chạy tại: **http://localhost:5000**

---

## BƯỚC 5 — Kiểm tra kết nối

```
GET http://localhost:5000/api/health
```

Kết quả mong đợi:
```json
{
  "status": "OK",
  "db": "Connected → 171.249.255.75:5432/fnb_chain_db",
  "server_time": "2026-05-27T..."
}
```

---

## API Endpoints Toàn Bộ

### AUTH
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/auth/login` | Đăng nhập (trả JWT) |
| GET  | `/api/v1/auth/me` | Thông tin tài khoản hiện tại |
| PUT  | `/api/v1/auth/doi-mat-khau` | Đổi mật khẩu |

### SẢN PHẨM (SANPHAM)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/san-pham?maLoai=&search=&trangThai=` | Danh sách sản phẩm (POS menu) |
| GET  | `/api/v1/san-pham/:maSP` | Chi tiết + công thức định mức |
| POST | `/api/v1/san-pham` | Thêm sản phẩm + công thức |
| PUT  | `/api/v1/san-pham/:maSP` | Cập nhật |
| PATCH| `/api/v1/san-pham/:maSP/trang-thai` | Đổi trạng thái |
| GET  | `/api/v1/loai-san-pham` | Danh mục sản phẩm |

### HÓA ĐƠN POS (HOADON)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/hoa-don?maCN=&trangThai=&ngay=` | Lịch sử hóa đơn |
| GET  | `/api/v1/hoa-don/:maHD` | Chi tiết HĐ + items + thanh toán |
| POST | `/api/v1/hoa-don` | **Tạo đơn POS** (trigger tự khấu kho + tích điểm) |
| PATCH| `/api/v1/hoa-don/:maHD/huy` | Huỷ đơn + hoàn kho |

### KHÁCH HÀNG CRM (KHACHHANG)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/khach-hang/tra-cuu?sdt=` | Tra cứu nhanh tại POS theo SDT |
| GET  | `/api/v1/khach-hang?sdt=&hang=` | Danh sách khách hàng |
| POST | `/api/v1/khach-hang` | Đăng ký khách mới |
| PUT  | `/api/v1/khach-hang/:maKH` | Cập nhật thông tin |

### KHO (TONKHO_CHINHANH + NHATKYKHO)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/kho/ton-kho?maCN=&canhBao=true` | Tồn kho (highlight đỏ nếu canhBao=true) |
| GET  | `/api/v1/kho/nhat-ky?maCN=&loai=` | Nhật ký biến động kho |
| GET  | `/api/v1/kho/nguyen-lieu` | Danh sách nguyên liệu |
| POST | `/api/v1/kho/kiem-kho` | Điều chỉnh kiểm kho (Audit_Loss/Gain) |

### PHIẾU NHẬP (PHIEUNHAP)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/phieu-nhap?maCN=&trangThai=` | Danh sách phiếu nhập |
| GET  | `/api/v1/phieu-nhap/:maPN` | Chi tiết phiếu |
| POST | `/api/v1/phieu-nhap` | Tạo phiếu Draft |
| PATCH| `/api/v1/phieu-nhap/:maPN/duyet` | Duyệt → trigger tự cộng kho |
| PATCH| `/api/v1/phieu-nhap/:maPN/huy` | Huỷ phiếu |

### PHÂN CÔNG CA (PHANCONG)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/phan-cong/ca-lam` | Danh sách ca chuẩn (CALAM) |
| GET  | `/api/v1/phan-cong?maCN=&tuan=&maNV=` | Lịch làm việc theo tuần |
| POST | `/api/v1/phan-cong` | Phân công ca (chống trùng) |
| PATCH| `/api/v1/phan-cong/:maPC/trang-thai` | Cập nhật trạng thái (Completed/Absent) |
| DELETE| `/api/v1/phan-cong/:maPC` | Xoá phân công |

### PHIẾU CHI (PHIEUCHI)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/phieu-chi?maCN=&thang=&trangThai=` | Danh sách phiếu chi |
| POST | `/api/v1/phieu-chi` | Tạo phiếu chi |
| PATCH| `/api/v1/phieu-chi/:maPC/duyet` | Duyệt (admin) |
| PATCH| `/api/v1/phieu-chi/:maPC/tu-choi` | Từ chối (admin) |

### BÁO CÁO DASHBOARD (BAOCAO)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/bao-cao/dashboard?maCN=&ngay=` | Card KPIs (Materialized Views) |
| GET  | `/api/v1/bao-cao/doanh-thu-theo-ngay?thang=` | Chart doanh thu |
| GET  | `/api/v1/bao-cao/top-san-pham?maCN=&limit=` | Top sản phẩm bán chạy |
| GET  | `/api/v1/bao-cao/canh-bao-ton-kho?maCN=` | Cảnh báo tồn kho (v_CanhBaoTonKho) |
| GET  | `/api/v1/bao-cao/bang-luong?thang=` | Bảng lương (v_BangLuongNhanVien) |
| POST | `/api/v1/bao-cao/lam-moi` | Refresh Materialized Views |

---

## Vai trò hệ thống (VaiTro trong TAIKHOAN)

| VaiTro | Mô tả | Quyền chính |
|--------|-------|-------------|
| `admin` | Quản trị viên | Toàn quyền |
| `quan_ly_chinhanh` | Quản lý chi nhánh | Quản lý chi nhánh của mình |
| `thu_ngan` | Thu ngân POS | Tạo hóa đơn, tra cứu khách hàng |
| `kho` | Nhân viên kho | Xem tồn kho, nhập phiếu |

---

## Logic Triggers PostgreSQL (không cần viết thêm trong Node.js)

| Trigger | Kích hoạt khi | Hành động tự động |
|---------|---------------|-------------------|
| `trg_recalc_hoadon` | Thêm/sửa CHITIET_HOADON | Tính lại TongTienHang, TongThanhToan |
| `trg_hoadon_export` | HOADON → 'Completed' | Khấu trừ TONKHO_CHINHANH theo CONGTHUC |
| `trg_hoadon_crm` | HOADON → 'Completed' | Tích DiemTichLuy + nâng HangThanhVien cho KH |
| `trg_phieunhap_import` | PHIEUNHAP → 'Approved' | Cộng TONKHO_CHINHANH + ghi NHATKYKHO |

---

## BƯỚC TIẾP THEO — Setup Frontend (React + Vite)

```bash
cd ../
npm create vite@latest fnb-frontend -- --template react
cd fnb-frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install axios react-router-dom @tanstack/react-query zustand react-hot-toast recharts
```
