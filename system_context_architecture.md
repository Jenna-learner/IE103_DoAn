# System Context & Architecture - Hệ thống quản lý chuỗi FnB

## 1. Mục đích của tài liệu
Tài liệu này là **context tổng quan từ đầu đến cuối** cho bài toán mà nhóm đang xây dựng, để bất kỳ dev hoặc AI agent nào đọc vào cũng hiểu:
- hệ thống đang giải quyết bài toán gì
- các phân hệ chính là gì
- dữ liệu đi như thế nào
- backend và database nên được tổ chức ra sao
- frontend cần có những màn hình nào ở mức đủ dùng
- các điểm nào là **kiến trúc gốc từ tài liệu hiện có**
- các điểm nào là **đã chỉnh theo feedback** để phù hợp hơn với bài toán **quản lý chuỗi FnB**

> Tài liệu này chỉ mô tả ở mức **kiến trúc/surface level**. Chi tiết ràng buộc, trigger, tối ưu, bảo mật... vẫn xem ở các tài liệu riêng trong `docs/`.

---

## 2. Bài toán hệ thống đang xây dựng

### 2.1. Mục tiêu nghiệp vụ
Xây dựng hệ thống quản lý cho **chuỗi FnB** với trọng tâm là **CSDL và backend**, hỗ trợ các nghiệp vụ cốt lõi:
- quản lý menu và công thức sản phẩm
- quản lý nguyên liệu và tồn kho
- nhập hàng từ nhà cung cấp
- bán hàng tại quầy/POS
- thanh toán và đối soát hóa đơn
- quản lý khách hàng thân thiết
- quản lý nhân viên, ca làm, phân công
- quản lý chi phí vận hành
- tổng hợp báo cáo doanh thu, kho, nhân sự

### 2.2. Trọng tâm kỹ thuật
- **CSDL:** PostgreSQL
- **Trọng tâm thiết kế:** backend + database + logic dữ liệu
- **Frontend:** chỉ cần đơn giản, dễ dùng, ưu tiên phục vụ thao tác nghiệp vụ

### 2.3. Phạm vi đúng của version này
Version context này được định nghĩa như một hệ thống:
- hỗ trợ **nhiều chi nhánh**
- ưu tiên **OLTP** (giao dịch vận hành hàng ngày)
- có báo cáo mức vừa phải cho quản lý
- chưa cần đi sâu vào ERP đầy đủ, kế toán chuẩn, hoặc BI nâng cao

---

## 3. Nguồn gốc kiến trúc
Kiến trúc này được tổng hợp từ:
- `docs/relational_schema.md`
- `docs/physical_design.md`
- `docs/trigger_function.md`
- `docs/role_security.md`
- `docs/efficiency_opt.md`
- `docs/generate_data.md`
- `docs/report_architecture_review.md`

### 3.1. Kiến trúc gốc từ tài liệu nhóm
Các tài liệu hiện có đang mô tả khá rõ một hệ thống gồm 6 domain:
1. Menu
2. Inventory
3. Procurement
4. Sales & CRM
5. HR
6. Finance

### 3.2. Điều chỉnh theo feedback
Tài liệu gốc phù hợp mạnh với mô hình **1 cửa hàng**. Để đúng đề tài **chuỗi FnB**, tài liệu này áp dụng các điều chỉnh sau:
- **[Feedback Applied]** Bổ sung chiều **chi nhánh** (`CHINHANH`)
- **[Feedback Applied]** Chuyển tồn kho từ mức toàn hệ thống sang **tồn kho theo chi nhánh**
- **[Feedback Applied]** Chốt lại mô hình thanh toán theo hướng **1 hóa đơn có thể có nhiều bản ghi thanh toán**
- **[Feedback Applied]** Chỉnh luồng kho để chỉ xuất kho khi hóa đơn hoàn tất hoặc khi có bút toán nghiệp vụ rõ ràng
- **[Feedback Applied]** Tăng khả năng audit cho log kho và transaction
- **[Feedback Applied]** Tận dụng tốt hơn tính năng của PostgreSQL

---

## 4. Tầm nhìn kiến trúc tổng thể

