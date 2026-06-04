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
import SanPham       from './pages/SanPham'
import ChiNhanh      from './pages/ChiNhanh'
import NhanVien      from './pages/NhanVien'
import NhaCungCap    from './pages/NhaCungCap'
import ComingSoon     from './pages/ComingSoon'
import { ALL_ROLES, ROLE, ROLE_HOME, SALES_ROLES, normalizeRole } from './lib/roles'

const ADMIN = [ROLE.ADMIN]
const EMPLOYEE_VIEW = ALL_ROLES
const INVENTORY_VIEW = ALL_ROLES
const INVENTORY_EDIT = [ROLE.ADMIN, ROLE.BRANCH_MANAGER, ROLE.WAREHOUSE]
const PROCUREMENT_VIEW = [ROLE.ADMIN, ROLE.OPS_DIRECTOR, ROLE.BRANCH_MANAGER, ROLE.WAREHOUSE]
const PRODUCT_VIEW = [ROLE.ADMIN, ROLE.BRANCH_MANAGER]

// Redirect thông minh: về đúng trang theo vai trò thay vì luôn /dashboard
function SmartRedirect() {
  const user = useAuthStore((s) => s.user)
  const home = ROLE_HOME[normalizeRole(user?.vaiTro)] || '/dashboard'
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
            <ProtectedRoute roles={ALL_ROLES}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirect root → trang phù hợp với vai trò */}
          <Route index element={<SmartRedirect />} />

          {/* Dashboard theo từng vai trò */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={ALL_ROLES}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="pos"              element={<ProtectedRoute roles={SALES_ROLES}><POS /></ProtectedRoute>} />
          <Route path="hoa-don"          element={<ProtectedRoute roles={ALL_ROLES}><HoaDon /></ProtectedRoute>} />
          <Route path="hoa-don/:maHD"    element={<ProtectedRoute roles={ALL_ROLES}><HoaDonDetail /></ProtectedRoute>} />
          <Route path="khach-hang"       element={<ProtectedRoute roles={SALES_ROLES}><KhachHang /></ProtectedRoute>} />

          {/* Kho */}
          <Route path="kho">
            <Route path="ton-kho"  element={<ProtectedRoute roles={INVENTORY_VIEW}><TonKho /></ProtectedRoute>} />
            <Route path="nhat-ky"  element={<ProtectedRoute roles={INVENTORY_VIEW}><TonKho /></ProtectedRoute>} />
            <Route path="kiem-kho" element={<ProtectedRoute roles={INVENTORY_EDIT}><KiemKho /></ProtectedRoute>} />
          </Route>

          {/* Quản lý */}
          <Route path="phieu-nhap" element={<ProtectedRoute roles={PROCUREMENT_VIEW}><PhieuNhap /></ProtectedRoute>} />
          <Route path="phan-cong"  element={<ProtectedRoute roles={EMPLOYEE_VIEW}><PhanCong /></ProtectedRoute>} />
          <Route path="phieu-chi"  element={<ProtectedRoute roles={ALL_ROLES}><PhieuChi /></ProtectedRoute>} />
          <Route path="nha-cung-cap" element={<ProtectedRoute roles={ADMIN}><NhaCungCap /></ProtectedRoute>} />

          {/* Quản trị dữ liệu */}
          <Route path="san-pham"   element={<ProtectedRoute roles={PRODUCT_VIEW}><SanPham /></ProtectedRoute>} />
          <Route path="chi-nhanh"  element={<ProtectedRoute roles={ADMIN}><ChiNhanh /></ProtectedRoute>} />
          <Route path="nhan-vien"  element={<ProtectedRoute roles={EMPLOYEE_VIEW}><NhanVien /></ProtectedRoute>} />

          {/* 404 trong app */}
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
