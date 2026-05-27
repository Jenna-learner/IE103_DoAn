/**
 * HoaDon.jsx — Lịch sử Hóa đơn
 *
 * Tính năng:
 *   - Bảng danh sách đơn hàng, sắp xếp theo ngày mới nhất
 *   - Lọc: theo ngày, theo trạng thái (Tất cả / Completed / Cancelled / Pending)
 *   - Tìm kiếm: theo mã HĐ hoặc tên/SĐT khách hàng
 *   - Click hàng → popup chi tiết (OrderDetailModal)
 *   - Quản lý/Admin: có nút Huỷ đơn ngay trong modal
 *   - Tổng kết nhanh ở đầu trang (doanh thu ngày, số đơn, đơn huỷ)
 *
 * USE_MOCK = true  → dùng MOCK_ORDERS (không cần backend)
 * USE_MOCK = false → gọi GET /api/v1/hoa-don
 */
import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, RefreshCw, TrendingUp, ShoppingBag, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { MOCK_ORDERS } from '../lib/mock'
import { fmtCurrency } from '../lib/format'
import { useAuthStore } from '../store/authStore'
import OrderDetailModal from '../components/hoadon/OrderDetailModal'

/* ─── Feature flag ───────────────────────────────────────────────────────── */
const USE_MOCK = true
const PAGE_SIZE = 10