### 4.1. Kiểu hệ thống
Đây là một hệ thống **transactional business management system** cho chuỗi FnB, thiên về:
- nhiều thao tác CRUD nghiệp vụ
- nhiều transaction nhỏ nhưng liên tục
- dữ liệu cần nhất quán cao
- cần hỗ trợ audit và báo cáo vận hành

### 4.2. Kiểu kiến trúc đề xuất
- **Frontend:** web app admin/POS đơn giản
- **Backend:** API server + business service layer
- **Database:** PostgreSQL là nguồn dữ liệu trung tâm
- **DB logic:** dùng có chọn lọc `constraint`, `index`, `trigger`, `procedure`, `view`, `materialized view`

### 4.3. Nguyên tắc tổ chức
1. **Database là nguồn sự thật duy nhất** cho dữ liệu vận hành
2. **Business logic quan trọng** nên nằm ở backend service, phần cần enforce cứng thì đặt ở DB
3. **Audit-sensitive operations** như xuất kho, thanh toán, hoàn tất hóa đơn nên đi qua procedure/service chuẩn
4. **Mọi transaction quan trọng nên gắn với chi nhánh**

---

## 5. Các actor chính
- **Admin / Chủ hệ thống**
- **HQ Manager / Manager tổng**
- **Branch Manager / Quản lý chi nhánh**
- **Cashier / Nhân viên bán hàng**
- **Warehouse Staff / Nhân viên kho**
- **HR/Operations Staff**
- **Customer** (tham gia gián tiếp qua loyalty)

---

## 6. Các phân hệ chính

## 6.1. Chi nhánh
Quản lý thông tin cửa hàng trong chuỗi:
- tên chi nhánh
- địa chỉ
- trạng thái hoạt động
- thông tin liên hệ

> **[Feedback Applied]** Đây là phân hệ mới bắt buộc phải có để bài toán thật sự là chuỗi FnB.

## 6.2. Menu
Quản lý:
- loại sản phẩm
- sản phẩm
- công thức sản phẩm
- tình trạng hiển thị/bán của sản phẩm
- giá bán

## 6.3. Inventory
Quản lý:
- danh mục nguyên liệu
- tồn kho theo chi nhánh
- nhật ký biến động kho
- cảnh báo dưới định mức

> **[Feedback Applied]** Tồn kho không còn đặt trực tiếp tại `NGUYENLIEU` như một số tài liệu gốc, mà được tách theo chi nhánh.

## 6.4. Procurement
Quản lý:
- nhà cung cấp
- phiếu nhập
- chi tiết nhập
- cập nhật tồn kho sau khi nhận hàng

## 6.5. Sales & CRM
Quản lý:
- khách hàng
- hóa đơn
- chi tiết hóa đơn
- thanh toán
- tích điểm và hạng thành viên

> **[Feedback Applied]** Thanh toán được mô hình hóa theo hướng một hóa đơn có thể có nhiều lần/đợt thanh toán.

## 6.6. HR
Quản lý:
- bộ phận
- nhân viên
- ca làm
- phân công theo ngày/chi nhánh
- dữ liệu tính lương theo ca

## 6.7. Finance
Quản lý:
- phiếu chi
- báo cáo chi phí theo chi nhánh

## 6.8. Reporting
Phục vụ:
- doanh thu theo ngày/tháng/chi nhánh
- top sản phẩm
- tồn kho thấp
- nhập hàng
- chi phí
- tổng ca làm và lương theo kỳ

---

## 7. Luồng nghiệp vụ end-to-end

## 7.1. Luồng quản lý menu
1. Manager tạo loại sản phẩm
2. Manager tạo sản phẩm
3. Manager gán công thức nguyên liệu cho sản phẩm
4. Manager cấu hình giá bán và trạng thái hiển thị

Kết quả:
- sản phẩm sẵn sàng để bán
- backend có đủ dữ liệu để tính tiêu hao nguyên liệu khi bán

## 7.2. Luồng nhập hàng
1. Chi nhánh tạo phiếu nhập từ nhà cung cấp
2. Nhập chi tiết nguyên liệu và đơn giá
3. Chi nhánh xác nhận nhận hàng
4. Hệ thống cập nhật tồn kho chi nhánh
5. Hệ thống ghi nhật ký kho loại `Import`
6. Hệ thống cập nhật tổng tiền phiếu nhập

