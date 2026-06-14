-- ============================================================
-- HỆ THỐNG QUẢN LÝ CHUỖI FnB - IE103
-- File: 02_triggers_procedures.sql
-- Mô tả: Triggers, Stored Procedures, Functions, Views,
--        Materialized Views & Explicit Cursor
-- ============================================================

-- ============================================================
-- PHẦN 1: TRIGGER FUNCTIONS
-- ============================================================

-- ------------------------------------------------------------
-- 1.0 Trigger: Tự động điền MaCNN
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_auto_fill_macn_if_null()
RETURNS TRIGGER AS $$
DECLARE
    v_macn_detected VARCHAR(20);
BEGIN
    IF TG_TABLE_NAME = 'hoadon' AND NEW.MaCN IS NULL THEN
        SELECT MaCN INTO v_macn_detected FROM NHANVIEN_CHINHANH WHERE MaNV = NEW.MaNV AND DenNgay IS NULL LIMIT 1;
        NEW.MaCN := COALESCE(v_macn_detected, (SELECT MaCN FROM CHINHANH LIMIT 1));
    END IF;

    IF TG_TABLE_NAME = 'phieunhap' AND NEW.MaCN IS NULL THEN
        SELECT MaCN INTO v_macn_detected FROM NHANVIEN_CHINHANH WHERE MaNV = NEW.MaNVLap AND DenNgay IS NULL LIMIT 1;
        NEW.MaCN := COALESCE(v_macn_detected, (SELECT MaCN FROM CHINHANH LIMIT 1));
    END IF;

    IF TG_TABLE_NAME = 'phancong' AND NEW.MaCN IS NULL THEN
        SELECT MaCN INTO v_macn_detected FROM NHANVIEN_CHINHANH WHERE MaNV = NEW.MaNV AND DenNgay IS NULL LIMIT 1;
        NEW.MaCN := COALESCE(v_macn_detected, (SELECT MaCN FROM CHINHANH LIMIT 1));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hoadon_auto_macn BEFORE INSERT ON HOADON FOR EACH ROW EXECUTE FUNCTION fn_auto_fill_macn_if_null();
CREATE TRIGGER trg_phieunhap_auto_macn BEFORE INSERT ON PHIEUNHAP FOR EACH ROW EXECUTE FUNCTION fn_auto_fill_macn_if_null();
CREATE TRIGGER trg_phancong_auto_macn BEFORE INSERT ON PHANCONG FOR EACH ROW EXECUTE FUNCTION fn_auto_fill_macn_if_null();

