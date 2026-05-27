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

import AppLayout      from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import POS            from './pages/POS'
import HoaDon         from './pages/HoaDon'
import ComingSoon     from './pages/ComingSoon'

// Tất cả vai trò
const ALL = ['admin', 'quan_ly_chinhanh', 'thu_ngan', 'kho']
// Chỉ quản lý trở lên
const MANAGER = ['admin', 'quan_ly_chinhanh']
// Chỉ admin
const ADMIN = ['admin']

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
          {/* Redirect root → dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

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
          <Route path="pos"         element={<ProtectedRoute roles={['admin','thu_ngan']}><POS /></ProtectedRoute>} />
          <Route path="hoa-don"     element={<ProtectedRoute roles={ALL}><HoaDon /></ProtectedRoute>} />
          <Route path="khach-hang"  element={<ProtectedRoute roles={['admin','thu_ngan','quan_ly_chinhanh']}><ComingSoon /></ProtectedRoute>} />

          {/* Kho */}
          <Route path="kho">
            <Route path="ton-kho"  element={<ProtectedRoute roles={ALL}><ComingSoon /></ProtectedRoute>} />
            <Route path="nhat-ky"  element={<ProtectedRoute roles={ALL}><ComingSoon /></ProtectedRoute>} />
          </Route>

          {/* Quản lý */}
          <Route path="phieu-nhap" element={<ProtectedRoute roles={['admin','quan_ly_chinhanh','kho']}><ComingSoon /></ProtectedRoute>} />
          <Route path="phan-cong"  element={<ProtectedRoute roles={MANAGER}><ComingSoon /></ProtectedRoute>} />
          <Route path="phieu-chi"  element={<ProtectedRoute roles={ALL}><ComingSoon /></ProtectedRoute>} />
          <Route path="bao-cao"    element={<ProtectedRoute roles={MANAGER}><ComingSoon /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="san-pham"   element={<ProtectedRoute roles={ADMIN}><ComingSoon /></ProtectedRoute>} />
          <Route path="chi-nhanh"  element={<ProtectedRoute roles={ADMIN}><ComingSoon /></ProtectedRoute>} />
          <Route path="nhan-vien"  element={<ProtectedRoute roles={ADMIN}><ComingSoon /></ProtectedRoute>} />

          {/* 404 trong app */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-7xl font-bold text-gray-100 mb-3">404</div>
                  <p className="text-gray-400 text-sm">Trang không tồn tại.</p>
                </div>
              </div>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
