/**
 * HoaDon.jsx — Lịch sử Hóa đơn
 *
 * Tính năng:
 *   - Bảng danh sách đơn hàng, sắp xếp theo ngày mới nhất
 *   - Lọc theo: từ khoá (mã HĐ / SĐT / tên KH), trạng thái, ngày, chi nhánh
 *   - Bộ lọc chi nhánh CHỈ hiển thị với role_admin & role_readonly
 *   - Click hàng → navigate sang /hoa-don/:maHD (trang chi tiết riêng)
 *   - KPI strip: doanh thu hôm nay, đơn hoàn thành, đơn huỷ
 *
 * USE_MOCK = true  → dùng MOCK_ORDERS (không cần backend)
 * USE_MOCK = false → GET /api/v1/hoa-don
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, RefreshCw, TrendingUp, ShoppingBag,
  XCircle, ChevronLeft, ChevronRight, ChevronRight as ArrowRow,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { MOCK_ORDERS } from '../lib/mock'
import { fmtCurrency } from '../lib/format'
import { useAuthStore } from '../store/authStore'

/* ── Feature flag ─────────────────────────────────────────────────────────── */
const USE_MOCK = true
const PAGE_SIZE = 10

/* ── Mock danh sách chi nhánh (để lọc khi admin) ─────────────────────────── */
const MOCK_BRANCHES = [
  { MaCN: 'CN001', TenCN: 'Chi nhánh Quận 1' },
  { MaCN: 'CN002', TenCN: 'Chi nhánh Quận 3' },
  { MaCN: 'CN003', TenCN: 'Chi nhánh Bình Thạnh' },
]

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: '',          label: 'Tất cả trạng thái' },
  { value: 'Completed', label: 'Hoàn thành'         },
  { value: 'Pending',   label: 'Đang xử lý'         },
  { value: 'Cancelled', label: 'Đã huỷ'             },
]

