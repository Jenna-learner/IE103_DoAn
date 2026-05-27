/**
 * ============================================
 *   FnB Chain Management System - Server
 *   Node.js + Express.js
 *   Kết nối PostgreSQL qua ZeroTier One VPN
 * ============================================
 */
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');

const { pool }     = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// ── Import Routes (theo schema thực tế) ───────────────────
const authRoutes       = require('./src/routes/auth.routes');
const sanPhamRoutes    = require('./src/routes/sanpham.routes');
const loaiSPRoutes     = require('./src/routes/loaisanpham.routes');
const hoaDonRoutes     = require('./src/routes/hoadon.routes');
const khachHangRoutes  = require('./src/routes/khachhang.routes');
const khoRoutes        = require('./src/routes/kho.routes');
const phieuNhapRoutes  = require('./src/routes/phieunhap.routes');
const phanCongRoutes   = require('./src/routes/phancong.routes');
const phieuChiRoutes   = require('./src/routes/phieuchi.routes');
const baoCaoRoutes     = require('./src/routes/baocao.routes');
const nhanVienRoutes   = require('./src/routes/nhanvien.routes');
const nhaCungCapRoutes = require('./src/routes/nhacungcap.routes');
const chiNhanhRoutes   = require('./src/routes/chinhanh.routes');
// ──────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ──────────────────────────────────────────────────────────

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS server_time');
    res.json({
      status:      'OK',
      db:          `Connected → ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      server_time: rows[0].server_time,
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', db: err.message });
  }
});
// ──────────────────────────────────────────────────────────

// ── API Routes ─────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,          authRoutes);        // Đăng nhập / Thông tin cá nhân
app.use(`${API}/san-pham`,      sanPhamRoutes);     // SANPHAM + CONGTHUC
app.use(`${API}/loai-san-pham`, loaiSPRoutes);      // LOAISANPHAM
app.use(`${API}/hoa-don`,       hoaDonRoutes);      // HOADON + CHITIET_HOADON + THANHTOAN
app.use(`${API}/khach-hang`,    khachHangRoutes);   // KHACHHANG (CRM)
app.use(`${API}/kho`,           khoRoutes);         // TONKHO_CHINHANH + NHATKYKHO + NGUYENLIEU
app.use(`${API}/phieu-nhap`,    phieuNhapRoutes);   // PHIEUNHAP + CHITIET_PHIEUNHAP
app.use(`${API}/phan-cong`,     phanCongRoutes);    // PHANCONG + CALAM
app.use(`${API}/phieu-chi`,     phieuChiRoutes);    // PHIEUCHI
app.use(`${API}/bao-cao`,       baoCaoRoutes);      // Materialized Views / Reports
app.use(`${API}/nhan-vien`,     nhanVienRoutes);    // NHANVIEN + TAIKHOAN
app.use(`${API}/nha-cung-cap`,  nhaCungCapRoutes);  // NHACUNGCAP
app.use(`${API}/chi-nhanh`,     chiNhanhRoutes);    // CHINHANH + BOPHAN
// ──────────────────────────────────────────────────────────

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} không tồn tại.` });
});

// ── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FnB Backend đang chạy tại http://localhost:${PORT}`);
  console.log(`🗄️  Database : ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} (ZeroTier)`);
  console.log(`🌍 Môi trường: ${process.env.NODE_ENV}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   GET  /api/health          → Kiểm tra kết nối DB`);
  console.log(`   POST /api/v1/auth/login   → Đăng nhập`);
  console.log(`   ...  (xem SETUP_GUIDE.md)`);
});

module.exports = app;
