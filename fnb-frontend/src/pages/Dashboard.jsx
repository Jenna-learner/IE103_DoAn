import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CalendarDays, CheckCircle2, ClipboardList,
  Package, Receipt, RefreshCw, ShoppingCart, Store, TrendingUp, Truck, Users,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { fmtCurrency, fmtNumber } from '../lib/format'
import { exportExcel } from '../lib/exportExcel'
import { MANAGER_ROLES, ROLE, ROLE_LABEL, normalizeRole } from '../lib/roles'

function todayISO() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function monthISO() {
  return todayISO().slice(0, 7)
}

function fmtDateShort(value) {
  if (!value) return '—'
  const date = new Date(value)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function normalizeSummary(item = {}) {
  return {
    Ngay: item.Ngay || item.ngay || todayISO(),
    SoHoaDon: Number(item.SoHoaDon ?? item.sohoadon ?? 0),
    TongDoanhThuTho: Number(item.TongDoanhThuTho ?? item.tongdoanhthutho ?? 0),
    TongGiamGia: Number(item.TongGiamGia ?? item.tonggiamgia ?? 0),
    DoanhThuThuan: Number(item.DoanhThuThuan ?? item.doanhthuthuan ?? 0),
    SoCanhBaoTonKho: Number(item.SoCanhBaoTonKho ?? item.socanhbaotonkho ?? 0),
  }
}

function normalizeRevenuePoint(item = {}) {
  const date = item.Ngay || item.ngay
  return {
    Ngay: date,
    label: fmtDateShort(date),
    DoanhThuThuan: Number(item.DoanhThuThuan ?? item.doanhthuthuan ?? 0),
  }
}

function groupRevenueByDay(items = []) {
  const map = new Map()

  items.forEach((item) => {
    const key = String(item.Ngay || item.ngay || '').slice(0, 10)
    if (!key) return

    const current = map.get(key) || {
      Ngay: key,
      label: fmtDateShort(key),
      DoanhThuThuan: 0,
    }

    current.DoanhThuThuan += Number(item.DoanhThuThuan ?? item.doanhthuthuan ?? 0)
    map.set(key, current)
  })

  return Array.from(map.values()).sort((a, b) => a.Ngay.localeCompare(b.Ngay))
}

function normalizeTopProduct(item = {}) {
  return {
    MaSP: item.MaSP || item.masp,
    TenSP: item.TenSP || item.tensp,
    TongSoLuongBan: Number(item.TongSoLuongBan ?? item.tongsoluongban ?? 0),
    TongDoanhThu: Number(item.TongDoanhThu ?? item.tongdoanhthu ?? 0),
  }
}

function normalizeLowStock(item = {}) {
  return {
    MaNL: item.MaNL || item.manl,
    TenNL: item.TenNL || item.tennl,
    DonViTinh: item.DonViTinh || item.donvitinh,
    SoLuongTon: Number(item.SoLuongTon ?? item.soluongton ?? 0),
    TonToiThieu: Number(item.TonToiThieu ?? item.tontoithieu ?? 0),
    TenCN: item.TenCN || item.tencn,
  }
}

function normalizeBranch(item = {}) {
  return {
    MaCN: item.MaCN || item.macn,
    TenCN: item.TenCN || item.tencn,
  }
}

function normalizeOrder(item = {}) {
  return {
    MaHD: item.MaHD || item.mahd,
    TenKH: item.TenKH || item.tenkh || 'Khách vãng lai',
    TenCN: item.TenCN || item.tencn || '—',
    NgayLap: item.NgayLap || item.ngaylap,
    TrangThai: item.TrangThai || item.trangthai || 'Pending',
    TongThanhToan: Number(item.TongThanhToan ?? item.tongthanhtoan ?? 0),
  }
}

function normalizePurchaseOrder(item = {}) {
  return {
    MaPN: item.MaPN || item.mapn,
    TenNCC: item.TenNCC || item.tenncc || '—',
    TenCN: item.TenCN || item.tencn || '—',
    NgayNhap: item.NgayNhap || item.ngaynhap,
    TongTien: Number(item.TongTien ?? item.tongtien ?? 0),
    TrangThai: item.TrangThai || item.trangthai || 'Draft',
  }
}

function normalizeInventoryLog(item = {}) {
  return {
    MaNL: item.MaNL || item.manl,
    TenNL: item.TenNL || item.tennl,
    LoaiBienDong: item.LoaiBienDong || item.loaibiendong,
    SoLuong: Number(item.SoLuong ?? item.soluong ?? 0),
    NgayThayDoi: item.NgayThayDoi || item.ngaythaydoi,
  }
}

function KpiCard({ icon, label, value, tone = 'default', hint }) {
  const toneCls = {
    default: 'bg-white border-gray-100 text-gray-900',
    brand: 'bg-brand-50 border-brand-100 text-brand-700',
    success: 'bg-green-50 border-green-100 text-green-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    danger: 'bg-red-50 border-red-100 text-red-700',
  }[tone]

  return (
    <div className={clsx('rounded-2xl border p-4 flex items-start gap-3', toneCls)}>
      <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
        {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      </div>
    </div>
  )
}

function QuickLink({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

function EmptyState({ icon, message }) {
  return (
    <div className="h-full min-h-40 flex flex-col items-center justify-center text-gray-400 text-sm">
      {icon}
      <p className="mt-2">{message}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const role = normalizeRole(user?.vaiTro)

  const isManagerDashboard = MANAGER_ROLES.includes(role)
  const canPickBranch = [ROLE.ADMIN, ROLE.OPS_DIRECTOR].includes(role)

  const [month, setMonth] = useState(monthISO())
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshingViews, setRefreshingViews] = useState(false)

  const [summary, setSummary] = useState(normalizeSummary())
  const [revenueSeries, setRevenueSeries] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [stockSnapshot, setStockSnapshot] = useState([])

  const [orders, setOrders] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [inventoryLogs, setInventoryLogs] = useState([])

  const selectedBranch = branchFilter === 'ALL' ? '' : branchFilter

  const loadBranches = useCallback(async () => {
    if (!canPickBranch) return
    try {
      const res = await api.get('/chi-nhanh')
      setBranches((res.data || []).map(normalizeBranch))
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách chi nhánh')
    }
  }, [canPickBranch])

  const loadManagerDashboard = useCallback(async () => {
    const today = todayISO()
    const params = selectedBranch ? { maCN: selectedBranch } : {}
    const [summaryRes, revenueRes, topRes, lowRes] = await Promise.all([
      api.get('/bao-cao/dashboard', { params: { ...params, ngay: today } }),
      api.get('/bao-cao/doanh-thu-theo-ngay', { params: { ...params, thang: month } }),
      api.get('/bao-cao/top-san-pham', { params: { ...params, limit: 5 } }),
      api.get('/bao-cao/canh-bao-ton-kho', { params }),
    ])

    setSummary(normalizeSummary(summaryRes.data))
    setRevenueSeries(groupRevenueByDay((revenueRes.data || []).map(normalizeRevenuePoint)))
    setTopProducts((topRes.data || []).map(normalizeTopProduct))
    setLowStockItems((lowRes.data || []).map(normalizeLowStock).slice(0, 6))
  }, [month, selectedBranch])

  const loadCashierDashboard = useCallback(async () => {
    const res = await api.get('/hoa-don', { params: { ngay: todayISO(), page: 1, limit: 100 } })
    const items = (res.data || []).map(normalizeOrder)
    setOrders(items)
  }, [])

  const loadWarehouseDashboard = useCallback(async () => {
    const [stockRes, logRes, poRes] = await Promise.all([
      api.get('/kho/ton-kho'),
      api.get('/kho/nhat-ky', { params: { limit: 20 } }),
      api.get('/phieu-nhap', { params: { page: 1, limit: 20 } }),
    ])

    const stockItems = (stockRes.data || []).map(normalizeLowStock)
    setStockSnapshot(stockItems)
    setLowStockItems(stockItems.filter((item) => item.SoLuongTon <= item.TonToiThieu))
    setInventoryLogs((logRes.data || []).map(normalizeInventoryLog).slice(0, 8))
    setPurchaseOrders((poRes.data || []).map(normalizePurchaseOrder))
  }, [])

  const loadDashboard = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      if (isManagerDashboard) {
        await loadManagerDashboard()
      } else if (role === ROLE.CASHIER) {
        await loadCashierDashboard()
      } else {
        await loadWarehouseDashboard()
      }

      if (showToast) toast.success('Đã làm mới dashboard')
      return true
    } catch (err) {
      toast.error(err.message || 'Không tải được dashboard')
      setSummary(normalizeSummary())
      setRevenueSeries([])
      setTopProducts([])
      setLowStockItems([])
      setStockSnapshot([])
      setOrders([])
      setPurchaseOrders([])
      setInventoryLogs([])
      return false
    } finally {
      setLoading(false)
    }
  }, [isManagerDashboard, loadCashierDashboard, loadManagerDashboard, loadWarehouseDashboard, role])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const formattedDate = useMemo(() => new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  }), [])

  const selectedBranchLabel = useMemo(() => {
    if (!selectedBranch) return user?.tenCN || 'Toàn hệ thống'
    return branches.find((item) => item.MaCN === selectedBranch)?.TenCN || 'Chi nhánh'
  }, [branches, selectedBranch, user?.tenCN])

  const handleRefreshDashboard = async () => {
    const shouldRefreshViews = role === ROLE.ADMIN && isManagerDashboard

    if (shouldRefreshViews) setRefreshingViews(true)

    try {
      if (shouldRefreshViews) {
        await api.post('/bao-cao/lam-moi')
      }

      const ok = await loadDashboard(false)
      if (ok) {
        toast.success(
          shouldRefreshViews
            ? 'Đã đồng bộ và làm mới dữ liệu báo cáo'
            : 'Đã làm mới dashboard'
        )
      }
    } catch (err) {
      toast.error(err.message || 'Không làm mới được dữ liệu báo cáo')
    } finally {
      setRefreshingViews(false)
    }
  }

  const todayOrders = orders.filter((item) => String(item.NgayLap || '').slice(0, 10) === todayISO())
  const todayCompleted = todayOrders.filter((item) => item.TrangThai === 'Completed')
  const todayPending = todayOrders.filter((item) => item.TrangThai === 'Pending').length
  const pendingPO = purchaseOrders.filter((item) => item.TrangThai === 'Draft').length

  const quickLinks = {
    manager: [
      { label: 'Lịch sử hóa đơn', icon: <Receipt size={14} />, to: '/hoa-don' },
      { label: 'Tồn kho', icon: <Package size={14} />, to: '/kho/ton-kho' },
      { label: 'Phiếu chi', icon: <ClipboardList size={14} />, to: '/phieu-chi' },
    ],
    cashier: [
      { label: 'Mở POS', icon: <ShoppingCart size={14} />, to: '/pos' },
      { label: 'Hóa đơn hôm nay', icon: <Receipt size={14} />, to: '/hoa-don' },
      { label: 'Khách hàng CRM', icon: <Users size={14} />, to: '/khach-hang' },
    ],
    warehouse: [
      { label: 'Tồn kho', icon: <Package size={14} />, to: '/kho/ton-kho' },
      { label: 'Kiểm kho', icon: <ClipboardList size={14} />, to: '/kho/kiem-kho' },
      { label: 'Phiếu nhập', icon: <Truck size={14} />, to: '/phieu-nhap' },
    ],
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard · {user?.hoTen || 'Người dùng'}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {ROLE_LABEL[role] || role} · {selectedBranchLabel} · {formattedDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isManagerDashboard && (
              <label className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                <CalendarDays size={15} className="text-gray-400" />
                <span className="text-xs font-medium">Tháng xem</span>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="bg-transparent outline-none text-sm text-gray-700"
                />
              </label>
            )}

            {canPickBranch && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="input text-sm min-w-48"
              >
                <option value="ALL">Toàn hệ thống</option>
                {branches.map((item) => (
                  <option key={item.MaCN} value={item.MaCN}>{item.TenCN}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleRefreshDashboard}
              className="btn-secondary text-sm px-3 py-2"
              disabled={loading || refreshingViews}
            >
              <RefreshCw size={14} className={clsx((loading || refreshingViews) && 'animate-spin')} />
              {refreshingViews ? 'Đang làm mới dữ liệu báo cáo...' : 'Làm mới'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(isManagerDashboard ? quickLinks.manager : role === ROLE.CASHIER ? quickLinks.cashier : quickLinks.warehouse).map((item) => (
            <QuickLink key={item.to} label={item.label} icon={item.icon} onClick={() => navigate(item.to)} />
          ))}
        </div>

        {isManagerDashboard && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <KpiCard icon={<TrendingUp size={18} className="text-brand-600" />} label="Doanh thu thô hôm nay" value={fmtCurrency(summary.TongDoanhThuTho)} tone="brand" />
              <KpiCard icon={<Receipt size={18} className="text-green-600" />} label="Giảm giá hôm nay" value={fmtCurrency(summary.TongGiamGia)} tone="success" />
              <KpiCard icon={<TrendingUp size={18} className="text-blue-600" />} label="Doanh thu thuần" value={fmtCurrency(summary.DoanhThuThuan)} />
              <KpiCard icon={<ShoppingCart size={18} className="text-indigo-600" />} label="Hóa đơn hoàn tất" value={fmtNumber(summary.SoHoaDon)} />
              <KpiCard icon={<AlertTriangle size={18} className="text-red-600" />} label="Cảnh báo tồn kho" value={`${fmtNumber(summary.SoCanhBaoTonKho)} NL`} tone={summary.SoCanhBaoTonKho > 0 ? 'danger' : 'default'} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="card xl:col-span-2">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">Doanh thu theo ngày</h2>
                    <p className="text-xs text-gray-400 mt-1">Mỗi ngày hiển thị một cột doanh thu thuần · Tháng {month}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-gray-400">
                      <p>Doanh thu thuần</p>
                      <p className="font-semibold text-gray-700">{fmtCurrency(revenueSeries.reduce((sum, item) => sum + item.DoanhThuThuan, 0))}</p>
                    </div>
                    <button
                      onClick={() => exportExcel(`doanh-thu-${month}`, 'Doanh thu theo ngày', [
                        { label: 'Ngày', value: 'Ngay' },
                        { label: 'Doanh thu thuần', value: (row) => row.DoanhThuThuan },
                      ], revenueSeries)}
                      className="btn-secondary px-3 py-2 text-xs"
                      disabled={revenueSeries.length === 0}
                    >
                      Xuất báo cáo
                    </button>
                  </div>
                </div>

                <div className="h-[320px]">
                  {loading ? (
                    <EmptyState icon={<RefreshCw size={18} className="animate-spin opacity-70" />} message="Đang tải biểu đồ..." />
                  ) : revenueSeries.length === 0 ? (
                    <EmptyState icon={<TrendingUp size={28} className="opacity-30" />} message={`Chưa có dữ liệu doanh thu trong tháng ${month}`} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueSeries} barCategoryGap="24%" margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                        />
                        <Tooltip
                          formatter={(value) => fmtCurrency(value)}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.Ngay || ''}
                          contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb' }}
                        />
                        <Bar dataKey="DoanhThuThuan" fill="#f97316" radius={[8, 8, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">Top sản phẩm bán chạy</h2>
                    <p className="text-xs text-gray-400 mt-1">Top 5 theo số lượng bán trong phạm vi đang chọn</p>
                  </div>
                  <button
                    onClick={() => exportExcel(`top-san-pham-${month}`, 'Top sản phẩm', [
                      { label: 'Mã sản phẩm', value: 'MaSP' },
                      { label: 'Tên sản phẩm', value: 'TenSP' },
                      { label: 'Số lượng bán', value: 'TongSoLuongBan' },
                      { label: 'Doanh thu', value: 'TongDoanhThu' },
                    ], topProducts)}
                    className="btn-secondary px-3 py-2 text-xs"
                    disabled={topProducts.length === 0}
                  >
                    Xuất báo cáo
                  </button>
                </div>

                {topProducts.length === 0 ? (
                  <EmptyState icon={<Store size={26} className="opacity-30" />} message="Chưa có dữ liệu bán hàng" />
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((item, index) => (
                      <div key={item.MaSP || item.TenSP} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.TenSP}</p>
                          <p className="text-[11px] text-gray-400">{fmtNumber(item.TongSoLuongBan)} phần · {fmtCurrency(item.TongDoanhThu)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {role === ROLE.CASHIER && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <KpiCard icon={<Receipt size={18} className="text-brand-600" />} label="Hóa đơn hôm nay" value={fmtNumber(todayOrders.length)} tone="brand" />
              <KpiCard icon={<CheckCircle2 size={18} className="text-green-600" />} label="Đơn hoàn tất" value={fmtNumber(todayCompleted.length)} tone="success" />
              <KpiCard icon={<AlertTriangle size={18} className="text-amber-600" />} label="Đơn đang xử lý" value={fmtNumber(todayPending)} tone="warning" />
              <KpiCard icon={<TrendingUp size={18} className="text-indigo-600" />} label="Doanh thu đã chốt" value={fmtCurrency(todayCompleted.reduce((sum, item) => sum + item.TongThanhToan, 0))} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">Hóa đơn gần đây</h2>
                    <p className="text-xs text-gray-400 mt-1">Danh sách hóa đơn trong ngày tại chi nhánh hiện tại</p>
                  </div>
                </div>

                {todayOrders.length === 0 ? (
                  <EmptyState icon={<Receipt size={26} className="opacity-30" />} message="Chưa có hóa đơn nào trong ngày" />
                ) : (
                  <div className="space-y-3">
                    {todayOrders.slice(0, 8).map((item) => (
                      <button
                        key={item.MaHD}
                        onClick={() => navigate(`/hoa-don/${item.MaHD}`)}
                        className="w-full rounded-xl border border-gray-100 px-4 py-3 text-left hover:border-brand-200 hover:bg-brand-50/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{item.MaHD}</p>
                            <p className="text-xs text-gray-400 mt-1 truncate">{item.TenKH} · {fmtDateShort(item.NgayLap)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900">{fmtCurrency(item.TongThanhToan)}</p>
                            <p className="text-[11px] text-gray-400">{item.TrangThai}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="text-sm font-semibold text-gray-700">Nhịp bán hàng</h2>
                <div className="space-y-3 mt-4">
                  <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
                    <p className="text-xs text-brand-700">Mục tiêu thao tác</p>
                    <p className="text-lg font-bold text-brand-800 mt-1">Mở POS để tạo đơn mới nhanh</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Tỷ lệ hoàn tất</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {todayOrders.length ? `${Math.round((todayCompleted.length / todayOrders.length) * 100)}%` : '0%'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {role === ROLE.WAREHOUSE && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <KpiCard icon={<Package size={18} className="text-brand-600" />} label="Nguyên liệu theo dõi" value={fmtNumber(stockSnapshot.length)} tone="brand" hint="Theo dữ liệu kho hiện tại" />
              <KpiCard icon={<AlertTriangle size={18} className="text-red-600" />} label="Cảnh báo tồn thấp" value={fmtNumber(lowStockItems.length)} tone={lowStockItems.length > 0 ? 'danger' : 'default'} />
              <KpiCard icon={<Truck size={18} className="text-amber-600" />} label="Phiếu nhập chờ xử lý" value={fmtNumber(pendingPO)} tone="warning" />
              <KpiCard icon={<ClipboardList size={18} className="text-green-600" />} label="Biến động gần đây" value={fmtNumber(inventoryLogs.length)} tone="success" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
              <div className="card">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Nhật ký kho gần đây</h2>
                {inventoryLogs.length === 0 ? (
                  <EmptyState icon={<ClipboardList size={26} className="opacity-30" />} message="Chưa có biến động kho" />
                ) : (
                  <div className="space-y-3">
                    {inventoryLogs.map((item, index) => (
                      <div key={`${item.MaNL}-${index}`} className="rounded-xl border border-gray-100 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.TenNL}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{item.LoaiBienDong} · {fmtDateShort(item.NgayThayDoi)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{fmtNumber(item.SoLuong)}</p>
                            <p className="text-[11px] text-gray-400">{item.MaNL}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">Nguyên liệu cần ưu tiên</h2>
                    <p className="text-xs text-gray-400 mt-1">Các dòng dưới mức tối thiểu</p>
                  </div>
                  {lowStockItems.length === 0 && (
                    <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Ổn định
                    </span>
                  )}
                </div>

                {lowStockItems.length === 0 ? null : (
                  <div className="space-y-3">
                    {lowStockItems.slice(0, 6).map((item) => (
                      <div key={item.MaNL} className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <p className="text-sm font-semibold text-red-700">{item.TenNL}</p>
                        <p className="text-[11px] text-red-500 mt-1">{item.MaNL} · {item.TenCN || user?.tenCN || 'Chi nhánh hiện tại'}</p>
                        <div className="flex items-end justify-between gap-3 mt-3">
                          <div>
                            <p className="text-[11px] text-gray-500">Tồn hiện tại</p>
                            <p className="text-lg font-bold text-red-600">{fmtNumber(item.SoLuongTon)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-gray-500">Mức tối thiểu</p>
                            <p className="text-sm font-semibold text-gray-700">{fmtNumber(item.TonToiThieu)} {item.DonViTinh}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {isManagerDashboard && (
          <div className="card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Cảnh báo tồn kho thời gian thực</h2>
                <p className="text-xs text-gray-400 mt-1">Danh sách nguyên liệu đang thấp hơn mức tối thiểu</p>
              </div>
              <div className="flex items-center gap-2">
                {lowStockItems.length === 0 && (
                  <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                    <CheckCircle2 size={14} /> Không có cảnh báo tồn kho
                  </div>
                )}
                <button
                  onClick={() => exportExcel(`canh-bao-ton-kho-${month}`, 'Cảnh báo tồn kho', [
                    { label: 'Mã nguyên liệu', value: 'MaNL' },
                    { label: 'Tên nguyên liệu', value: 'TenNL' },
                    { label: 'Chi nhánh', value: 'TenCN' },
                    { label: 'Đơn vị tính', value: 'DonViTinh' },
                    { label: 'Tồn hiện tại', value: 'SoLuongTon' },
                    { label: 'Mức tối thiểu', value: 'TonToiThieu' },
                  ], lowStockItems)}
                  className="btn-secondary px-3 py-2 text-xs"
                  disabled={lowStockItems.length === 0}
                >
                  Xuất báo cáo
                </button>
              </div>
            </div>

            {lowStockItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {lowStockItems.map((item) => (
                  <div key={item.MaNL} className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-red-700 truncate">{item.TenNL}</p>
                        <p className="text-[11px] text-red-500 mt-1">{item.MaNL} · {item.TenCN || user?.tenCN || 'Chi nhánh hiện tại'}</p>
                      </div>
                      <Package size={16} className="text-red-400 shrink-0" />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-gray-500">Tồn hiện tại</p>
                        <p className="text-lg font-bold text-red-600">{fmtNumber(item.SoLuongTon)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-gray-500">Mức tối thiểu</p>
                        <p className="text-sm font-semibold text-gray-700">{fmtNumber(item.TonToiThieu)} {item.DonViTinh}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