## 7.3. Luồng bán hàng tại quầy
1. Cashier mở hóa đơn mới tại 1 chi nhánh
2. Chọn khách hàng hoặc khách lẻ
3. Thêm sản phẩm vào hóa đơn
4. Backend tính tiền tạm thời
5. Cashier thực hiện thanh toán
6. Khi thanh toán đủ và thành công, hóa đơn chuyển `Completed`
7. Hệ thống xuất kho theo công thức
8. Hệ thống ghi nhật ký kho loại `Export`
9. Hệ thống cộng điểm khách hàng nếu có

> **[Feedback Applied]** Xuất kho gắn với mốc hoàn tất hóa đơn, tránh trừ kho ngay khi mới thêm món ở trạng thái draft/pending.

## 7.4. Luồng hủy hóa đơn
1. Hóa đơn đang `Pending` có thể bị hủy trực tiếp
2. Nếu hóa đơn đã `Completed` mà bị hủy/void theo rule nghiệp vụ:
   - hệ thống sinh bút toán đảo kho
   - cập nhật trạng thái thanh toán/hoàn tiền nếu có
   - rollback loyalty nếu đã cộng

> **[Feedback Applied]** Luồng này được bổ sung vì tài liệu gốc chưa khép kín phần cancel/reversal.

## 7.5. Luồng loyalty
1. Hóa đơn hoàn tất thành công
2. Backend/procedure tính điểm dựa trên giá trị thanh toán hợp lệ
3. Cập nhật `DiemTichLuy`
4. Xác định lại hạng thành viên

## 7.6. Luồng phân công nhân sự
1. Manager tạo ca làm chuẩn
2. Manager phân công nhân viên theo ngày và chi nhánh
3. Hệ thống kiểm tra xung đột ca
4. View/report tổng hợp số ca và tiền công theo kỳ

## 7.7. Luồng báo cáo
1. Người dùng chọn thời gian, chi nhánh, loại báo cáo
2. Backend truy vấn dữ liệu gốc hoặc materialized view
3. Trả về dashboard/bảng tổng hợp

---

## 8. Kiến trúc dữ liệu mức tổng quan

## 8.1. Domain 1 - Branch
- `CHINHANH`

## 8.2. Domain 2 - Menu
- `LOAISANPHAM`
- `SANPHAM`
- `CONGTHUC`

## 8.3. Domain 3 - Inventory
- `NGUYENLIEU`
- `TONKHO_CHINHANH`
- `NHATKYKHO`

## 8.4. Domain 4 - Procurement
- `NHACUNGCAP`
- `PHIEUNHAP`
- `CHITIET_PHIEUNHAP`

## 8.5. Domain 5 - Sales & CRM
- `KHACHHANG`
- `HOADON`
- `CHITIET_HOADON`
- `THANHTOAN`

## 8.6. Domain 6 - HR
- `BOPHAN`
- `NHANVIEN`
- `CALAM`
- `PHANCONG`
- `NHANVIEN_CHINHANH` hoặc gắn trực tiếp `MaCN` tùy chính sách nhân sự

## 8.7. Domain 7 - Finance
- `PHIEUCHI`

## 8.8. Domain 8 - Reporting / Derived
- `v_BangLuongNhanVien`
- `mv_doanhthu_ngay`
- `mv_top_sanpham`

---

## 9. Những thay đổi chính so với kiến trúc gốc

### 9.1. Thêm `CHINHANH`
**Lý do:** bài toán là chuỗi FnB, không thể chỉ có 1 kho và 1 điểm bán logic.

### 9.2. Tách `TONKHO_CHINHANH`
**Lý do:** cùng 1 nguyên liệu nhưng mỗi chi nhánh có tồn khác nhau.

### 9.3. Chuyển `THANHTOAN` sang mô hình 1-n với `HOADON`
**Lý do:** thực tế hơn cho split payment, retry payment, partial payment, audit payment attempts.

### 9.4. Xuất kho theo `Completed`
**Lý do:** tránh sai lệch khi nhân viên đang sửa bill dở dang.

### 9.5. Mở rộng `NHATKYKHO`
**Lý do:** tăng khả năng audit, giải thích biến động kho, hỗ trợ review.