const STATUS_STYLE = {
  Completed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-600',
}
const STATUS_LABEL = { Completed: 'Hoàn thành', Pending: 'Đang xử lý', Cancelled: 'Đã huỷ' }
const PAY_ICON = { Cash: '💵', Card: '💳', 'E-Wallet': '📱' }

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── KPI card ─────────────────────────────────────────────────────────────── */
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

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function HoaDon() {
  const navigate      = useNavigate()
  const { user }      = useAuthStore()

  // Chỉ role_admin & quản lý thấy bộ lọc chi nhánh
  const showBranchFilter = ['role_admin', 'role_readonly'].includes(user?.vaiTro)

  /* ── State ── */
  const [orders,     setOrders]     = useState([])
  const [loading,    setLoading]    = useState(false)
  const [page,       setPage]       = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [search,        setSearch]        = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterDate,    setFilterDate]    = useState('')
  const [filterBranch,  setFilterBranch]  = useState('')  // chỉ admin/ql dùng

  /* ── Load ── */
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
        if (filterBranch && showBranchFilter) params.maCN = filterBranch
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

  useEffect(() => { loadOrders() }, [page, filterStatus, filterDate, filterBranch])

  /* ── Lọc client-side (mock) ── */
  const filtered = useMemo(() => {
    let list = orders
    if (filterStatus) list = list.filter(o => o.TrangThai === filterStatus)
    if (filterDate)   list = list.filter(o => o.NgayLap.startsWith(filterDate))
    if (filterBranch && showBranchFilter) list = list.filter(o => o.MaCN === filterBranch)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(o =>
        o.MaHD.toLowerCase().includes(q) ||
        (o.TenKH  && o.TenKH.toLowerCase().includes(q)) ||
        (o.SDTKH  && o.SDTKH.includes(q))
      )
    }
    return list
  }, [orders, filterStatus, filterDate, filterBranch, search])

  const pagedOrders = USE_MOCK
    ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filtered

  const totalPages = Math.max(1, Math.ceil(
    USE_MOCK ? filtered.length / PAGE_SIZE : totalCount / PAGE_SIZE
  ))

  /* ── KPI ── */
  const todayStr       = new Date().toISOString().slice(0, 10)
  const todayOrders    = orders.filter(o => o.NgayLap.startsWith(todayStr))
  const todayRevenue   = todayOrders.filter(o => o.TrangThai === 'Completed').reduce((s, o) => s + o.TongThanhToan, 0)
  const todayCompleted = todayOrders.filter(o => o.TrangThai === 'Completed').length
  const todayCancelled = todayOrders.filter(o => o.TrangThai === 'Cancelled').length

  /* ── Reset ── */
  const hasFilter = search || filterStatus || filterDate || filterBranch
  const resetFilters = () => { setSearch(''); setFilterStatus(''); setFilterDate(''); setFilterBranch(''); setPage(1) }

  /* ── Render ── */
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <KpiCard
          icon={<TrendingUp size={18} className="text-green-600" />}
          label="Doanh thu hôm nay" value={fmtCurrency(todayRevenue)} color="bg-green-50"
        />
        <KpiCard
          icon={<ShoppingBag size={18} className="text-brand-600" />}
          label="Đơn hoàn thành" value={`${todayCompleted} đơn`} color="bg-amber-50"
        />
        <KpiCard
          icon={<XCircle size={18} className="text-red-500" />}
          label="Đơn bị huỷ" value={`${todayCancelled} đơn`} color="bg-red-50"
        />
      </div>

      {/* Bộ lọc */}
      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        {/* Tìm kiếm */}
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

        {/* Trạng thái */}
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="input text-sm w-44"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Ngày */}
        <input
          type="date"
          value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setPage(1) }}
          className="input text-sm w-40"
        />

        {/* Chi nhánh — CHỈ admin & quan_ly thấy */}
        {showBranchFilter && (
          <select
            value={filterBranch}
            onChange={e => { setFilterBranch(e.target.value); setPage(1) }}
            className="input text-sm w-48"
          >
            <option value="">Tất cả chi nhánh</option>
            {MOCK_BRANCHES.map(b => (
              <option key={b.MaCN} value={b.MaCN}>{b.TenCN}</option>
            ))}
          </select>
        )}

        {/* Reset */}
        {hasFilter && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-600 transition-colors shrink-0"
          >
            <RefreshCw size={13} />
            Đặt lại
          </button>
        )}
      </div>

      {/* Bảng */}
      <div className="card flex-1 flex flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100
                        text-[11px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
          <div className="col-span-3">Mã hóa đơn</div>
          <div className="col-span-2">Thời gian</div>
          <div className="col-span-3">Khách hàng</div>
          <div className="col-span-1 text-center">T.Toán</div>
          <div className="col-span-2 text-right">Tổng tiền</div>
          <div className="col-span-1 text-center">T.Thái</div>
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
              onClick={() => navigate(`/hoa-don/${order.MaHD}`)}
              className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-amber-50/40 cursor-pointer
                         transition-colors text-sm items-center group"
            >
              {/* Mã + chi nhánh */}
              <div className="col-span-3">
                <p className="font-mono font-semibold text-gray-800 text-xs group-hover:text-brand-600 transition-colors">
                  {order.MaHD}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{order.TenCN}</p>
              </div>

              {/* Thời gian */}
              <div className="col-span-2 text-xs text-gray-500">{fmtDateTime(order.NgayLap)}</div>

              {/* Khách hàng */}
              <div className="col-span-3">
                {order.TenKH ? (
                  <>
                    <p className="text-xs font-medium text-gray-700 truncate">{order.TenKH}</p>
                    <p className="text-[11px] text-gray-400">{order.SDTKH}</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Vãng lai</p>
                )}
              </div>

              {/* Phương thức */}
              <div className="col-span-1 text-center text-base">
                {order.thanhToan ? (PAY_ICON[order.thanhToan.PhuongThuc] || '—') : '—'}
              </div>

              {/* Tổng tiền */}
              <div className="col-span-2 text-right">
                <p className="font-semibold text-gray-800 text-xs">{fmtCurrency(order.TongThanhToan)}</p>
                {order.GiamGia > 0 && (
                  <p className="text-[11px] text-green-500">−{fmtCurrency(order.GiamGia)}</p>
                )}
              </div>

              {/* Trạng thái */}
              <div className="col-span-1 flex justify-center">
                <span className={clsx(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap',
                  STATUS_STYLE[order.TrangThai] || 'bg-gray-100 text-gray-500'
                )}>
                  {STATUS_LABEL[order.TrangThai] || order.TrangThai}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Phân trang */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm shrink-0">
          <p className="text-gray-400 text-xs">
            {filtered.length} hóa đơn
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
                        page === p ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'
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

    </div>
  )
}