/* ─── Helper ─────────────────────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: '',          label: 'Tất cả'      },
  { value: 'Completed', label: 'Hoàn thành'  },
  { value: 'Pending',   label: 'Đang xử lý'  },
  { value: 'Cancelled', label: 'Đã huỷ'      },
]

const STATUS_STYLE = {
  Completed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-600',
}
const STATUS_LABEL = { Completed: 'Hoàn thành', Pending: 'Đang xử lý', Cancelled: 'Đã huỷ' }

const PAY_ICON = { Cash: '💵', Card: '💳', 'E-Wallet': '📱' }

function fmtDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ─── KPI card nhỏ ─────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-3">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-base font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function HoaDon() {
  const { user } = useAuthStore()

  // ── State ──
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(false)
  const [selectedOrder, setSelected]  = useState(null)   // order đang xem chi tiết
  const [page, setPage]               = useState(1)
  const [totalCount, setTotalCount]   = useState(0)

  // Filters
  const [search, setSearch]           = useState('')
  const [filterStatus, setStatus]     = useState('')
  const [filterDate, setFilterDate]   = useState('')      // 'YYYY-MM-DD'

  const canCancel = ['admin', 'quan_ly_chinhanh'].includes(user?.vaiTro)

  // ── Fetch ──
  const loadOrders = async () => {
    setLoading(true)
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        setOrders(MOCK_ORDERS)
        setTotalCount(MOCK_ORDERS.length)
      } else {
        const params = { page, limit: PAGE_SIZE }
        if (filterStatus) params.trangThai = filterStatus
        if (filterDate)   params.ngay      = filterDate
        const data = await api.get('/hoa-don', { params })
        setOrders(data.rows || data.data || [])
        setTotalCount(data.total || 0)
      }
    } catch {
      toast.error('Không tải được danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [page, filterStatus, filterDate])

  // ── Lọc + tìm kiếm (client-side khi mock) ──
  const filtered = useMemo(() => {
    let list = orders
    if (filterStatus) list = list.filter(o => o.TrangThai === filterStatus)
    if (filterDate)   list = list.filter(o => o.NgayLap.startsWith(filterDate))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(o =>
        o.MaHD.toLowerCase().includes(q) ||
        (o.TenKH  && o.TenKH.toLowerCase().includes(q)) ||
        (o.SDTKH  && o.SDTKH.includes(q))
      )
    }
    return list
  }, [orders, filterStatus, filterDate, search])

  // Phân trang client-side khi mock
  const pagedOrders = USE_MOCK
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered

  const totalPages = USE_MOCK
    ? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    : Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // ── KPI (tính từ mock) ──
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayOrders     = orders.filter(o => o.NgayLap.startsWith(todayStr))
  const todayRevenue    = todayOrders.filter(o => o.TrangThai === 'Completed').reduce((s, o) => s + o.TongThanhToan, 0)
  const todayCompleted  = todayOrders.filter(o => o.TrangThai === 'Completed').length
  const todayCancelled  = todayOrders.filter(o => o.TrangThai === 'Cancelled').length

  // ── Xử lý huỷ đơn ──
  const handleCancel = async (maHD) => {
    if (!window.confirm(`Bạn có chắc muốn huỷ đơn hàng ${maHD}?`)) return
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400))
        setOrders(prev => prev.map(o => o.MaHD === maHD ? { ...o, TrangThai: 'Cancelled' } : o))
        setSelected(prev => prev?.MaHD === maHD ? { ...prev, TrangThai: 'Cancelled' } : prev)
        toast.success('Đã huỷ hóa đơn')
      } else {
        await api.patch(`/hoa-don/${maHD}/huy`)
        toast.success('Đã huỷ hóa đơn và hoàn kho')
        loadOrders()
        setSelected(null)
      }
    } catch {
      toast.error('Không thể huỷ hóa đơn')
    }
  }

  // ── Reset filters ──
  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setFilterDate('')
    setPage(1)
  }

  const hasFilter = search || filterStatus || filterDate

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <KpiCard
          icon={<TrendingUp size={18} className="text-green-600" />}
          label="Doanh thu hôm nay"
          value={fmtCurrency(todayRevenue)}
          color="bg-green-50"
        />
        <KpiCard
          icon={<ShoppingBag size={18} className="text-brand-600" />}
          label="Đơn hoàn thành"
          value={`${todayCompleted} đơn`}
          color="bg-amber-50"
        />
        <KpiCard
          icon={<XCircle size={18} className="text-red-500" />}
          label="Đơn bị huỷ"
          value={`${todayCancelled} đơn`}
          color="bg-red-50"
        />
      </div>

      {/* ── Bộ lọc ── */}
      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã HĐ, tên hoặc SĐT khách hàng..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input pl-8 text-sm w-full"
          />
        </div>

        {/* Lọc trạng thái */}
        <select
          value={filterStatus}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="input text-sm w-40"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Lọc ngày */}
        <input
          type="date"
          value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setPage(1) }}
          className="input text-sm w-40"
        />

        {/* Reset */}
        {hasFilter && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            <RefreshCw size={13} />
            Đặt lại
          </button>
        )}
      </div>

      {/* ── Bảng danh sách ── */}
      <div className="card flex-1 flex flex-col overflow-hidden p-0">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100
                        text-[11px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
          <div className="col-span-3">Mã hóa đơn</div>
          <div className="col-span-2">Thời gian</div>
          <div className="col-span-2">Khách hàng</div>
          <div className="col-span-1 text-center">T.Toán</div>
          <div className="col-span-2 text-right">Tổng tiền</div>
          <div className="col-span-2 text-center">Trạng thái</div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" /> Đang tải...
            </div>
          ) : pagedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ShoppingBag size={36} className="mb-2 opacity-30" />
              <p className="text-sm">Không có hóa đơn nào</p>
              {hasFilter && (
                <button onClick={resetFilters} className="text-xs text-brand-500 mt-1 hover:underline">
                  Xoá bộ lọc
                </button>
              )}
            </div>
          ) : pagedOrders.map(order => (
            <div
              key={order.MaHD}
              onClick={() => setSelected(order)}
              className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-amber-50/40 cursor-pointer
                         transition-colors text-sm items-center"
            >
              {/* Mã HĐ */}
              <div className="col-span-3">
                <p className="font-mono font-semibold text-gray-800 text-xs">{order.MaHD}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{order.TenCN}</p>
              </div>

              {/* Thời gian */}
              <div className="col-span-2 text-xs text-gray-500">
                {fmtDateTime(order.NgayLap)}
              </div>

              {/* Khách hàng */}
              <div className="col-span-2">
                {order.TenKH ? (
                  <>
                    <p className="text-xs font-medium text-gray-700 truncate">{order.TenKH}</p>
                    <p className="text-[11px] text-gray-400">{order.SDTKH}</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Vãng lai</p>
                )}
              </div>

              {/* Phương thức thanh toán */}
              <div className="col-span-1 text-center text-base">
                {order.thanhToan ? (PAY_ICON[order.thanhToan.PhuongThuc] || '—') : '—'}
              </div>

              {/* Tổng tiền */}
              <div className="col-span-2 text-right">
                <p className="font-semibold text-gray-800 text-xs">{fmtCurrency(order.TongThanhToan)}</p>
                {order.GiamGia > 0 && (
                  <p className="text-[11px] text-green-500">-{fmtCurrency(order.GiamGia)}</p>
                )}
              </div>

              {/* Trạng thái */}
              <div className="col-span-2 flex justify-center">
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-[11px] font-semibold',
                  STATUS_STYLE[order.TrangThai] || 'bg-gray-100 text-gray-500'
                )}>
                  {STATUS_LABEL[order.TrangThai] || order.TrangThai}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Phân trang ── */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm shrink-0">
          <p className="text-gray-400 text-xs">
            {USE_MOCK
              ? `${filtered.length} hóa đơn`
              : `${totalCount} hóa đơn`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                         text-gray-500 hover:border-brand-400 hover:text-brand-600
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== p - 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...'
                  ? <span key={`e${i}`} className="w-7 text-center text-gray-300 text-xs">…</span>
                  : <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={clsx(
                        'w-7 h-7 rounded-lg text-xs font-semibold transition-colors',
                        page === p
                          ? 'bg-brand-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >{p}</button>
              )
            }
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                         text-gray-500 hover:border-brand-400 hover:text-brand-600
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal chi tiết ── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelected(null)}
          onCancel={handleCancel}
          canCancel={canCancel}
        />
      )}
    </div>
  )
}
