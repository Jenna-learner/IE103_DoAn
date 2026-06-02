# Tài liệu Hệ thống FnB Chain Management — IE103

> Ngày ghi chép: 28/05/2026  
> Stack: React.js + Vite · Node.js/Express.js · PostgreSQL (ZeroTier VPN)  
> Chế độ phát triển: `USE_MOCK = true` (chưa kết nối DB)

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Phân quyền hệ thống](#2-phân-quyền-hệ-thống)
3. [Tài khoản mock để test](#3-tài-khoản-mock-để-test)
4. [UI 01 — Đăng nhập](#4-ui-01--đăng-nhập)
5. [UI 02 — POS Bán hàng](#5-ui-02--pos-bán-hàng)
6. [UI 03 — Lịch sử Hóa đơn](#6-ui-03--lịch-sử-hóa-đơn)
7. [UI — Khách hàng CRM](#7-ui--khách-hàng-crm)
8. [UI 04 — Dashboard Báo cáo Chi nhánh](#8-ui-04--dashboard-báo-cáo-chi-nhánh)
9. [UI 05 — Tồn kho & Nhật ký kho](#9-ui-05--tồn-kho--nhật-ký-kho)
10. [UI 06 — Kiểm kho & Điều chỉnh](#10-ui-06--kiểm-kho--điều-chỉnh)
11. [UI 07 — Phiếu nhập hàng](#11-ui-07--phiếu-nhập-hàng)
12. [UI 08 — Phân công Ca làm việc](#12-ui-08--phân-công-ca-làm-việc)
13. [UI 09 — Phiếu Chi vận hành](#13-ui-09--phiếu-chi-vận-hành)
14. [Cấu trúc Mock Data](#14-cấu-trúc-mock-data)
15. [Kết nối DB thực (TODO)](#15-kết-nối-db-thực-todo)

---

## 1. Tổng quan kiến trúc

```
fnb-frontend/                   # React + Vite
  src/
    pages/          # Các trang chính (1 file = 1 route)
    components/     # Sidebar, ProtectedRoute, ...
    layouts/        # AppLayout (Sidebar + Outlet)
    store/          # Zustand: authStore.js
    lib/            # mock.js (toàn bộ dữ liệu giả)

fnb-backend/                    # Node.js + Express
  routes/           # API endpoints
  sql/              # Schema + sample data SQL
  .env              # DB connection string (ZeroTier IP)
```

**Pattern `USE_MOCK`** — mỗi trang đều có cờ ở đầu file:

```js
const USE_MOCK = true   // đổi thành false khi DB sẵn sàng
```

Khi `USE_MOCK = true`, trang dùng dữ liệu từ `src/lib/mock.js` thay vì gọi API backend.

---

## 2. Phân quyền hệ thống

| Vai trò | Mã | Mô tả |
|---|---|---|
| Admin | `admin` | Toàn quyền hệ thống |
| Quản lý chi nhánh | `quan_ly_chinhanh` | Quản lý kho, nhân sự, báo cáo CN |
| Thu ngân | `thu_ngan` | Bán hàng, hóa đơn, khách hàng |
| Kho vận | `kho` | Tồn kho, nhật ký, phiếu nhập |

**Bảng quyền truy cập theo trang:**

| Trang | admin | quan_ly | thu_ngan | kho |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ❌ | ❌ |
| POS Bán hàng | ✅ | ❌ | ✅ | ❌ |
| Lịch sử HĐ | ✅ | ✅ | ✅ | ✅ |
| Khách hàng CRM | ✅ | ✅ | ✅ | ❌ |
| Tồn kho / Nhật ký | ✅ | ✅ | ✅ | ✅ |
| Kiểm kho | ✅ | ✅ | ❌ | ✅ |
| Phiếu nhập | ✅ | ✅ | ❌ | ✅ |
| Phân công ca | ✅ | ✅ | ❌ | ❌ |
| Phiếu chi | ✅ | ✅ | ✅ | ✅ |
| Báo cáo | ✅ | ✅ | ❌ | ❌ |
| Sản phẩm | ✅ | ❌ | ❌ | ❌ |
| Chi nhánh | ✅ | ❌ | ❌ | ❌ |
| Nhân viên | ✅ | ❌ | ❌ | ❌ |

---

## 3. Tài khoản mock để test

| Tên đăng nhập | Mật khẩu | Vai trò | Tên |
|---|---|---|---|
| `admin` | `Admin@123` | Admin | Trần Yến Nhi |
| `quanly` | `Quanly@123` | Quản lý CN | Trần Thị Bình |
| `thungan` | `Thungan@123` | Thu ngân | Lê Văn Cường |
| `kho` | `Kho@123` | Kho vận | Hoàng Minh Đức |

---

## 4. UI 01 — Đăng nhập

**Route:** `/login`  
**File:** `src/pages/Login.jsx`  
**Phân quyền:** Public (không cần đăng nhập)

### Chức năng

- Form đăng nhập với tên đăng nhập + mật khẩu
- Toggle ẩn/hiện mật khẩu
- Tự động chuyển hướng sau đăng nhập thành công

### Các bước sử dụng

1. Truy cập `/login`
2. Nhập tên đăng nhập và mật khẩu
3. Nhấn **Đăng nhập**
4. Hệ thống chuyển hướng tới trang phù hợp với vai trò:
   - admin / quan_ly → `/dashboard`
   - thu_ngan → `/pos`
   - kho → `/kho/ton-kho`

### Logic xử lý

```
USE_MOCK = true  →  So khớp với MOCK_ACCOUNTS trong file
USE_MOCK = false →  POST /api/auth/login → nhận JWT token
```

Sau đăng nhập thành công: lưu `{ token, user }` vào Zustand store (`authStore`). Token được persist trong localStorage để giữ phiên.

---

## 5. UI 02 — POS Bán hàng

**Route:** `/pos`  
**File:** `src/pages/POS.jsx`  
**Phân quyền:** `admin`, `thu_ngan`

### Chức năng

- Giao diện bán hàng theo thời gian thực
- Lọc sản phẩm theo danh mục
- Thêm sản phẩm vào giỏ, điều chỉnh số lượng
- Tra cứu khách hàng theo số điện thoại → tự động áp chiết khấu theo hạng thành viên
- Thanh toán (Cash / Card / E-Wallet)
- In hóa đơn (print preview)

### Các bước sử dụng

1. Chọn sản phẩm từ lưới bên trái → thêm vào giỏ bên phải
2. (Tuỳ chọn) Nhập số điện thoại khách → nhấn tra cứu → hệ thống tự điền thông tin + chiết khấu
3. Kiểm tra tổng tiền, giảm giá
4. Chọn phương thức thanh toán → nhấn **Thanh toán**
5. Xem hóa đơn in ra, nhấn **In** hoặc **Đóng**

### Logic xử lý

- **Chiết khấu theo hạng:** Bronze 0% · Silver 3% · Gold 5% · Diamond 10%
- `GiamGia = TongTienHang × DISCOUNT_RATE[HangThanhVien]`
- `TongThanhToan = TongTienHang − GiamGia`
- Sau thanh toán: tạo bản ghi hóa đơn, reset giỏ hàng

---

## 6. UI 03 — Lịch sử Hóa đơn

**Route:** `/hoa-don` và `/hoa-don/:maHD`  
**File:** `src/pages/HoaDon.jsx`, `src/pages/HoaDonDetail.jsx`  
**Phân quyền:** Tất cả vai trò

### Chức năng

- Danh sách hóa đơn có phân trang và lọc (ngày, trạng thái, chi nhánh)
- **Bộ lọc chi nhánh:** chỉ hiển thị với `admin` và `quan_ly_chinhanh` — thu ngân chỉ thấy hóa đơn của chi nhánh mình
- Xem chi tiết hóa đơn (click vào mã HĐ)
- Badge trạng thái: Completed (xanh) · Cancelled (đỏ) · Pending (vàng)
- Tổng doanh thu trong kết quả đang lọc

### Các bước sử dụng

1. Vào `/hoa-don` → xem danh sách
2. Lọc theo ngày hoặc trạng thái
3. Nhấn vào mã hóa đơn → chuyển sang `/hoa-don/:maHD` để xem chi tiết
4. Trang chi tiết hiển thị: thông tin KH, danh sách SP, thanh toán, tổng tiền

### Logic xử lý

- Thu ngân: `filter(hd => hd.MaCN === user.maCN)` — chỉ thấy HĐ CN mình
- Admin/quản lý: thấy tất cả chi nhánh, có dropdown bộ lọc CN

---

## 7. UI — Khách hàng CRM

**Route:** `/khach-hang`  
**File:** `src/pages/KhachHang.jsx`  
**Phân quyền:** `admin`, `quan_ly_chinhanh`, `thu_ngan`

### Chức năng

- Danh sách khách hàng với thẻ hạng thành viên (Bronze / Silver / Gold / Diamond)
- Tìm kiếm theo tên hoặc số điện thoại
- Xem chi tiết khách hàng: điểm tích lũy, lịch sử chi tiêu, số đơn hàng
- Thêm khách hàng mới qua modal
- Cập nhật thông tin khách hàng

### Các bước sử dụng

1. Vào `/khach-hang` → danh sách hiển thị dạng bảng
2. Gõ vào ô tìm kiếm để lọc theo tên/SĐT
3. Nhấn vào dòng khách hàng → mở modal xem chi tiết
4. Nhấn **Thêm khách hàng** → điền form → Lưu

### Logic xử lý hạng thành viên

| Hạng | Điều kiện | Chiết khấu |
|---|---|---|
| Bronze | Mặc định khi đăng ký | 0% |
| Silver | ≥ 200 điểm | 3% |
| Gold | ≥ 500 điểm | 5% |
| Diamond | ≥ 1000 điểm | 10% |

Điểm tích lũy được cộng tự động qua trigger PostgreSQL khi thanh toán thành công.

---

## 8. UI 04 — Dashboard Báo cáo Chi nhánh

**Route:** `/dashboard`  
**File:** `src/pages/Dashboard.jsx`  
**Phân quyền:** `admin`, `quan_ly_chinhanh`

### Chức năng

Dashboard tổng hợp hiển thị tình hình vận hành chi nhánh trong ngày, gồm 4 khu vực chính:

**KPI Cards (4 card):**
- **Doanh thu hôm nay** — tổng `TongThanhToan` của các hóa đơn `Completed` trong ngày
- **Số hóa đơn hôm nay** — đếm hóa đơn `Completed` trong ngày
- **Tổng giảm giá** — tổng `GiamGia` của các hóa đơn `Completed` trong ngày
- **Cảnh báo tồn kho** — đếm nguyên liệu có `SoLuongTon < TonToiThieu`

**Biểu đồ doanh thu 7 ngày:**
- SVG bar chart, tự vẽ không dùng thư viện ngoài
- Cột ngày hôm nay màu cam `#f97316`, ngày trước màu xanh `#3b82f6`
- Cột có chiều cao 0 (không có đơn) hiển thị mờ `opacity: 0.18`
- Nhãn giá trị trên đỉnh bar: đơn vị `k` (nghìn) hoặc `M` (triệu)

**Top 5 sản phẩm bán chạy:**
- Tổng hợp từ `chiTiet` của tất cả hóa đơn `Completed`
- Sắp xếp giảm dần theo `soLuong`
- Hiển thị huy chương: 🥇 vàng · 🥈 bạc · 🥉 đồng

**Hóa đơn gần đây (5 đơn mới nhất):**
- Sắp xếp theo `NgayChi` mới → cũ
- Badge trạng thái: Hoàn thành (xanh) · Đã hủy (đỏ) · Chờ TT (vàng)

**Cảnh báo tồn kho chi tiết:**
- Danh sách NL có `SoLuongTon < TonToiThieu`
- Progress bar tỉ lệ `%` so với mức tối thiểu
- Nếu không có cảnh báo → hiển thị icon ✅ "Tồn kho ổn định"

**Badge phiếu chi chờ duyệt:**
- Góc trên phải header: hiển thị số phiếu `Pending` từ `MOCK_PHIEU_CHI`
- Chỉ xuất hiện khi `pendingPC.length > 0`

### Các bước sử dụng

1. Đăng nhập với vai trò `admin` hoặc `quan_ly_chinhanh`
2. Hệ thống tự động chuyển về `/dashboard`
3. Xem KPI 4 card → tổng quan ngay lập tức
4. Đọc biểu đồ 7 ngày để nắm xu hướng doanh thu
5. Xem top sản phẩm để biết món bán chạy nhất
6. Kiểm tra cảnh báo tồn kho (màu đỏ) → điều hướng sang `/phieu-nhap` nếu cần nhập thêm
7. Click badge "X phiếu chi chờ duyệt" → điều hướng sang `/phieu-chi` để xử lý

### Logic tính toán

```js
// Hôm nay
const today = new Date().toISOString().split('T')[0]  // "YYYY-MM-DD"
const todayCompleted = orders.filter(
  o => o.TrangThai === 'Completed' && o.NgayChi.startsWith(today)
)

// KPI
doanhThuHom  = Σ todayCompleted.TongThanhToan
soHoaDon     = todayCompleted.length
tongGiamGia  = Σ todayCompleted.GiamGia

// Cảnh báo kho
lowStock = tonkho.filter(n => n.SoLuongTon < n.TonToiThieu)

// Top sản phẩm
map[MaSP].soLuong += chiTiet.SoLuong   // gộp tất cả đơn Completed
sort descending → slice(0, 5)

// Biểu đồ 7 ngày
barHeight = (revenue / maxRevenue) * CHART_HEIGHT   // chuẩn hóa theo max
```

### Dữ liệu mock sử dụng

| Nguồn | Mục đích |
|---|---|
| `MOCK_ORDERS` | KPI hôm nay, biểu đồ 7 ngày, top sản phẩm, hóa đơn gần đây |
| `MOCK_TONKHO` | Đếm và hiển thị cảnh báo tồn kho |
| `MOCK_PHIEU_CHI` | Badge phiếu chi chờ duyệt |

---

## 9. UI 05 — Tồn kho & Nhật ký kho

**Route:** `/kho/ton-kho` và `/kho/nhat-ky`  
**File:** `src/pages/TonKho.jsx` (dùng chung cho cả 2 route)  
**Phân quyền:** Tất cả vai trò

### Chức năng

**Tab Tồn kho (`/kho/ton-kho`):**
- Bảng danh sách nguyên liệu: Mã NL, Tên, Đơn vị, Số lượng tồn, Mức tồn tối thiểu, Giá nhập, Giá trị tồn
- Hàng màu đỏ khi `SoLuongTon < MucTonToiThieu` (cảnh báo thiếu hàng)
- Nút **Chỉ cảnh báo** để lọc nhanh các NL đang thiếu
- KPI strip: Tổng NL · Số cảnh báo (đỏ nếu > 0) · Giá trị tồn kho tổng

**Tab Nhật ký (`/kho/nhat-ky`):**
- Lịch sử biến động kho: Import (nhập) · Export (xuất bán) · Audit_Loss (kiểm kho âm) · Audit_Gain (kiểm kho dương)
- Lọc theo loại biến động
- Badge màu sắc cho từng loại

### Các bước sử dụng

1. Vào `/kho/ton-kho` → xem tồn kho hiện tại
2. Nhấn **Chỉ cảnh báo** để thấy NL cần nhập thêm (hàng đỏ)
3. Nhấn tab **Nhật ký kho** → chuyển sang `/kho/nhat-ky`
4. Lọc theo loại (Import/Export/Audit) để theo dõi biến động

### Logic xử lý

- Cảnh báo: `SoLuongTon < MucTonToiThieu` → row đỏ + icon cảnh báo
- Tab switching: `navigate('/kho/ton-kho')` hoặc `navigate('/kho/nhat-ky')`
- `GiaTriTon = Σ(SoLuongTon × GiaNhap)` cho tất cả NL

---

## 10. UI 06 — Kiểm kho & Điều chỉnh

**Route:** `/kho/kiem-kho`  
**File:** `src/pages/KiemKho.jsx`  
**Phân quyền:** `admin`, `quan_ly_chinhanh`, `kho`

### Chức năng

- Lập phiếu kiểm kho: đếm thực tế từng nguyên liệu, so với số liệu hệ thống
- Chênh lệch tự động tính: `ChenhLech = SLThucTe − SLHeThong`
- Màu sắc chênh lệch: xanh (+) / đỏ (−) / xám (0)
- Bắt buộc nhập **lý do** khi có chênh lệch ≠ 0
- Phiếu tạo ra ở trạng thái **Chờ duyệt**
- Admin và quản lý mới được **Duyệt** hoặc **Từ chối** phiếu
- Danh sách phiếu kiểm dạng accordion có thể mở rộng xem chi tiết

### Các bước sử dụng

1. Vào `/kho/kiem-kho` → xem danh sách phiếu đã lập
2. Nhấn **Lập phiếu kiểm kho mới**
3. Điền số lượng thực tế vào từng nguyên liệu
4. Nhập lý do cho các NL có chênh lệch (bắt buộc)
5. Nhấn **Lưu phiếu kiểm kho** → phiếu tạo với trạng thái `Chờ duyệt`
6. Admin/quản lý: mở phiếu → nhấn **Duyệt** hoặc **Từ chối**

### Logic phân quyền

```
canApprove = ['admin', 'quan_ly_chinhanh'].includes(user.vaiTro)
```

- `kho`: có thể lập phiếu, KHÔNG được duyệt
- `admin` / `quan_ly_chinhanh`: lập phiếu + duyệt

### Luồng trạng thái

```
Chờ duyệt  →  Đã duyệt   (khi admin/quản lý duyệt)
           →  Từ chối    (khi admin/quản lý từ chối)
```

---

## 11. UI 07 — Phiếu nhập hàng

**Route:** `/phieu-nhap`  
**File:** `src/pages/PhieuNhap.jsx`  
**Phân quyền:** `admin`, `quan_ly_chinhanh`, `kho` (tạo) | `admin`, `quan_ly_chinhanh` (duyệt)

### Chức năng

- Danh sách phiếu nhập dạng accordion (Mã PN · NCC · Ngày nhập · Tổng tiền · Trạng thái)
- Mở accordion xem chi tiết: bảng nguyên liệu, số lượng, đơn giá, thành tiền
- Tạo phiếu nhập mới (form inline):
  - Chọn nhà cung cấp (NCC)
  - Thêm từng dòng NL: chọn NL từ danh sách, nhập SL và đơn giá
  - Tổng tiền tự tính
  - Ngày nhập dự kiến + ghi chú
- Duyệt / Hủy phiếu (chỉ khi `Draft`)

### Các bước sử dụng

1. Vào `/phieu-nhap` → xem danh sách phiếu
2. Nhấn **Tạo phiếu nhập mới** → form mở ra
3. Chọn NCC từ dropdown
4. Nhấn **+ Thêm nguyên liệu** → chọn NL, điền SL, đơn giá
5. Thêm ghi chú và ngày nhập dự kiến
6. Nhấn **Lưu phiếu** → tạo phiếu `Draft`
7. Admin/quản lý: mở phiếu Draft → nhấn **Duyệt** hoặc **Hủy**

### Logic xử lý

```
TongTien = Σ(SoLuong × DonGia) cho từng dòng NL

Mã phiếu tự sinh: "PN" + YYYYMMDD + 3 chữ số random
Ví dụ: PN20260527042
```

### Luồng trạng thái

```
Draft  →  Approved   (admin/quản lý duyệt)
       →  Cancelled  (admin/quản lý hủy)
```

---

## 12. UI 08 — Phân công Ca làm việc

**Route:** `/phan-cong`  
**File:** `src/pages/PhanCong.jsx`  
**Phân quyền:** `admin`, `quan_ly_chinhanh` (xem + sửa)

### Chức năng

**Tab Lịch tuần:**
- Lịch 7 cột (T2–CN) × 3 ca (Sáng / Chiều / Tối)
- Điều hướng tuần: nút ← → để xem tuần trước/sau
- Ngày hôm nay được highlight bằng màu vàng (brand)
- Chip nhân viên trong mỗi ô: tên + badge vai trò
- Nhấn × trên chip để xóa phân công
- Ô trống hiển thị nút + để thêm nhanh

**Tab Danh sách:**
- Bảng đầy đủ tất cả bản ghi phân công
- Hiển thị: Mã PC · Ngày · Ca · Nhân viên · Vai trò · Giờ làm · Ghi chú

**KPI strip:** Tổng ca tuần · Nhân viên được phân công · Tuần đang xem

### Các bước sử dụng

1. Vào `/phan-cong` → mặc định xem tuần hiện tại
2. Nhấn ← / → để chuyển tuần
3. **Thêm phân công:** nhấn nút **Thêm phân công** (hoặc + trong ô trống)
   - Chọn ngày, ca (Sáng/Chiều/Tối), nhân viên (có ô tìm kiếm)
   - Nhấn **Thêm phân công**
4. **Xóa phân công:** nhấn × trên chip trong lịch hoặc icon × trong tab Danh sách
5. Chuyển sang tab **Danh sách** để xem toàn bộ theo dạng bảng

### Ca làm việc

| Ca | Giờ |
|---|---|
| Ca Sáng (CA001) | 06:00 – 12:00 |
| Ca Chiều (CA002) | 12:00 – 18:00 |
| Ca Tối (CA003) | 18:00 – 23:00 |

---

## 13. UI 09 — Phiếu Chi vận hành

**Route:** `/phieu-chi`  
**File:** `src/pages/PhieuChi.jsx`  
**Phân quyền:** Tất cả (tạo + xem) | `admin`, `quan_ly_chinhanh` (duyệt/từ chối)

### Chức năng

- Danh sách phiếu chi dạng accordion có lọc + tìm kiếm
- Tạo phiếu chi mới qua modal
- **Duyệt** phiếu (canApprove): click Duyệt → tự động ghi người duyệt + ngày
- **Từ chối** phiếu: nhập lý do → xác nhận (lý do được lưu và hiển thị)
- **Hủy** phiếu: chỉ người tạo, chỉ khi còn `Chờ duyệt`
- KPI: Tổng chi đã duyệt tháng này · Phiếu chờ duyệt · Tổng phiếu

### Loại chi

`Vận hành` · `Nguyên liệu` · `Lương` · `Bảo trì` · `Marketing` · `Khác`

### Các bước sử dụng

1. Vào `/phieu-chi` → danh sách hiển thị
2. **Lọc:** chọn Trạng thái hoặc Loại chi từ dropdown · gõ tìm kiếm
3. **Tạo phiếu:** nhấn **Tạo phiếu chi**
   - Chọn loại chi (click chip)
   - Nhập mô tả chi tiết
   - Nhập số tiền → hiển thị preview định dạng VNĐ
   - Chọn ngày lập → nhấn **Tạo phiếu chi**
   - Phiếu tạo ra ở trạng thái `Chờ duyệt`
4. **Duyệt:** admin/quản lý mở accordion → nhấn **Duyệt**
5. **Từ chối:** nhấn **Từ chối** → nhập lý do → nhấn **Xác nhận**
6. **Hủy:** người tạo nhấn **Hủy phiếu** (chỉ khi Chờ duyệt)

### Luồng trạng thái

```
Chờ duyệt  →  Đã duyệt   (admin/quản lý duyệt)
           →  Từ chối    (admin/quản lý từ chối + ghi lý do)
           →  Đã hủy     (người tạo tự hủy)
```

---

## 14. Cấu trúc Mock Data

**File:** `src/lib/mock.js`

| Biến | Nội dung |
|---|---|
| `MOCK_CATEGORIES` | 2 danh mục sản phẩm |
| `MOCK_PRODUCTS` | 6 sản phẩm (SP001–SP006) |
| `MOCK_CUSTOMERS` | Map SĐT → khách hàng (dùng cho POS lookup) |
| `MOCK_CUSTOMERS_LIST` | 6 khách hàng đầy đủ (dùng cho CRM) |
| `DISCOUNT_RATE` | Tỷ lệ giảm theo hạng thành viên |
| `MOCK_ORDERS` | 8 hóa đơn mẫu (lịch sử bán hàng, gồm 2 đơn ngày hôm nay) |
| `MOCK_TONKHO` | 10 nguyên liệu (NL001–NL010) |
| `MOCK_NHATKYKHO` | 10 bản ghi biến động kho |
| `MOCK_NHA_CUNG_CAP` | 4 nhà cung cấp (NCC001–NCC004) |
| `MOCK_PHIEU_NHAP` | 3 phiếu nhập (2 Approved, 1 Draft) |
| `MOCK_NHAN_VIEN` | 5 nhân viên (NV001–NV005) |
| `MOCK_PHAN_CONG` | 16 bản ghi phân công ca (tuần 26/05–01/06) |
| `MOCK_PHIEU_CHI` | 5 phiếu chi (đủ trạng thái) |

---

## 15. Kết nối DB thực (TODO)

### Vấn đề hiện tại

PostgreSQL trên máy chủ ZeroTier (IP: `10.43.118.150`) đang bị chặn cổng 5432 — ping thành công nhưng TCP timeout.

**Giải pháp:** người quản trị DB cần cấu hình:

```bash
# postgresql.conf
listen_addresses = '*'

# pg_hba.conf — thêm dòng:
host    all    all    10.0.0.0/8    md5

# Sau đó restart PostgreSQL
sudo systemctl restart postgresql
```

### Khi DB sẵn sàng

1. Chạy migration: `node fnb-backend/sql/run_setup.js`
2. Đổi `USE_MOCK = false` trong từng file trang
3. Đảm bảo `.env` trong `fnb-backend/` có đúng `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`

---

*Tài liệu được tạo tự động — cập nhật cùng tiến độ code*