### 9.6. Chuẩn bị sẵn cho RLS theo chi nhánh
**Lý do:** PostgreSQL hỗ trợ tốt và rất hợp chuỗi FnB.

---

## 10. Schema sơ bộ để thiết kế Backend và Database

> Đây là **schema sơ bộ** ở mức đủ để FE/BE cùng nhìn một mô hình thống nhất. Không phải DDL cuối cùng.

## 10.1. Branch

### `CHINHANH`
- `MaCN` PK
- `TenCN`
- `DiaChi`
- `SDT`
- `Email`
- `TrangThai` (`Active`, `Inactive`)
- `CreatedAt`
- `UpdatedAt`

---

## 10.2. Menu

### `LOAISANPHAM`
- `MaLoai` PK
- `TenLoai`
- `MoTa`

### `SANPHAM`
- `MaSP` PK
- `TenSP`
- `MoTa`
- `GiaBanMacDinh`
- `TrangThai` (`Available`, `OutOfStock`, `Hidden`)
- `MaLoai` FK -> `LOAISANPHAM`
- `CreatedAt`
- `UpdatedAt`

### `BANGGIA_CHINHANH` *(khuyến nghị, có thể phase 2 nếu cần)*
- `MaCN` FK -> `CHINHANH`
- `MaSP` FK -> `SANPHAM`
- `GiaBan`
- `TrangThai`
- `HieuLucTu`
- `HieuLucDen`
- PK gợi ý: (`MaCN`, `MaSP`, `HieuLucTu`)

### `CONGTHUC`
- `MaSP` FK -> `SANPHAM`
- `MaNL` FK -> `NGUYENLIEU`
- `DinhMuc`
- PK (`MaSP`, `MaNL`)

---

## 10.3. Inventory

### `NGUYENLIEU`
- `MaNL` PK
- `TenNL`
- `DonViTinh`
- `TrangThai`
- `CreatedAt`
- `UpdatedAt`

### `TONKHO_CHINHANH`
- `MaCN` FK -> `CHINHANH`
- `MaNL` FK -> `NGUYENLIEU`
- `SoLuongTon`
- `TonToiThieu`
- `GiaNhapGanNhat`
- `UpdatedAt`
- PK (`MaCN`, `MaNL`)

> **[Feedback Applied]** Tồn kho được chuyển từ `NGUYENLIEU.SoLuongTon` sang bảng riêng theo chi nhánh.

### `NHATKYKHO`
- `MaLog` PK
- `MaCN` FK -> `CHINHANH`
- `MaNL` FK -> `NGUYENLIEU`
- `LoaiBienDong` (`Import`, `Export`, `Adjustment`, `TransferOut`, `TransferIn`, `Wastage`, `ReverseExport`)
- `SoLuong`
- `SoLuongTruoc`
- `SoLuongSau`
- `NguonPhatSinh` (`PHIEUNHAP`, `HOADON`, `DIEUCHUYEN`, `KIEMKHO`, `MANUAL`)
- `MaChungTu`
- `MaNVThucHien` FK -> `NHANVIEN` nullable
- `GhiChu`
- `NgayGhi`

---

## 10.4. Procurement

### `NHACUNGCAP`
- `MaNCC` PK
- `TenNCC`
- `SDT`
- `DiaChi`
- `Email`
- `TrangThai`

### `PHIEUNHAP`
- `MaPN` PK
- `MaCN` FK -> `CHINHANH`
- `NgayNhap`
- `TongTien`
- `TrangThai` (`Draft`, `Received`, `Cancelled`)
- `MaNCC` FK -> `NHACUNGCAP`
- `MaNVLap` FK -> `NHANVIEN`
- `GhiChu`
- `CreatedAt`
- `UpdatedAt`

### `CHITIET_PHIEUNHAP`
- `MaPN` FK -> `PHIEUNHAP`
- `MaNL` FK -> `NGUYENLIEU`
- `SoLuong`
- `DonGia`
- PK (`MaPN`, `MaNL`)

---

## 10.5. Sales & CRM

### `KHACHHANG`
- `MaKH` PK
- `HoTen`
- `SDT`
- `Email` nullable
- `NgaySinh` nullable
- `DiemTichLuy`
- `HangThanhVien` (`Bronze`, `Silver`, `Gold`, `Platinum`)
- `TrangThai`
- `CreatedAt`
- `UpdatedAt`

