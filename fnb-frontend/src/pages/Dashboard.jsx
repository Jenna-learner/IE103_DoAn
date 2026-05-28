/**
 * UI 04 - Dashboard
 * KPI: doanh thu hom nay, so hoa don, tong giam gia, canh bao ton kho
 * Chart: doanh thu 7 ngay (SVG bar chart)
 * Sections: top san pham, hoa don gan day, canh bao ton kho, phieu chi cho duyet
 */
import { useMemo } from 'react'
import {
  TrendingUp, ShoppingCart, Tag, AlertTriangle,
  Package, Clock, CheckCircle2,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { MOCK_ORDERS, MOCK_TONKHO, MOCK_PHIEU_CHI } from '../lib/mock'

const USE_MOCK = true

const ROLE_LABEL = {
  role_admin:           'Quản trị viên hệ thống',
  role_readonly:        'Giám sát viên',
  role_cashier:         'Thu ngân',
  role_warehouse_staff: 'Nhân viên kho',
}

const fmtVND = (n) => n.toLocaleString('vi-VN') + ' ₫'

const fmtDateShort = (d) => {
  const dt = typeof d === 'string' ? new Date(d) : d
  return String(dt.getDate()).padStart(2,'0') + '/' + String(dt.getMonth()+1).padStart(2,'0')
}

const fmtDateTime = (s) => {
  const d = new Date(s)
  return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') +
    ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')
}

const todayISO = () => new Date().toISOString().split('T')[0]

function RevenueChart({ orders }) {
  const days = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      const revenue = orders
        .filter(o => o.TrangThai === 'Completed' && o.NgayLap.startsWith(dateStr))
        .reduce((s, o) => s + o.TongThanhToan, 0)
      return { label: fmtDateShort(d), dateStr, revenue }
    })
  }, [orders])

  const maxRev = Math.max(...days.map(d => d.revenue), 1)
  const BAR_W = 36
  const GAP   = 14
  const CHART_H = 110
  const today = todayISO()

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        width={days.length * (BAR_W + GAP) - GAP}
        height={CHART_H + 40}
        style={{ display: 'block', minWidth: '100%' }}
      >
        {days.map((d, i) => {
          const barH = d.revenue > 0 ? Math.max((d.revenue / maxRev) * CHART_H, 6) : 3
          const x = i * (BAR_W + GAP)
          const y = CHART_H - barH
          const isToday = d.dateStr === today
          const color = isToday ? '#f97316' : '#3b82f6'
          return (
            <g key={d.dateStr}>
              <rect x={x} y={y} width={BAR_W} height={barH} rx={6}
                fill={color} fillOpacity={d.revenue > 0 ? 1 : 0.18} />
              {d.revenue > 0 && (
                <text x={x + BAR_W/2} y={y - 5} textAnchor="middle" fontSize={9} fill="#6b7280">
                  {d.revenue >= 1000000
                    ? (d.revenue/1000000).toFixed(1)+'M'
                    : Math.round(d.revenue/1000)+'k'}
                </text>
              )}
              <text x={x + BAR_W/2} y={CHART_H + 18} textAnchor="middle" fontSize={10}
                fill={isToday ? '#f97316' : '#9ca3af'}
                fontWeight={isToday ? '700' : '400'}>
                {d.label}
              </text>
              {isToday && (
                <text x={x + BAR_W/2} y={CHART_H + 32} textAnchor="middle" fontSize={8} fill="#f97316">
                  Hôm nay
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const orders  = USE_MOCK ? MOCK_ORDERS  : []
  const tonKho  = USE_MOCK ? MOCK_TONKHO  : []
  const phieuChi = USE_MOCK ? MOCK_PHIEU_CHI : []

  const today = todayISO()

  // ── KPI ─────────────────────────────────────────────────────────────────────
  const ordersToday = useMemo(
    () => orders.filter(o => o.TrangThai === 'Completed' && o.NgayLap.startsWith(today)),
    [orders, today]
  )
  const revenueToday  = ordersToday.reduce((s, o) => s + o.TongThanhToan, 0)
  const countToday    = ordersToday.length
  const discountToday = ordersToday.reduce((s, o) => s + (o.GiamGia || 0), 0)
  const lowStock      = tonKho.filter(t => t.SoLuong <= t.MucCanhBao).length

  // ── Top sản phẩm ─────────────────────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const map = {}
    orders
      .filter(o => o.TrangThai === 'Completed')
      .forEach(o => (o.chiTiet || []).forEach(item => {
        if (!map[item.TenSP]) map[item.TenSP] = { name: item.TenSP, qty: 0, rev: 0 }
        map[item.TenSP].qty += item.SoLuong
        map[item.TenSP].rev += item.ThanhTien
      }))
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5)
  }, [orders])

  // ── Hóa đơn gần đây ──────────────────────────────────────────────────────────
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.NgayLap.localeCompare(a.NgayLap)).slice(0, 5),
    [orders]
  )

  // ── Cảnh báo tồn kho ─────────────────────────────────────────────────────────
  const lowStockItems = useMemo(
    () => tonKho.filter(t => t.SoLuong <= t.MucCanhBao).slice(0, 5),
    [tonKho]
  )

  // ── Phiếu chi chờ duyệt ──────────────────────────────────────────────────────
  const pendingPhieuChi = useMemo(
    () => phieuChi.filter(p => p.TrangThai === 'Pending').slice(0, 4),
    [phieuChi]
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5 max-w-7xl mx-auto">

        {/* ── Chào mừng ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Xin chào, {user?.hoTen || 'Người dùng'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {ROLE_LABEL[user?.vaiTro] || user?.vaiTro} · {user?.tenCN} · {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>

        {/* ── KPI strip ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Doanh thu hôm nay', value: fmtVND(revenueToday), icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Hóa đơn hôm nay',   value: countToday,           icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Tổng giảm giá',      value: fmtVND(discountToday),icon: Tag,         color: 'text-green-600',bg: 'bg-green-50' },
            { label: 'Cảnh báo tồn kho',   value: `${lowStock} NL`,     icon: AlertTriangle,color: lowStock > 0 ? 'text-red-600' : 'text-gray-400', bg: lowStock > 0 ? 'bg-red-50' : 'bg-gray-50' },
          ].map(k => (
            <div key={k.label} className="card flex items-center gap-3 py-3">
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon size={18} className={k.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{k.label}</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Hàng 2: Chart + Top SP ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Biểu đồ doanh thu 7 ngày */}
          <div className="card lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Doanh thu 7 ngày gần đây</h2>
            <RevenueChart orders={orders} />
          </div>

          {/* Top sản phẩm */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Top sản phẩm bán chạy</h2>
            {topProducts.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.qty} phần · {fmtVND(p.rev)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Hàng 3: Hóa đơn gần đây + Cảnh báo kho + Phiếu chi ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Hóa đơn gần đây */}
          <div className="card lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" /> Hóa đơn gần đây
            </h2>
            <div className="space-y-2">
              {recentOrders.map(o => (
                <div key={o.MaHD} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs font-mono font-semibold text-gray-700">{o.MaHD}</p>
                    <p className="text-[11px] text-gray-400">{fmtDateTime(o.NgayLap)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-800">{fmtVND(o.TongThanhToan)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      o.TrangThai === 'Completed' ? 'bg-green-100 text-green-700' :
                      o.TrangThai === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                    }`}>{o.TrangThai === 'Completed' ? 'Hoàn tất' : o.TrangThai === 'Cancelled' ? 'Đã hủy' : 'Đang xử lý'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cảnh báo tồn kho */}
          <div className="card lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-400" /> Tồn kho cần nhập
            </h2>
            {lowStockItems.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-green-600">
                <CheckCircle2 size={16} />
                <p className="text-xs">Tất cả nguyên liệu đủ hàng</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map(item => (
                  <div key={item.MaNL} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <Package size={13} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-700">{item.TenNL}</p>
                        <p className="text-[11px] text-gray-400">{item.DonViTinh}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-600">{item.SoLuong}</p>
                      <p className="text-[10px] text-gray-400">/ {item.MucCanhBao}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phiếu chi chờ duyệt */}
          <div className="card lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-500" /> Phiếu chi chờ duyệt
            </h2>
            {pendingPhieuChi.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-green-600">
                <CheckCircle2 size={16} />
                <p className="text-xs">Không có phiếu nào chờ duyệt</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingPhieuChi.map(p => (
                  <div key={p.MaPC} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-mono font-semibold text-gray-700">{p.MaPC}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[120px]">{p.MoTa}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-600">{fmtVND(p.SoTien)}</p>
                      <p className="text-[10px] text-gray-400">{p.NguoiLap}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
