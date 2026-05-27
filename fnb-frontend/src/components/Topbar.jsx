/**
 * Topbar — Thanh tiêu đề phía trên
 * Hiển thị: nút toggle sidebar | tiêu đề trang | tên chi nhánh | nút logout
 */
import { Menu, Bell, LogOut, RefreshCw } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

// Map path → Tiêu đề trang
const PAGE_TITLE = {
  '/dashboard':      'Dashboard',
  '/pos':            'POS — Bán hàng',
  '/hoa-don':        'Lịch sử Hóa đơn',
  '/khach-hang':     'Khách hàng CRM',
  '/kho/ton-kho':    'Quản lý Tồn kho',
  '/kho/nhat-ky':    'Nhật ký Biến động Kho',
  '/phieu-nhap':     'Phiếu Nhập hàng',
  '/phan-cong':      'Phân công Ca làm việc',
  '/phieu-chi':      'Phiếu Chi vận hành',
  '/bao-cao':        'Báo cáo & Thống kê',
  '/san-pham':       'Quản lý Sản phẩm',
  '/chi-nhanh':      'Chi nhánh & Bộ phận',
  '/nhan-vien':      'Quản lý Nhân viên',
}

export default function Topbar({ onToggleSidebar }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const logout    = useAuthStore((s) => s.logout)
  const user      = useAuthStore((s) => s.user)

  const title = PAGE_TITLE[location.pathname] || 'FnB Chain'

  const handleLogout = () => {
    logout()
    toast.success('Đã đăng xuất')
    navigate('/login', { replace: true })
  }

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-4 shrink-0">
      {/* Toggle Sidebar */}
      <button
        onClick={onToggleSidebar}
        className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Tiêu đề trang */}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 text-sm truncate">{title}</h1>
        <p className="text-gray-400 text-xs hidden sm:block">{today}</p>
      </div>

      {/* Chi nhánh */}
      {user?.tenCN && (
        <div className="hidden md:flex items-center gap-1.5 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-lg">
          <span className="text-[10px] text-brand-600 font-medium">📍 {user.tenCN}</span>
        </div>
      )}

      {/* Nút thông báo (placeholder) */}
      <button className="relative text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
        <Bell size={18} />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>

      {/* Nút Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors text-sm"
        title="Đăng xuất"
      >
        <LogOut size={16} />
        <span className="hidden sm:block text-xs font-medium">Đăng xuất</span>
      </button>
    </header>
  )
}
