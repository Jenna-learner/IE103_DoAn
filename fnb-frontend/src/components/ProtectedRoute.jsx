/**
 * ProtectedRoute — Bảo vệ trang cần đăng nhập
 * Nếu chưa đăng nhập → redirect về /login
 * Nếu không đủ quyền → hiện trang 403
 */
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const VALID_ROLES = ['role_admin', 'role_cashier', 'role_warehouse_staff', 'role_readonly']

export default function ProtectedRoute({ children, roles }) {
  const token  = useAuthStore((s) => s.token)
  const user   = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  // Role không hợp lệ (session cũ trước khi đổi tên) → logout + về login
  if (!VALID_ROLES.includes(user.vaiTro)) {
    logout()
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.vaiTro)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-200 mb-4">403</div>
          <p className="text-gray-500 text-sm mb-4">Bạn không có quyền truy cập trang này.</p>
          <button
            onClick={() => window.history.back()}
            className="text-xs text-brand-600 hover:underline"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    )
  }

  return children
}