### `HOADON`
- `MaHD` PK
- `MaCN` FK -> `CHINHANH`
- `NgayLap`
- `MaKH` FK -> `KHACHHANG` nullable
- `MaNV` FK -> `NHANVIEN`
- `LoaiDonHang` (`DineIn`, `TakeAway`, `Delivery`)
- `TongTienHang`  
- `GiamGia`
- `TongThanhToan`
- `TrangThai` (`Pending`, `Completed`, `Cancelled`)
- `GhiChu`
- `CreatedAt`
- `UpdatedAt`

> **[Feedback Applied]** Tách `TongTienHang` và `TongThanhToan` để tránh mơ hồ khi tính giảm giá/báo cáo.

### `CHITIET_HOADON`
- `MaHD` FK -> `HOADON`
- `MaSP` FK -> `SANPHAM`
- `SoLuong`
- `GiaBanTaiThoiDiem`
- `ThanhTien`
- PK (`MaHD`, `MaSP`)

### `THANHTOAN`
- `MaTT` PK
- `MaHD` FK -> `HOADON`
- `PhuongThuc` (`Cash`, `BankTransfer`, `Card`, `EWallet`, `Mixed`)
- `SoTien`
- `NgayTT`
- `TrangThai` (`Processing`, `Success`, `Failed`, `Refunded`)
- `LoaiGiaoDich` (`Payment`, `Refund`)
- `ThongTinChiTiet` JSONB
- `CreatedAt`

> **[Feedback Applied]** Không đặt `UNIQUE(MaHD)` để cho phép nhiều bản ghi thanh toán.

---

## 10.6. HR

### `BOPHAN`
- `MaBP` PK
- `TenBP`
- `MoTa`

### `NHANVIEN`
- `MaNV` PK
- `HoTen`
- `NgaySinh`
- `SDT`
- `Email` nullable
- `DonGiaCa` *(đổi tên rõ nghĩa hơn `LuongCoBan` nếu thực chất là lương/ca)*
- `TrangThai` (`Active`, `Resigned`, `Suspended`)
- `MaBP` FK -> `BOPHAN`
- `CreatedAt`
- `UpdatedAt`

### `NHANVIEN_CHINHANH` *(khuyến nghị nếu nhân viên có thể đổi chi nhánh theo thời gian)*
- `MaNV` FK -> `NHANVIEN`
- `MaCN` FK -> `CHINHANH`
- `TuNgay`
- `DenNgay` nullable
- `VaiTroTaiCN`
- PK (`MaNV`, `MaCN`, `TuNgay`)

### `CALAM`
- `MaCL` PK
- `TenCL`
- `GioBatDau`
- `GioKetThuc`
- `TrangThai`

### `PHANCONG`
- `MaNV` FK -> `NHANVIEN`
- `MaCN` FK -> `CHINHANH`
- `MaCL` FK -> `CALAM`
- `Ngay`
- `TrangThai` (`Assigned`, `Done`, `Absent`, `Cancelled`)
- PK (`MaNV`, `MaCN`, `MaCL`, `Ngay`)

---

## 10.7. Finance

### `PHIEUCHI`
- `MaPC` PK
- `MaCN` FK -> `CHINHANH`
- `NgayChi`
- `LoaiChi`
- `SoTien`
- `MoTa`
- `MaNV` FK -> `NHANVIEN`
- `TrangThai`
- `CreatedAt`

---

## 10.8. Reporting objects

### `v_BangLuongNhanVien`
Mục đích:
- tổng hợp số ca làm
- đơn giá ca
- tổng tiền công theo tháng

### `mv_doanhthu_ngay`
Mục đích:
- hỗ trợ dashboard doanh thu nhanh theo ngày/chi nhánh

Gợi ý field:
- `Ngay`
- `MaCN`
- `SoHoaDonCompleted`
- `TongTienHang`
- `TongGiamGia`
- `TongThanhToan`

### `mv_top_sanpham`
Gợi ý field:
- `MaCN`
- `MaSP`
- `TongSoLuongBan`
- `TongDoanhThu`
- `SoHoaDon`

---