-- ------------------------------------------------------------
-- 1.1 Trigger: Tính lại TongTienHang & TongThanhToan cho HOADON
-- Kích hoạt sau INSERT/UPDATE/DELETE trên CHITIET_HOADON
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalc_hoadon_tongtien()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_mahd      VARCHAR(20);
    v_tongtien  NUMERIC(15,2);
    v_giamgia   NUMERIC(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_mahd := OLD.MaHD;
    ELSE
        v_mahd := NEW.MaHD;
    END IF;

    SELECT COALESCE(SUM(ThanhTien), 0) INTO v_tongtien
    FROM   CHITIET_HOADON
    WHERE  MaHD = v_mahd;

    SELECT GiamGia INTO v_giamgia
    FROM   HOADON
    WHERE  MaHD = v_mahd;

    UPDATE HOADON
    SET    TongTienHang  = v_tongtien,
           TongThanhToan = GREATEST(v_tongtien - COALESCE(v_giamgia, 0), 0),
           UpdatedAt     = NOW()
    WHERE  MaHD = v_mahd;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_chitiet_hoadon_recalc
AFTER INSERT OR UPDATE OR DELETE ON CHITIET_HOADON
FOR EACH ROW EXECUTE FUNCTION fn_recalc_hoadon_tongtien();

-- ------------------------------------------------------------
-- 1.2 Trigger: Tính lại TongTien cho PHIEUNHAP
-- Kích hoạt sau INSERT/UPDATE/DELETE trên CHITIET_PHIEUNHAP
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalc_phieunhap_tongtien()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_mapn      VARCHAR(20);
    v_tongtien  NUMERIC(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_mapn := OLD.MaPN;
    ELSE
        v_mapn := NEW.MaPN;
    END IF;

    SELECT COALESCE(SUM(SoLuong * DonGia), 0) INTO v_tongtien
    FROM   CHITIET_PHIEUNHAP
    WHERE  MaPN = v_mapn;

    UPDATE PHIEUNHAP
    SET    TongTien  = v_tongtien,
           UpdatedAt = NOW()
    WHERE  MaPN = v_mapn;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_chitiet_phieunhap_recalc
AFTER INSERT OR UPDATE OR DELETE ON CHITIET_PHIEUNHAP
FOR EACH ROW EXECUTE FUNCTION fn_recalc_phieunhap_tongtien();

-- ------------------------------------------------------------
-- 1.3 Trigger: Xuất kho và ghi nhật ký khi hóa đơn Completed
-- Kích hoạt khi HOADON.TrangThai chuyển sang 'Completed'
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_export_inventory_on_complete()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    r_item      RECORD;
    v_can_xuat  NUMERIC(12,3);
    v_ton_hien  NUMERIC(12,3);
    v_ton_sau   NUMERIC(12,3);
BEGIN
    IF NOT (OLD.TrangThai = 'Pending' AND NEW.TrangThai = 'Completed') THEN
        RETURN NEW;
    END IF;

    FOR r_item IN
        SELECT cd.MaSP, cd.SoLuong, ct.MaNL, ct.DinhMuc, nl.TenNL
        FROM   CHITIET_HOADON cd
        JOIN   CONGTHUC ct ON ct.MaSP = cd.MaSP
        JOIN   NGUYENLIEU nl ON nl.MaNL = ct.MaNL
        WHERE  cd.MaHD = NEW.MaHD
    LOOP
        v_can_xuat := r_item.SoLuong * r_item.DinhMuc;

        SELECT SoLuongTon INTO v_ton_hien
        FROM   TONKHO_CHINHANH
        WHERE  MaCN = NEW.MaCN AND MaNL = r_item.MaNL
        FOR UPDATE;

        IF v_ton_hien IS NULL OR v_ton_hien < v_can_xuat THEN
            RAISE EXCEPTION 'Không đủ tồn kho nguyên liệu "%" tại chi nhánh %. Cần: %, Có: %',
                r_item.TenNL, NEW.MaCN, v_can_xuat, COALESCE(v_ton_hien, 0);
        END IF;

        v_ton_sau := v_ton_hien - v_can_xuat;

        UPDATE TONKHO_CHINHANH
        SET    SoLuongTon = v_ton_sau,
               UpdatedAt  = NOW()
        WHERE  MaCN = NEW.MaCN AND MaNL = r_item.MaNL;

        INSERT INTO NHATKYKHO (
            MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau,
            NguonPhatSinh, MaChungTu, MaNVThucHien, GhiChu
        ) VALUES (
            NEW.MaCN, r_item.MaNL, 'Export', v_can_xuat, v_ton_hien, v_ton_sau,
            'HOADON', NEW.MaHD, NEW.MaNV, 'Xuất kho tự động khi HĐ ' || NEW.MaHD || ' hoàn tất'
        );
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hoadon_export_inventory
AFTER UPDATE ON HOADON
FOR EACH ROW EXECUTE FUNCTION fn_export_inventory_on_complete();

-- ------------------------------------------------------------
-- 1.4 Trigger: Đảo bút toán kho khi hủy hóa đơn đã Completed
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_reverse_inventory_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    r_item     RECORD;
    v_ton_hien NUMERIC(12,3);
    v_ton_sau  NUMERIC(12,3);
    v_da_xuat  NUMERIC(12,3);
BEGIN
    IF NOT (OLD.TrangThai = 'Completed' AND NEW.TrangThai = 'Cancelled') THEN
        RETURN NEW;
    END IF;

    FOR r_item IN
        SELECT cd.MaSP, cd.SoLuong, ct.MaNL, ct.DinhMuc
        FROM   CHITIET_HOADON cd
        JOIN   CONGTHUC ct ON ct.MaSP = cd.MaSP
        WHERE  cd.MaHD = NEW.MaHD
    LOOP
        v_da_xuat := r_item.SoLuong * r_item.DinhMuc;

        SELECT SoLuongTon INTO v_ton_hien
        FROM   TONKHO_CHINHANH
        WHERE  MaCN = NEW.MaCN AND MaNL = r_item.MaNL
        FOR UPDATE;

        v_ton_sau := COALESCE(v_ton_hien, 0) + v_da_xuat;

        UPDATE TONKHO_CHINHANH
        SET    SoLuongTon = v_ton_sau,
               UpdatedAt  = NOW()
        WHERE  MaCN = NEW.MaCN AND MaNL = r_item.MaNL;

        INSERT INTO NHATKYKHO (
            MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau,
            NguonPhatSinh, MaChungTu, MaNVThucHien, GhiChu
        ) VALUES (
            NEW.MaCN, r_item.MaNL, 'ReverseExport', v_da_xuat, COALESCE(v_ton_hien, 0), v_ton_sau,
            'HOADON', NEW.MaHD, NEW.MaNV, 'Đảo bút toán kho khi huỷ HĐ ' || NEW.MaHD
        );
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hoadon_reverse_inventory
AFTER UPDATE ON HOADON
FOR EACH ROW EXECUTE FUNCTION fn_reverse_inventory_on_cancel();

-- ------------------------------------------------------------
-- 1.5 Trigger: Cập nhật kho khi phiếu nhập được xác nhận (Received)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_import_inventory_on_receive()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    r_ct       RECORD;
    v_ton_hien NUMERIC(12,3);
    v_ton_sau  NUMERIC(12,3);
BEGIN
    IF NOT (OLD.TrangThai IN ('Draft') AND NEW.TrangThai = 'Received') THEN
        RETURN NEW;
    END IF;

    FOR r_ct IN
        SELECT MaNL, SoLuong, DonGia
        FROM   CHITIET_PHIEUNHAP
        WHERE  MaPN = NEW.MaPN
    LOOP
        SELECT SoLuongTon INTO v_ton_hien
        FROM   TONKHO_CHINHANH
        WHERE  MaCN = NEW.MaCN AND MaNL = r_ct.MaNL;

        IF NOT FOUND THEN
            INSERT INTO TONKHO_CHINHANH (MaCN, MaNL, SoLuongTon, GiaNhapGanNhat)
            VALUES (NEW.MaCN, r_ct.MaNL, r_ct.SoLuong, r_ct.DonGia);
            v_ton_hien := 0;
            v_ton_sau  := r_ct.SoLuong;
        ELSE
            v_ton_sau := v_ton_hien + r_ct.SoLuong;
            UPDATE TONKHO_CHINHANH
            SET    SoLuongTon      = v_ton_sau,
                   GiaNhapGanNhat  = r_ct.DonGia,
                   UpdatedAt       = NOW()
            WHERE  MaCN = NEW.MaCN AND MaNL = r_ct.MaNL;
        END IF;

        INSERT INTO NHATKYKHO (
            MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau,
            NguonPhatSinh, MaChungTu, MaNVThucHien, GhiChu
        ) VALUES (
            NEW.MaCN, r_ct.MaNL, 'Import', r_ct.SoLuong, v_ton_hien, v_ton_sau,
            'PHIEUNHAP', NEW.MaPN, NEW.MaNVLap, 'Nhập kho tự động từ phiếu nhập ' || NEW.MaPN
        );
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_phieunhap_import_inventory
AFTER UPDATE ON PHIEUNHAP
FOR EACH ROW EXECUTE FUNCTION fn_import_inventory_on_receive();

-- ------------------------------------------------------------
-- 1.6 Trigger: Kiểm soát thanh toán hóa đơn
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_and_complete_payment()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_hd_status    VARCHAR(20);
    v_hd_total     NUMERIC(15,2);
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RETURN NEW;
    END IF;

    SELECT TrangThai, TongThanhToan INTO v_hd_status, v_hd_total
    FROM   HOADON
    WHERE  MaHD = NEW.MaHD;

    IF v_hd_status = 'Cancelled' THEN
        RAISE EXCEPTION 'Không thể thanh toán hóa đơn đã huỷ (MaHD: %)', NEW.MaHD;
    END IF;

    IF v_hd_status = 'Completed' THEN
        RAISE EXCEPTION 'Hóa đơn % đã hoàn tất thanh toán', NEW.MaHD;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_thanhtoan_validate
BEFORE INSERT ON THANHTOAN
FOR EACH ROW EXECUTE FUNCTION fn_validate_and_complete_payment();

CREATE OR REPLACE FUNCTION fn_complete_hoadon_if_paid()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_hd_total   NUMERIC(15,2);
    v_paid_total NUMERIC(15,2);
BEGIN
    IF NEW.TrangThai <> 'Success' OR NEW.LoaiGiaoDich <> 'Payment' THEN
        RETURN NEW;
    END IF;

    SELECT TongThanhToan INTO v_hd_total
    FROM   HOADON WHERE MaHD = NEW.MaHD;

    SELECT COALESCE(SUM(SoTien), 0) INTO v_paid_total
    FROM   THANHTOAN
    WHERE  MaHD = NEW.MaHD AND TrangThai = 'Success' AND LoaiGiaoDich = 'Payment';

    IF v_paid_total >= v_hd_total AND v_hd_total > 0 THEN
        UPDATE HOADON
        SET    TrangThai = 'Completed', UpdatedAt = NOW()
        WHERE  MaHD = NEW.MaHD AND TrangThai = 'Pending';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_thanhtoan_complete_hoadon
AFTER INSERT OR UPDATE ON THANHTOAN
FOR EACH ROW EXECUTE FUNCTION fn_complete_hoadon_if_paid();

-- ------------------------------------------------------------
-- 1.7 Trigger: Kiểm tra xung đột ca làm việc khi phân công
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_shift_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_new_start TIME;
    v_new_end   TIME;
    v_conflict  INTEGER;
BEGIN
    SELECT GioBatDau, GioKetThuc INTO v_new_start, v_new_end
    FROM   CALAM WHERE MaCL = NEW.MaCL;

    SELECT COUNT(*) INTO v_conflict
    FROM   PHANCONG pc
    JOIN   CALAM cl ON cl.MaCL = pc.MaCL
    WHERE  pc.MaNV   = NEW.MaNV
      AND  pc.NgayPhanCong = NEW.NgayPhanCong
      AND  pc.TrangThai NOT IN ('Cancelled')
      AND  pc.MaPC <> COALESCE(NEW.MaPC, '')
      AND  (cl.GioBatDau, cl.GioKetThuc) OVERLAPS (v_new_start, v_new_end);

    IF v_conflict > 0 THEN
        RAISE EXCEPTION 'Nhân viên % đã được phân công ca trùng giờ vào ngày %', NEW.MaNV, NEW.NgayPhanCong;
    END IF;

    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_phancong_check_conflict
BEFORE INSERT OR UPDATE ON PHANCONG
FOR EACH ROW EXECUTE FUNCTION fn_check_shift_conflict();

-- ------------------------------------------------------------
-- 1.8 Trigger: Tích điểm khách hàng 
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_tich_diem_khach_hang()
RETURNS TRIGGER AS $$
DECLARE
    v_diem_cong INT;
    v_diem_moi  INT;
BEGIN
    IF (NEW.TrangThai = 'Completed' AND NEW.MaKH IS NOT NULL) THEN
        v_diem_cong := FLOOR(NEW.TongThanhToan * 0.01);
        IF v_diem_cong < 1 AND NEW.TongThanhToan > 0 THEN v_diem_cong := 1; END IF;

        UPDATE KHACHHANG SET DiemTichLuy = DiemTichLuy + v_diem_cong WHERE MaKH = NEW.MaKH RETURNING DiemTichLuy INTO v_diem_moi;

        UPDATE KHACHHANG SET HangThanhVien = CASE 
            WHEN v_diem_moi >= 19000 THEN 'Platinum'
            WHEN v_diem_moi >= 15000 THEN 'Gold'
            WHEN v_diem_moi >= 10000 THEN 'Silver'
            ELSE 'Bronze'
        END WHERE MaKH = NEW.MaKH;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hoadon_tich_diem AFTER INSERT OR UPDATE ON HOADON FOR EACH ROW EXECUTE FUNCTION fn_tich_diem_khach_hang();

-- ------------------------------------------------------------
-- 1.9 Trigger: Tự động cập nhật UpdatedAt
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updatedat()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.UpdatedAt := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chinhanh_updatedat    BEFORE UPDATE ON CHINHANH    FOR EACH ROW EXECUTE FUNCTION fn_set_updatedat();
CREATE TRIGGER trg_sanpham_updatedat     BEFORE UPDATE ON SANPHAM      FOR EACH ROW EXECUTE FUNCTION fn_set_updatedat();
CREATE TRIGGER trg_nguyenlieu_updatedat  BEFORE UPDATE ON NGUYENLIEU   FOR EACH ROW EXECUTE FUNCTION fn_set_updatedat();
CREATE TRIGGER trg_nhanvien_updatedat    BEFORE UPDATE ON NHANVIEN     FOR EACH ROW EXECUTE FUNCTION fn_set_updatedat();
CREATE TRIGGER trg_khachhang_updatedat   BEFORE UPDATE ON KHACHHANG    FOR EACH ROW EXECUTE FUNCTION fn_set_updatedat();
CREATE TRIGGER trg_hoadon_updatedat      BEFORE UPDATE ON HOADON       FOR EACH ROW EXECUTE FUNCTION fn_set_updatedat();


-- ============================================================
-- PHẦN 2: STORED PROCEDURES & FUNCTIONS
-- ============================================================

-- ------------------------------------------------------------
-- 2.1 SP CÓ SỬ DỤNG CURSOR TƯỜNG MINH (EXPLICIT CURSOR) - [BỔ SUNG CHO ĐỒ ÁN]
-- Mục đích: Duyệt danh sách nguyên vật liệu chạm ngưỡng tối thiểu
--           theo từng chi nhánh và đưa ra thông báo kết xuất hệ thống
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_BatchAuditLowInventory(p_macn VARCHAR(20))
LANGUAGE plpgsql AS $$
DECLARE
    -- Khai báo Explicit Cursor (Con trỏ tường minh)
    cur_low_stock CURSOR FOR 
        SELECT nl.MaNL, nl.TenNL, tk.SoLuongTon, tk.TonToiThieu, nl.DonViTinh
        FROM   TONKHO_CHINHANH tk
        JOIN   NGUYENLIEU nl ON nl.MaNL = tk.MaNL
        WHERE  tk.MaCN = p_macn AND tk.SoLuongTon < tk.TonToiThieu
          AND  nl.TrangThai = 'Active';
          
    -- Khai báo biến lưu dữ liệu thu được từ dòng Cursor
    v_manl      VARCHAR(20);
    v_tennl     VARCHAR(100);
    v_sl_ton    NUMERIC(12,3);
    v_min_ton   NUMERIC(12,3);
    v_dvt       VARCHAR(20);
    v_count     INTEGER := 0;
BEGIN
    RAISE NOTICE '=== BÁO CÁO KIỂM TOÁN NGUYÊN LIỆU THIẾU HỤT TẠI CHI NHÁNH % ===', p_macn;
    
    -- Mở con trỏ thực thi truy vấn
    OPEN cur_low_stock;
    
    LOOP
        -- Fetch từng dòng dữ liệu từ Cursor đổ vào các biến mục tiêu
        FETCH cur_low_stock INTO v_manl, v_tennl, v_sl_ton, v_min_ton, v_dvt;
        
        -- Thoát khỏi vòng lặp khi con trỏ đi đến dòng cuối cùng (Không tìm thấy dữ liệu tiếp theo)
        EXIT WHEN NOT FOUND;
        
        v_count := v_count + 1;
        RAISE NOTICE 'Cảnh báo % -> Mã NL: % | Tên: % | Hiện tồn: % % | Ngưỡng tối thiểu: % % (Thiếu: % %)',
            v_count, v_manl, v_tennl, v_sl_ton, v_dvt, v_min_ton, v_dvt, (v_min_ton - v_sl_ton), v_dvt;
    END LOOP;
    
    -- Giải phóng vùng nhớ con trỏ sau khi kết thúc vòng lặp
    CLOSE cur_low_stock;
    
    IF v_count = 0 THEN
        RAISE NOTICE 'Trạng thái kho an toàn. Không phát hiện vật tư thiếu hụt tại chi nhánh %.', p_macn;
    END IF;
    RAISE NOTICE '======================================================================';
END;
$$;

-- Cách gọi demo kiểm thử: CALL sp_BatchAuditLowInventory('CN001');

-- ------------------------------------------------------------
-- 2.2 SP: Tính lương nhân viên theo tháng
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_CalculateMonthlySalary(
    p_manv   VARCHAR(20) DEFAULT NULL,
    p_thang  INTEGER     DEFAULT EXTRACT(MONTH FROM NOW())::INTEGER,
    p_nam    INTEGER     DEFAULT EXTRACT(YEAR  FROM NOW())::INTEGER
)
RETURNS TABLE (
    MaNV         VARCHAR(20),
    HoTen        VARCHAR(100),
    TenBP        VARCHAR(50),
    Thang        INTEGER,
    Nam          INTEGER,
    TongCaLam    BIGINT,
    DonGiaCa     NUMERIC(15,2),
    TongLuong    NUMERIC(15,2)
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        nv.MaNV, nv.HoTen, bp.TenBP, p_thang, p_nam,
        COUNT(pc.MaCL), nv.DonGiaCa, COUNT(pc.MaCL) * nv.DonGiaCa
    FROM  NHANVIEN nv
    JOIN  BOPHAN bp ON bp.MaBP = nv.MaBP
    LEFT JOIN PHANCONG pc ON pc.MaNV = nv.MaNV
           AND EXTRACT(MONTH FROM pc.Ngay) = p_thang
           AND EXTRACT(YEAR  FROM pc.Ngay) = p_nam
           AND pc.TrangThai = 'Done'
    WHERE (p_manv IS NULL OR nv.MaNV = p_manv) AND nv.TrangThai = 'Active'
    GROUP BY nv.MaNV, nv.HoTen, bp.TenBP, nv.DonGiaCa
    ORDER BY nv.HoTen;
END;
$$;

-- ------------------------------------------------------------
-- 2.3 SP: Cập nhật điểm tích lũy và hạng thành viên khách hàng
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_UpdateCustomerLoyalty(p_mahd VARCHAR(20))
LANGUAGE plpgsql AS $$
DECLARE
    v_makh          VARCHAR(20);
    v_tongthanhtoan NUMERIC(15,2);
    v_them_diem     INTEGER;
    v_diem_moi      INTEGER;
    v_hang_moi      VARCHAR(20);
BEGIN
    SELECT MaKH, TongThanhToan INTO v_makh, v_tongthanhtoan
    FROM   HOADON
    WHERE  MaHD = p_mahd AND TrangThai = 'Completed';

    IF v_makh IS NULL THEN
        RETURN;
    END IF;

    v_them_diem := FLOOR(v_tongthanhtoan / 1000)::INTEGER;

    UPDATE KHACHHANG
    SET    DiemTichLuy = DiemTichLuy + v_them_diem
    WHERE  MaKH = v_makh
    RETURNING DiemTichLuy INTO v_diem_moi;

    v_hang_moi := CASE
        WHEN v_diem_moi >= 15000 THEN 'Platinum'
        WHEN v_diem_moi >= 10000  THEN 'Gold'
        WHEN v_diem_moi >= 5000  THEN 'Silver'
        ELSE 'Bronze'
    END;

    UPDATE KHACHHANG
    SET    HangThanhVien = v_hang_moi, UpdatedAt = NOW()
    WHERE  MaKH = v_makh;
END;
$$;

-- ------------------------------------------------------------
-- 2.4 SP: Điều chỉnh tồn kho thủ công (kiểm kho thực tế)
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_AdjustInventory(
    p_macn     VARCHAR(20),
    p_manl     VARCHAR(20),
    p_sl_thuc  NUMERIC(12,3),
    p_manv     VARCHAR(20),
    p_ghichu   TEXT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_sl_he_thong NUMERIC(12,3);
    v_chenh_lech  NUMERIC(12,3);
    v_loai        VARCHAR(20);
BEGIN
    SELECT SoLuongTon INTO v_sl_he_thong
    FROM   TONKHO_CHINHANH
    WHERE  MaCN = p_macn AND MaNL = p_manl
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Không tìm thấy tồn kho cho NL % tại CN %', p_manl, p_macn;
    END IF;

    v_chenh_lech := ABS(p_sl_thuc - v_sl_he_thong);

    IF p_sl_thuc = v_sl_he_thong THEN
        RETURN;
    END IF;

    v_loai := CASE WHEN p_sl_thuc < v_sl_he_thong THEN 'Wastage' ELSE 'Adjustment' END;

    UPDATE TONKHO_CHINHANH
    SET    SoLuongTon = p_sl_thuc, UpdatedAt = NOW()
    WHERE  MaCN = p_macn AND MaNL = p_manl;

    INSERT INTO NHATKYKHO (
        MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau, NguonPhatSinh, MaNVThucHien, GhiChu
    ) VALUES (
        p_macn, p_manl, v_loai, v_chenh_lech, v_sl_he_thong, p_sl_thuc,
        'KIEMKHO', p_manv, COALESCE(p_ghichu, 'Kiểm kho điều chỉnh lúc ' || NOW()::TEXT)
    );
END;
$$;

-- ------------------------------------------------------------
-- 2.5 SP: Tạo hóa đơn mới (sp_CreateDraftOrder)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_CreateDraftOrder(
    p_macn        VARCHAR(20),
    p_manv        VARCHAR(20),
    p_makh        VARCHAR(20) DEFAULT NULL,
    p_loai_don    VARCHAR(20) DEFAULT 'DineIn',
    p_ghichu      TEXT        DEFAULT NULL
) RETURNS VARCHAR(20)
LANGUAGE plpgsql AS $$
DECLARE
    v_mahd VARCHAR(20);
BEGIN
    v_mahd := 'HD' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(NEXTVAL('seq_hoadon')::TEXT, 4, '0');

    INSERT INTO HOADON (MaHD, MaCN, MaNV, MaKH, LoaiDonHang, TrangThai, GhiChu)
    VALUES (v_mahd, p_macn, p_manv, p_makh, p_loai_don, 'Pending', p_ghichu);

    RETURN v_mahd;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS seq_hoadon START 1;


-- ============================================================
-- PHẦN 3: VIEWS & MATERIALIZED VIEWS
-- ============================================================

-- ------------------------------------------------------------
-- 3.1 VIEW: Bảng lương nhân viên theo tháng
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_BangLuongNhanVien AS
SELECT
    nv.MaNV, nv.HoTen, bp.TenBP, cn.TenCN,
    TO_CHAR(pc.NgayPhanCong, 'MM/YYYY')    AS ThangNam,
    COUNT(pc.MaCL)                 AS TongCaLam,
    nv.DonGiaCa,
    COUNT(pc.MaCL) * nv.DonGiaCa   AS TongLuong
FROM  NHANVIEN nv
JOIN  BOPHAN   bp ON bp.MaBP = nv.MaBP
LEFT JOIN PHANCONG  pc ON pc.MaNV = nv.MaNV AND pc.TrangThai = 'Done'
LEFT JOIN CHINHANH  cn ON cn.MaCN = pc.MaCN
WHERE nv.TrangThai = 'Active'
GROUP BY nv.MaNV, nv.HoTen, bp.TenBP, cn.TenCN, TO_CHAR(pc.NgayPhanCong, 'MM/YYYY'), nv.DonGiaCa;

-- ------------------------------------------------------------
-- 3.2 VIEW: Tồn kho thấp dưới mức tối thiểu (cảnh báo hệ thống)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_CanhBaoTonKho AS
SELECT
    cn.TenCN, nl.TenNL, nl.DonViTinh, tk.SoLuongTon, tk.TonToiThieu,
    (tk.TonToiThieu - tk.SoLuongTon) AS ThieuSoLuong
FROM  TONKHO_CHINHANH tk
JOIN  CHINHANH   cn ON cn.MaCN = tk.MaCN
JOIN  NGUYENLIEU nl ON nl.MaNL = tk.MaNL
WHERE tk.SoLuongTon < tk.TonToiThieu AND nl.TrangThai = 'Active'
ORDER BY cn.TenCN, ThieuSoLuong DESC;

-- ------------------------------------------------------------
-- 3.3 VIEW: Chi tiết hóa đơn đầy đủ thông tin CRM
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_HoaDonChiTiet AS
SELECT
    hd.MaHD, hd.NgayLap, cn.TenCN, nv.HoTen AS TenNhanVien, kh.HoTen AS TenKhachHang,
    kh.HangThanhVien, hd.LoaiDonHang, sp.TenSP, cd.SoLuong, cd.GiaBanTaiThoiDiem,
    cd.ThanhTien, hd.GiamGia, hd.TongThanhToan, hd.TrangThai
FROM  HOADON        hd
JOIN  CHINHANH      cn ON cn.MaCN = hd.MaCN
JOIN  NHANVIEN      nv ON nv.MaNV = hd.MaNV
LEFT JOIN KHACHHANG kh ON kh.MaKH = hd.MaKH
JOIN  CHITIET_HOADON cd ON cd.MaHD = hd.MaHD
JOIN  SANPHAM        sp ON sp.MaSP = cd.MaSP;

-- ------------------------------------------------------------
-- 3.4 MATERIALIZED VIEW: Doanh thu thực tế theo ngày/chi nhánh
-- ------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_doanhthu_ngay AS
SELECT
    hd.MaCN, cn.TenCN, DATE(hd.NgayLap) AS Ngay, COUNT(hd.MaHD) AS SoHoaDon,
    SUM(hd.TongTienHang) AS TongTienHang, SUM(hd.GiamGia) AS TongGiamGia, SUM(hd.TongThanhToan) AS TongThanhToan
FROM  HOADON    hd
JOIN  CHINHANH  cn ON cn.MaCN = hd.MaCN
WHERE hd.TrangThai = 'Completed'
GROUP BY hd.MaCN, cn.TenCN, DATE(hd.NgayLap)
WITH DATA;

CREATE UNIQUE INDEX idx_mv_doanhthu_ngay ON mv_doanhthu_ngay (MaCN, Ngay);

-- ------------------------------------------------------------
-- 3.5 MATERIALIZED VIEW: Top sản phẩm bán chạy nhất toàn chuỗi
-- ------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_top_sanpham AS
SELECT
    hd.MaCN, cn.TenCN, cd.MaSP, sp.TenSP, ls.TenLoai,
    SUM(cd.SoLuong) AS TongSoLuongBan, SUM(cd.ThanhTien) AS TongDoanhThu, COUNT(DISTINCT hd.MaHD) AS SoHoaDon
FROM  CHITIET_HOADON cd
JOIN  HOADON    hd ON hd.MaHD = cd.MaHD AND hd.TrangThai = 'Completed'
JOIN  CHINHANH  cn ON cn.MaCN = hd.MaCN
JOIN  SANPHAM   sp ON sp.MaSP = cd.MaSP
JOIN  LOAISANPHAM ls ON ls.MaLoai = sp.MaLoai
GROUP BY hd.MaCN, cn.TenCN, cd.MaSP, sp.TenSP, ls.TenLoai
WITH DATA;

CREATE UNIQUE INDEX idx_mv_top_sp ON mv_top_sanpham (MaCN, MaSP);

-- ------------------------------------------------------------
-- 3.6 VIEW: Thống kê Tài chính P&L tổng hợp 12 tháng gần nhất
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_TongHopTaiChinh AS
SELECT
    cn.MaCN, cn.TenCN, TO_CHAR(DATE_TRUNC('month', period_date), 'MM/YYYY') AS ThangNam,
    COALESCE(doanhthu.TongTT, 0) AS DoanhThu, COALESCE(chiphi.TongPC, 0) AS ChiPhi, COALESCE(nhaphang.TongPN, 0) AS ChiPhiNhapHang,
    COALESCE(doanhthu.TongTT, 0) - COALESCE(chiphi.TongPC, 0) - COALESCE(nhaphang.TongPN, 0) AS LoiNhuanUocTinh
FROM CHINHANH cn
CROSS JOIN (
    SELECT generate_series(DATE_TRUNC('month', NOW() - INTERVAL '11 months'), DATE_TRUNC('month', NOW()), '1 month') AS period_date
) months
LEFT JOIN (
    SELECT MaCN, DATE_TRUNC('month', NgayLap) AS thang, SUM(TongThanhToan) AS TongTT
    FROM   HOADON WHERE TrangThai = 'Completed' GROUP BY MaCN, DATE_TRUNC('month', NgayLap)
) doanhthu ON doanhthu.MaCN = cn.MaCN AND doanhthu.thang = months.period_date
LEFT JOIN (
    SELECT MaCN, DATE_TRUNC('month', NgayChi) AS thang, SUM(SoTien) AS TongPC
    FROM   PHIEUCHI WHERE TrangThai = 'Approved' GROUP BY MaCN, DATE_TRUNC('month', NgayChi)
) chiphi ON chiphi.MaCN = cn.MaCN AND chiphi.thang = months.period_date
LEFT JOIN (
    SELECT MaCN, DATE_TRUNC('month', NgayNhap) AS thang, SUM(TongTien) AS TongPN
    FROM   PHIEUNHAP WHERE TrangThai = 'Received' GROUP BY MaCN, DATE_TRUNC('month', NgayNhap)
) nhaphang ON nhaphang.MaCN = cn.MaCN AND nhaphang.thang = months.period_date
ORDER BY cn.MaCN, months.period_date;


-- ============================================================
-- PHẦN 4: PROCEDURE ĐỒNG BỘ DỮ LIỆU ĐỊNH KỲ (BÁO CÁO NHANH)
-- ============================================================
CREATE OR REPLACE PROCEDURE sp_RefreshAllMaterializedViews()
LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doanhthu_ngay;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_sanpham;
    RAISE NOTICE 'Đã thực hiện làm mới đồng bộ toàn bộ Materialized Views báo cáo lúc %', NOW();
END;
$$;

-- ------------------------------------------------------------
-- Tự động khóa tài khoản khi nhân viên nghỉ việc (An toàn bảo mật)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_deactivate_account_on_hr_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.TrangThai IN ('Resigned', 'Suspended') THEN
        UPDATE TAIKHOAN SET IsActive = FALSE, UpdatedAt = NOW() WHERE MaNV = NEW.MaNV;
    ELSIF NEW.TrangThai = 'Active' THEN
        UPDATE TAIKHOAN SET IsActive = TRUE, UpdatedAt = NOW() WHERE MaNV = NEW.MaNV;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_nhanvien_sync_taikhoan
AFTER UPDATE ON NHANVIEN
FOR EACH ROW
EXECUTE FUNCTION fn_deactivate_account_on_hr_change();

-- ------------------------------------------------------------
-- Ngăn tạo tài khoản cho nhân viên đã nghỉ việc (Chặn lỗi logic)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_taikhoan_insert()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_nv_status VARCHAR(20);
BEGIN
    -- Lấy trạng thái hiện tại của nhân viên
    SELECT TrangThai INTO v_nv_status
    FROM   NHANVIEN
    WHERE  MaNV = NEW.MaNV;

    IF v_nv_status IS NULL THEN
        RAISE EXCEPTION 'Mã nhân viên % không tồn tại trong hệ thống!', NEW.MaNV;
    END IF;

    IF v_nv_status IN ('Resigned', 'Suspended') THEN
        RAISE EXCEPTION 'Không thể cấp tài khoản cho nhân viên đang có trạng thái là: %', v_nv_status;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_taikhoan_validate_insert
BEFORE INSERT ON TAIKHOAN
FOR EACH ROW
EXECUTE FUNCTION fn_validate_taikhoan_insert();

-- ------------------------------------------------------------
-- Tự động cập nhật dòng UpdatedAt của tài khoản
-- ------------------------------------------------------------
CREATE TRIGGER trg_taikhoan_updatedat
BEFORE UPDATE ON TAIKHOAN
FOR EACH ROW
EXECUTE FUNCTION fn_set_updatedat();