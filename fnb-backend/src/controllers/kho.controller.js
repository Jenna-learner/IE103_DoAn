const db = require('../config/db');
const { success } = require('../utils/response');

const getTonKho = async (req, res, next) => {
  try {
    const maCN = req.user.maCN || req.query.maCN;
    const { canhBao } = req.query;
    const params = [];
    const conds = [];

    if (maCN) { params.push(maCN); conds.push(`tk.MaCN = $${params.length}`); }
    if (canhBao === 'true') conds.push('tk.SoLuongTon <= tk.TonToiThieu');

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await db.queryCtx(req, 
      `SELECT tk.MaCN, cn.TenCN, tk.MaNL, nl.TenNL, nl.DonViTinh,
              tk.SoLuongTon, tk.TonToiThieu,
              (tk.SoLuongTon <= tk.TonToiThieu) AS IsCanhBao
       FROM TONKHO_CHINHANH tk
       JOIN CHINHANH cn ON cn.MaCN = tk.MaCN
       JOIN NGUYENLIEU nl ON nl.MaNL = tk.MaNL
       ${where}
       ORDER BY IsCanhBao DESC, nl.TenNL`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

const getNhatKy = async (req, res, next) => {
  try {
    const { maNL, loai, page = 1, limit = 50 } = req.query;
    const maCN = req.user.maCN || req.query.maCN;
    const offset = (page - 1) * limit;
    const params = [];
    const conds = [];

    if (maCN) { params.push(maCN); conds.push(`nk.MaCN = $${params.length}`); }
    if (maNL) { params.push(maNL); conds.push(`nk.MaNL = $${params.length}`); }
    if (loai) { params.push(loai); conds.push(`nk.LoaiBienDong = $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.queryCtx(req, 
      `SELECT nk.*, nk.NgayGhi AS NgayThayDoi, nl.TenNL, nl.DonViTinh, nv.HoTen AS TenNhanVien
       FROM NHATKYKHO nk
       JOIN NGUYENLIEU nl ON nl.MaNL = nk.MaNL
       LEFT JOIN NHANVIEN nv ON nv.MaNV = nk.MaNVThucHien
       ${where}
       ORDER BY nk.NgayGhi DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
};

const getNguyenLieu = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM NGUYENLIEU ORDER BY TenNL`);
    return success(res, rows);
  } catch (err) { next(err); }
};

const createNguyenLieu = async (req, res, next) => {
  try {
    const { MaNL, TenNL, DonViTinh } = req.body;
    await db.query(`INSERT INTO NGUYENLIEU (MaNL, TenNL, DonViTinh) VALUES ($1,$2,$3)`, [MaNL, TenNL, DonViTinh]);
    return success(res, { MaNL }, 'Thêm nguyên liệu thành công', 201);
  } catch (err) { next(err); }
};

const capNhatMucToiThieu = async (req, res, next) => {
  try {
    const { MaCN, MaNL, TonToiThieu } = req.body;
    const maCN = MaCN || req.user.maCN;
    await db.queryCtx(req, `UPDATE TONKHO_CHINHANH SET TonToiThieu = $1, UpdatedAt=NOW() WHERE MaCN = $2 AND MaNL = $3`, [TonToiThieu, maCN, MaNL]);
    return success(res, null, 'Cập nhật mức tồn tối thiểu thành công');
  } catch (err) { next(err); }
};

const kiemKho = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { MaCN, items } = req.body;
    const maCN = MaCN || req.user.maCN;
    const ketQua = [];

    for (const item of items) {
      const { rows } = await client.query(`SELECT SoLuongTon FROM TONKHO_CHINHANH WHERE MaCN = $1 AND MaNL = $2`, [maCN, item.MaNL]);
      if (!rows[0]) continue;

      const soLuongTruoc = parseFloat(rows[0].soluongton);
      const soLuongSau = parseFloat(item.SoLuongThucTe);
      const chenh = soLuongSau - soLuongTruoc;
      if (Math.abs(chenh) < 0.001) continue;

      const loai = 'Adjustment';
      await client.query(`UPDATE TONKHO_CHINHANH SET SoLuongTon = $1, UpdatedAt=NOW() WHERE MaCN = $2 AND MaNL = $3`, [soLuongSau, maCN, item.MaNL]);
      await client.query(
        `INSERT INTO NHATKYKHO (MaCN, MaNL, LoaiBienDong, SoLuong, SoLuongTruoc, SoLuongSau, NguonPhatSinh, MaChungTu, MaNVThucHien, GhiChu)
         VALUES ($1,$2,$3,$4,$5,$6,'KIEMKHO',NULL,$7,$8)`,
        [maCN, item.MaNL, loai, Math.abs(chenh), soLuongTruoc, soLuongSau, req.user.maNV, item.GhiChu || null]
      );
      ketQua.push({ MaNL: item.MaNL, soLuongTruoc, soLuongSau, chenh });
    }

    await client.query('COMMIT');
    return success(res, ketQua, `Kiểm kho hoàn tất. Đã điều chỉnh ${ketQua.length} nguyên liệu.`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

module.exports = { getTonKho, getNhatKy, getNguyenLieu, createNguyenLieu, capNhatMucToiThieu, kiemKho };