## 11. Quan hệ cốt lõi để FE/BE nắm nhanh
- 1 `CHINHANH` có nhiều `HOADON`, `PHIEUNHAP`, `PHIEUCHI`, `PHANCONG`, `TONKHO_CHINHANH`
- 1 `LOAISANPHAM` có nhiều `SANPHAM`
- 1 `SANPHAM` có nhiều dòng `CONGTHUC`
- 1 `NGUYENLIEU` có nhiều tồn kho theo chi nhánh qua `TONKHO_CHINHANH`
- 1 `NHACUNGCAP` có nhiều `PHIEUNHAP`
- 1 `PHIEUNHAP` có nhiều `CHITIET_PHIEUNHAP`
- 1 `KHACHHANG` có nhiều `HOADON`
- 1 `HOADON` có nhiều `CHITIET_HOADON`
- 1 `HOADON` có thể có nhiều `THANHTOAN`
- 1 `NHANVIEN` thuộc 1 `BOPHAN`, có thể gắn nhiều `PHANCONG`

---

## 12. Định hướng backend

## 12.1. Ưu tiên kiến trúc backend
Backend nên được chia ít nhất thành các module/service:
- `branch-service`
- `menu-service`
- `inventory-service`
- `procurement-service`
- `sales-service`
- `payment-service`
- `crm-service`
- `hr-service`
- `finance-service`
- `report-service`
- `auth/rbac-service`

Nếu chỉ làm 1 monolith thì vẫn nên chia **module logic** theo các domain trên.

## 12.2. Business operations quan trọng nên làm thành service/procedure chuẩn
- `createDraftOrder`
- `addOrderItem`
- `completeOrder`
- `cancelOrder`
- `createPurchaseOrder`
- `receivePurchaseOrder`
- `adjustInventory`
- `assignShift`
- `closeDayReport`

## 12.3. Logic nên ở backend hơn là FE
- tính tổng hóa đơn
- validate trạng thái hóa đơn
- xác nhận thanh toán đủ/chưa đủ
- xuất kho
- rollback kho khi hủy
- cộng điểm loyalty
- check conflict phân công
- phân quyền theo vai trò/chi nhánh

## 12.4. Logic nên enforce ở PostgreSQL
- PK/FK/CHECK/UNIQUE cơ bản
- index
- constraint trạng thái quan trọng
- trigger/procedure cho nghiệp vụ cần tính nhất quán cao
- views/materialized views cho reporting
- RLS theo `MaCN` nếu áp dụng

---

## 13. Định hướng API sơ bộ cho BE/FE

## 13.1. Branch
- `GET /branches`
- `GET /branches/:id`
- `POST /branches`
- `PATCH /branches/:id`

## 13.2. Menu
- `GET /product-categories`
- `GET /products`
- `GET /products/:id`
- `POST /products`
- `PATCH /products/:id`
- `GET /products/:id/recipe`
- `PUT /products/:id/recipe`

## 13.3. Inventory
- `GET /branches/:branchId/inventory`
- `GET /branches/:branchId/inventory/logs`
- `POST /branches/:branchId/inventory/adjustments`

## 13.4. Procurement
- `GET /suppliers`
- `POST /purchase-orders`
- `GET /purchase-orders/:id`
- `POST /purchase-orders/:id/receive`
- `POST /purchase-orders/:id/cancel`

## 13.5. Sales
- `POST /orders`
- `GET /orders/:id`
- `POST /orders/:id/items`
- `PATCH /orders/:id/items`
- `DELETE /orders/:id/items/:productId`
- `POST /orders/:id/payments`
- `POST /orders/:id/complete`
- `POST /orders/:id/cancel`

## 13.6. CRM
- `GET /customers`
- `POST /customers`
- `GET /customers/:id/orders`
- `GET /customers/:id/loyalty`

## 13.7. HR
- `GET /employees`
- `POST /employees`
- `GET /shifts`
- `POST /assignments`
- `GET /assignments`

## 13.8. Finance & Reports
- `GET /expenses`
- `POST /expenses`
- `GET /reports/revenue`
- `GET /reports/top-products`
- `GET /reports/inventory-alerts`
- `GET /reports/payroll`

---

## 14. Định hướng frontend

