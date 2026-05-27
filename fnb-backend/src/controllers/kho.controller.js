/**
 * Controller: KHO (Tồn kho & Nhật ký)
 * Bảng: TONKHO_CHINHANH, NHATKYKHO, NGUYENLIEU
 *
 * Không có bảng stock_checks riêng.
 * Điều chỉnh kiểm kho dùng NHATKYKHO với LoaiBienDong = 'Audit_Loss' | 'Audit_Gain'
 */
const db = require('../config/db');
const { success, error } = require('../utils/response');

// GET /api/v1/kho/ton-kho?maCN=&canhBao=true
const getTonKho = async (req, res, next) => {
  try {
    const maCN = req.user.maCN || req.query.maCN;
    const { canhBao } = req.query;

    let where = maCN ? `WHERE tk.MaCN = '${maCN}'` : '';
    if (canhBao === 'true') {
      where += (where ? ' AND' : 'WHERE') + ' tk.SoLuongTon <= tk.TonToiThieu';
    }

    const { rows } = await db.query(
      `SELECT tk.MaCN, cn.TenCN, tk.MaNL, nl.TenNL, nl.DonViTinh,
              tk.SoLuongTon, tk.TonToiThieu,
              (tk.SoLuongTon <= tk.TonToiThieu) AS IsCanhBao
       FROM TONKHO_CHINHANH tk
       JOIN CHINHANH cn    ON cn.MaCN = tk.MaCN
       JOIN NGUYENLIEU nl  ON nl.MaNL = tk.MaNL
       ${where}
       ORDER BY IsCanhBao DESC, nl.TenNL`
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/kho/nhat-ky?maCN=&maNL=&loai=&page=
const getNhatKy = async (req, res, next) => {
  try {
    const { maNL, loai, page = 1, limit = 50 } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    if (maCN)  { params.push(maCN);  conds.push(`nk.MaCN = $${params.length}`); }
    if (maNL)  { params.push(maNL);  conds.push(`nk.MaNL = $${params.length}`); }
    if (loai)  { params.push(loai);  conds.push(`nk.LoaiBienDong = $${params.length}`); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT nk.*, nl.TenNL, nl.DonViTinh, nv.HoTen AS TenNhanVien
       FROM NHATKYKHO nk
       JOIN NGUYENLIEU nl ON nl.MaNL = nk.MaNL
       LEFT JOIN NHANVIEN nv ON nv.MaNV = nk.MaNVThucHien
       ${where}
       ORDER BY nk.NgayThayDoi DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

// GET /api/v1/kho/nguyen-lieu  (danh sách nguyên liệu)
const getNguyenLieu = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM NGUYENLIEU ORDER BY TenNL`);
    return success(res, rows);
  } catch (err) { next(err); }
};

// POST /api/v1/kho/nguyen-lieu  (thêm nguyên liệu mới)
const createNguyenLieu = async (req, res, next) => {
  try {
    const { MaNL, TenNL, DonViTinh, LoaiVARCHAR } = req.body;
    await db.query(
      `INSERT INTO NGUYENLIEU (MaNL, TenNL, DonViTinh, LoaiVARCHAR) VALUES ($1,$2,$3,$4)`,
      [MaNL, TenNL, DonViTinh, LoaiVARCHAR]
    );
    return success(res, { MaNL }, 'Thêm nguyên liệu thành công', 201);
  } catch (err) { next(err); }
};

// PUT /api/v1/kho/ton-kho/muc-toi-thieu  (cập nhật mức tồn tối thiểu)
const capNhatMucToiThieu = async (req, res, next) => {
  try {
    const { MaCN, MaNL, TonToiThieu } = req.body;
    const maCN = MaCN || req.user.maCN;
    await db.query(
      `UPDATE TONKHO_CHINHANH SET TonToiThieu = $1 WHERE MaCN = $2 AND MaNL = $3`,
      [TonToiThieu, maCN, MaNL]
    );
    return success(res, null, 'Cập nhật mức tồn tối thiểu thành công');
  } catch (err) { next(err); }
};

// POST /api/v1/kho/kiem-kho  (Điều chỉnh kiểm kho - ghi Audit_Loss / Audit_Gain)
const kiemKho = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaCN, items, GhiChu } = req.body;
    // items: [{ MaNL, SoLuongThucTe }]
    const maCN = MaCN || req.user.maCN;
    const ketQua = [];

    for (const item of items) {
      const { rows } = await client.query(
        `SELECT SoLuongTon FROM TONKHO_CHINHANH WHERE MaCN = $1 AND MaNL = $2`,
        [maCN, item.MaNL]
      );
      if (!rows[0]) continue;

      const soLuongTruoc = parseFloat(rows[0].soluongton);
      const soLuongSau   = parseFloat(item.SoLuongThucTe);
      const chenh = soLuongSau - soLuongTruoc;

      if (Math.abs(chenh) < 0.001) continue; // Không có chênh lệch

      const loai = chenh < 0 ? 'Audit_Loss' : 'Audit_Gain';

      await client.query(
        `UPDATE TONKHO_CHINHANH SET SoLuongTon = $1 WHERE MaCN = $2 AND MaNL = $3`,
        [soLuongSau, maCN, item.MaNL]
      );
      await client.query(
        `INSERT INTO NHATKYKHO (MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau,
                                NguonPhatSinh, MaChungTu, MaNVThucHien)
         VALUES ($1,$2,$3,$4,$5,$6,'Kiem Kho Dinh Ky',NULL,$7)`,
        [maCN, item.MaNL, loai, Math.abs(chenh), soLuongTruoc, soLuongSau, req.user.maNV]
      );
      ketQua.push({ MaNL: item.MaNL, soLuongTruoc, soLuongSau, chenh, loai });
    }

    await client.query('COMMIT');
    return success(res, ketQua, `Kiểm kho hoàn tất. Đã điều chỉnh ${ketQua.length} nguyên liệu.`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

module.exports = { getTonKho, getNhatKy, getNguyenLieu, createNguyenLieu, capNhatMucToiThieu, kiemKho };
