/**
 * App.jsx — Cấu hình React Router
 *
 * Route tree:
 *   /login              → Trang đăng nhập (public)
 *   /                   → AppLayout (protected)
 *     /dashboard        → Dashboard
 *     /pos              → POS Bán hàng
 *     /hoa-don          → Lịch sử Hóa đơn
 *     /khach-hang       → Khách hàng CRM
 *     /kho/ton-kho      → Tồn kho
 *     /kho/nhat-ky      → Nhật ký kho
 *     /phieu-nhap       → Phiếu nhập
 *     /phan-cong        → Phân công ca
 *     /phieu-chi        → Phiếu chi
 *     /bao-cao          → Báo cáo
 *     /san-pham         → Sản phẩm
 *     /chi-nhanh        → Chi nhánh
 *     /nhan-vien        → Nhân viên
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import AppLayout      from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import POS            from './pages/POS'
import HoaDon         from './pages/HoaDon'
import HoaDonDetail   from './pages/HoaDonDetail'
import KhachHang      from './pages/KhachHang'
import TonKho         from './pages/TonKho'
import KiemKho        from './pages/KiemKho'
import PhieuNhap     from './pages/PhieuNhap'
import PhanCong      from './pages/PhanCong'
import PhieuChi      from './pages/PhieuChi'
import ComingSoon     from './pages/ComingSoon'

// Tất cả vai trò
const ALL = ['role_admin', 'role_readonly', 'role_cashier', 'role_warehouse_staff']
// Chỉ quản lý trở lên
const MANAGER = ['role_admin', 'role_readonly']
// Chỉ role_admin
const ADMIN = ['role_admin']

// Trang mặc định theo vai trò (dùng cho redirect từ /)
const ROLE_HOME = {
  role_admin:            '/dashboard',
  role_readonly: '/dashboard',
  role_cashier:         '/pos',
  role_warehouse_staff:              '/kho/ton-kho',
}

// Redirect thông minh: về đúng trang theo vai trò thay vì luôn /dashboard
function SmartRedirect() {
  const user = useAuthStore((s) => s.user)
  const home = ROLE_HOME[user?.vaiTro] || '/dashboard'
  return <Navigate to={home} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '13px', borderRadius: '10px', maxWidth: '360px' },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — dùng AppLayout làm wrapper */}
        <Route
          path="/"
          element={
            <ProtectedRoute roles={ALL}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirect root → trang phù hợp với vai trò */}
          <Route index element={<SmartRedirect />} />

          {/* Dashboard — quản lý */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={MANAGER}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* POS — thu ngân + admin */}
          <Route path="pos"         element={<ProtectedRoute roles={['role_admin','role_cashier']}><POS /></ProtectedRoute>} />
          <Route path="hoa-don"          element={<ProtectedRoute roles={ALL}><HoaDon /></ProtectedRoute>} />
          <Route path="hoa-don/:maHD"    element={<ProtectedRoute roles={ALL}><HoaDonDetail /></ProtectedRoute>} />
          <Route path="khach-hang"       element={<ProtectedRoute roles={['role_admin','role_readonly','role_cashier']}><KhachHang /></ProtectedRoute>} />

          {/* Kho */}
          <Route path="kho">
            <Route path="ton-kho"  element={<ProtectedRoute roles={ALL}><TonKho /></ProtectedRoute>} />
            <Route path="nhat-ky"  element={<ProtectedRoute roles={ALL}><TonKho /></ProtectedRoute>} />
            <Route path="kiem-kho" element={<ProtectedRoute roles={['role_admin','role_readonly','role_warehouse_staff']}><KiemKho /></ProtectedRoute>} />
          </Route>

          {/* Quản lý */}
          <Route path="phieu-nhap" element={<ProtectedRoute roles={['role_admin','role_readonly','role_warehouse_staff']}><PhieuNhap /></ProtectedRoute>} />
          <Route path="phan-cong"  element={<ProtectedRoute roles={MANAGER}><PhanCong /></ProtectedRoute>} />
          <Route path="phieu-chi"  element={<ProtectedRoute roles={ALL}><PhieuChi /></ProtectedRoute>} />
          <Route path="bao-cao"    element={<ProtectedRoute roles={MANAGER}><ComingSoon /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="san-pham"   element={<ProtectedRoute roles={ADMIN}><ComingSoon /></ProtectedRoute>} />
          <Route path="chi-nhanh"  element={<ProtectedRoute roles={ADMIN}><ComingSoon /></ProtectedRoute>} />
          <Route path="nhan-vien"  element={<ProtectedRoute roles={ADMIN}><ComingSoon /></ProtectedRoute>} />

          {/* 404 trong app */}
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}