## 14.1. Mục tiêu FE
Frontend chỉ cần:
- gọn
- rõ luồng nghiệp vụ
- ít thao tác thừa
- tối ưu cho người dùng nội bộ

## 14.2. Các màn hình chính

### Cho cashier
- màn hình POS bán hàng
- tìm sản phẩm
- chọn khách hàng
- giỏ hàng / hóa đơn hiện tại
- popup thanh toán
- lịch sử hóa đơn gần đây

### Cho branch manager
- dashboard chi nhánh
- quản lý sản phẩm đang bán
- tồn kho và cảnh báo thiếu hàng
- phiếu nhập
- phân công ca
- chi phí chi nhánh
- báo cáo doanh thu

### Cho HQ/admin
- quản lý chi nhánh
- quản lý menu toàn hệ thống
- quản lý nhà cung cấp
- quản lý nhân viên
- báo cáo tổng hợp toàn chuỗi

## 14.3. Nguyên tắc UI
- branch filter rõ ràng
- trạng thái nghiệp vụ hiển thị dễ hiểu (`Pending`, `Completed`, `Cancelled`, ...)
- form nhập liệu ngắn gọn
- bảng dữ liệu có search/filter/export cơ bản
- dashboard đủ KPI, không cần quá phức tạp

---

## 15. PostgreSQL-specific guidance

### 15.1. Nên tận dụng
- `JSONB` cho metadata thanh toán
- `Partial Index` cho trạng thái hay lọc
- `Materialized View` cho báo cáo nặng
- `SELECT ... FOR UPDATE` hoặc atomic update để chống oversell
- `RLS` nếu muốn phân quyền theo chi nhánh ở DB level
- `VIEW` cho dữ liệu tổng hợp nghiệp vụ

### 15.2. Không nên lạm dụng
- không nhét business data cốt lõi vào `JSONB`
- không để trigger ôm toàn bộ luồng nghiệp vụ phức tạp nếu khó kiểm soát
- không tạo quá nhiều index trùng với PK/UNIQUE hiện có

---

## 16. Những quy tắc nghiệp vụ cốt lõi cần mọi dev/AI nhớ
1. **Mọi transaction quan trọng phải gắn với chi nhánh**
2. **Không xuất kho ở trạng thái draft nếu chưa có nghiệp vụ chốt rõ ràng**
3. **Tổng thanh toán thành công phải khớp tổng cần thanh toán của hóa đơn**
4. **Loyalty chỉ cộng khi hóa đơn hoàn tất hợp lệ**
5. **Log kho phải truy được nguồn phát sinh**
6. **Phân quyền nên giới hạn theo vai trò và theo chi nhánh**
7. **Báo cáo doanh thu phải dùng định nghĩa tiền rõ ràng: trước giảm, giảm giá, sau giảm**

---

## 17. Những gì chưa ưu tiên ở version này
- kế toán chuẩn double-entry
- công nợ nhà cung cấp nâng cao
- định mức hao hụt phức tạp theo batch/lot/expiry
- kitchen display system
- mobile app cho khách hàng
- thuật toán forecast nhu cầu

---

## 18. Kết luận
Bài toán cốt lõi của hệ thống là xây dựng một **nền tảng quản lý vận hành chuỗi FnB** với PostgreSQL làm trung tâm dữ liệu, trong đó backend và database là trọng tâm chính, frontend chỉ cần đơn giản và hiệu quả.

Kiến trúc gốc của nhóm đã bao phủ tốt các domain vận hành chính. Tuy nhiên, để phù hợp đúng với bài toán chuỗi FnB, tài liệu này đã áp dụng các chỉnh sửa cần thiết nhất:
- thêm chi nhánh
- thêm tồn kho theo chi nhánh
- làm rõ thanh toán
- khép kín luồng kho và hủy đơn
- tăng khả năng audit
- ưu tiên backend/database design chặt chẽ hơn frontend

Nếu một dev/agent AI đọc tài liệu này, họ nên hiểu ngay rằng hệ thống đang xây dựng là:
- một hệ thống POS + kho + nhập hàng + CRM + HR + finance nhẹ
- chạy trên PostgreSQL
- có nhiều chi nhánh
- ưu tiên transaction consistency và reporting vận hành
- thiết kế backend/database là xương sống của toàn hệ thống
