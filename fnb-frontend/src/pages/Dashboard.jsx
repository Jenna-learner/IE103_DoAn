/**
 * Dashboard — Placeholder (sẽ viết chi tiết sau)
 * Hiển thị card KPI và thông báo "đang phát triển"
 */
import { LayoutDashboard, TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react'
import useAuthStore from '../store/authStore'

const ROLE_LABEL = {
  admin:            'Quản trị viên hệ thống',
  quan_ly_chinhanh: 'Quản lý chi nhánh',
  thu_ngan:         'Thu ngân',
  kho:              'Nhân viên kho',
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-6">
      {/* Header chào mừng */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Xin chào, {user?.hoTen} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {ROLE_LABEL[user?.vaiTro]} {user?.tenCN ? `— ${user.tenCN}` : ''}
        </p>
      </div>

      {/* Cards KPI (placeholder) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Doanh thu hôm nay',   value: '—',  icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Số hóa đơn',          value: '—',  icon: ShoppingCart, color: 'text-brand-600',  bg: 'bg-brand-50'  },
          { label: 'Tổng giảm giá',       value: '—',  icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50'  },
          { label: 'Cảnh báo tồn kho',    value: '—',  icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50'   },
        ].map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon size={20} className={card.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Thông báo đang phát triển */}
      <div className="card border-dashed border-2 border-gray-200 flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
          <LayoutDashboard size={28} className="text-brand-500" />
        </div>
        <h3 className="font-semibold text-gray-700 mb-1">Dashboard đang được xây dựng</h3>
        <p className="text-gray-400 text-sm max-w-sm">
          Biểu đồ doanh thu, top sản phẩm và thống kê real-time sẽ hiển thị ở đây khi kết nối database.
        </p>
      </div>
    </div>
  )
}
