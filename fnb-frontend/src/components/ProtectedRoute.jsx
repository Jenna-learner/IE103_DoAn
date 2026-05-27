/**
 * ProtectedRoute — Bảo vệ trang cần đăng nhập
 * Nếu chưa đăng nhập → redirect về /login
 * Nếu không đủ quyền → hiện trang 403
 */
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children, roles }) {
  const token = useAuthStore((s) => s.token)
  const user  = useAuthStore((s) => s.user)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.vaiTro)) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-200 mb-4">403</div>
          <p className="text-gray-500 text-sm">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    )
  }

  return children
}
