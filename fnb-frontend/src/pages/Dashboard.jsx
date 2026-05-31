import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  TrendingUp, ShoppingCart, Tag, AlertTriangle,
  Package, CheckCircle2, Database, RefreshCw, CalendarDays,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
  XAxis, YAxis, Tooltip,
} from 'recharts'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { MOCK_ORDERS, MOCK_TONKHO } from '../lib/mock'
import { fmtCurrency, fmtNumber } from '../lib/format'
import { normalizeRole } from '../lib/roles'
import { isMockSession } from '../lib/mockSession'

const ROLE_LABEL = {
  role_admin: 'Quản trị viên hệ thống',
  role_readonly: 'Giám sát / Quản lý chi nhánh',
  role_cashier: 'Thu ngân',
  role_warehouse_staff: 'Nhân viên kho',
}

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
    TongDoanhThuTho: Number(item.TongDoanhThuTho ?? item.tongdoanhthutho ?? 0),
    TongGiamGia: Number(item.TongGiamGia ?? item.tonggiamgia ?? 0),
    DoanhThuThuan: Number(item.DoanhThuThuan ?? item.doanhthuthuan ?? 0),
  }
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

function buildFallbackData(selectedMonth) {
  const today = todayISO()
  const completedOrders = MOCK_ORDERS.filter((item) => item.TrangThai === 'Completed')
  const ordersToday = completedOrders.filter((item) => item.NgayLap.startsWith(today))
  const revenuePoints = completedOrders
    .filter((item) => item.NgayLap.startsWith(selectedMonth))
    .reduce((acc, item) => {
      const key = item.NgayLap.slice(0, 10)
      if (!acc[key]) acc[key] = { Ngay: key, TongDoanhThuTho: 0, TongGiamGia: 0, DoanhThuThuan: 0 }
      acc[key].TongDoanhThuTho += item.TongTienHang || 0
      acc[key].TongGiamGia += item.GiamGia || 0
      acc[key].DoanhThuThuan += item.TongThanhToan || 0
      return acc
    }, {})

  const topProducts = completedOrders.reduce((acc, order) => {
    for (const item of order.chiTiet || []) {
      if (!acc[item.MaSP]) {
        acc[item.MaSP] = { MaSP: item.MaSP, TenSP: item.TenSP, TongSoLuongBan: 0, TongDoanhThu: 0 }
      }
      acc[item.MaSP].TongSoLuongBan += item.SoLuong
      acc[item.MaSP].TongDoanhThu += item.ThanhTien
    }
    return acc
  }, {})

  const lowStock = MOCK_TONKHO
    .filter((item) => item.SoLuongTon <= item.TonToiThieu)
    .map((item) => ({
      MaNL: item.MaNL,
      TenNL: item.TenNL,
      DonViTinh: item.DonViTinh,
      SoLuongTon: item.SoLuongTon,
      TonToiThieu: item.TonToiThieu,
    }))

  return {
    summary: {
      Ngay: today,
      SoHoaDon: ordersToday.length,
      TongDoanhThuTho: ordersToday.reduce((sum, item) => sum + (item.TongTienHang || 0), 0),
      TongGiamGia: ordersToday.reduce((sum, item) => sum + (item.GiamGia || 0), 0),
      DoanhThuThuan: ordersToday.reduce((sum, item) => sum + (item.TongThanhToan || 0), 0),
      SoCanhBaoTonKho: lowStock.length,
    },
    revenueSeries: Object.values(revenuePoints)
      .sort((a, b) => a.Ngay.localeCompare(b.Ngay))
      .map(normalizeRevenuePoint),
    topProducts: Object.values(topProducts)
      .sort((a, b) => b.TongSoLuongBan - a.TongSoLuongBan)
      .slice(0, 5),
    lowStockItems: lowStock.slice(0, 6),
  }
}

function KpiCard({ icon, label, value, color, bg, warn }) {
  return (
    <div className={clsx('card flex items-center gap-3 py-3', warn && 'border-red-200 bg-red-50')}>
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className={clsx('text-lg font-bold leading-tight', color)}>{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const role = normalizeRole(user?.vaiTro)

  const [month, setMonth] = useState(monthISO())
  const [loading, setLoading] = useState(false)
  const [refreshingViews, setRefreshingViews] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const [summary, setSummary] = useState(normalizeSummary())
  const [revenueSeries, setRevenueSeries] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])

  const loadDashboard = useCallback(async (showToast = false) => {
    setLoading(true)
    if (isMockSession()) {
      const fallback = buildFallbackData(month)
      setSummary(normalizeSummary(fallback.summary))
      setRevenueSeries(fallback.revenueSeries)
      setTopProducts(fallback.topProducts)
      setLowStockItems(fallback.lowStockItems)
      setUsingFallback(true)
      setLoading(false)
      if (showToast) toast.success('Đã làm mới dashboard demo')
      return
    }
    try {
      const today = todayISO()
      const [summaryRes, revenueRes, topRes, lowRes] = await Promise.all([
        api.get('/bao-cao/dashboard', { params: { ngay: today } }),
        api.get('/bao-cao/doanh-thu-theo-ngay', { params: { thang: month } }),
        api.get('/bao-cao/top-san-pham', { params: { limit: 5 } }),
        api.get('/bao-cao/canh-bao-ton-kho'),
      ])

      setSummary(normalizeSummary(summaryRes.data))
      setRevenueSeries((revenueRes.data || []).filter((item) => item.Ngay || item.ngay).map(normalizeRevenuePoint))
      setTopProducts((topRes.data || []).map(normalizeTopProduct))
      setLowStockItems((lowRes.data || []).map(normalizeLowStock).slice(0, 6))
      setUsingFallback(false)

      if (showToast) toast.success('Đã làm mới dashboard báo cáo')
    } catch (err) {
      const fallback = buildFallbackData(month)
      setSummary(normalizeSummary(fallback.summary))
      setRevenueSeries(fallback.revenueSeries)
      setTopProducts(fallback.topProducts)
      setLowStockItems(fallback.lowStockItems)
      setUsingFallback(true)
      toast.error(err.message || 'Không tải được báo cáo, đang hiển thị dữ liệu demo')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const formattedDate = useMemo(() => new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  }), [])

  const handleRefreshViews = async () => {
    if (isMockSession()) {
      await loadDashboard(true)
      toast.success('Đang ở mock mode, không gọi refresh Materialized Views')
      return
    }
    setRefreshingViews(true)
    try {
      const res = await api.post('/bao-cao/lam-moi')
      toast.success(res.message || 'Đã làm mới Materialized Views')
      await loadDashboard(true)
    } catch (err) {
      toast.error(err.message || 'Không làm mới được Materialized Views')
    } finally {
      setRefreshingViews(false)
    }
  }

  const hasRevenue = revenueSeries.length > 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Dashboard tài chính · {user?.hoTen || 'Người dùng'}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {ROLE_LABEL[role] || role} · {user?.tenCN || 'Toàn hệ thống'} · {formattedDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <button onClick={() => loadDashboard(true)} className="btn-secondary text-sm px-3 py-2" disabled={loading}>
              <RefreshCw size={14} className={clsx(loading && 'animate-spin')} /> Làm mới dữ liệu
            </button>

            {role === 'role_admin' && (
              <button onClick={handleRefreshViews} className="btn-primary text-sm px-3 py-2" disabled={refreshingViews}>
                <Database size={14} />
                {refreshingViews ? 'Đang refresh MV...' : 'Refresh Materialized Views'}
              </button>
            )}
          </div>
        </div>

        {usingFallback && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold">
            <Database size={13} /> Không kết nối được API báo cáo, đang hiển thị dữ liệu demo
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <KpiCard
            icon={<TrendingUp size={18} className="text-brand-600" />}
            label="Doanh thu thô hôm nay"
            value={fmtCurrency(summary.TongDoanhThuTho)}
            color="text-gray-900"
            bg="bg-brand-50"
          />
          <KpiCard
            icon={<Tag size={18} className="text-green-600" />}
            label="Tổng giảm giá hôm nay"
            value={fmtCurrency(summary.TongGiamGia)}
            color="text-gray-900"
            bg="bg-green-50"
          />
          <KpiCard
            icon={<TrendingUp size={18} className="text-blue-600" />}
            label="Doanh thu thuần hôm nay"
            value={fmtCurrency(summary.DoanhThuThuan)}
            color="text-gray-900"
            bg="bg-blue-50"
          />
          <KpiCard
            icon={<ShoppingCart size={18} className="text-indigo-600" />}
            label="Hóa đơn hoàn tất hôm nay"
            value={fmtNumber(summary.SoHoaDon)}
            color="text-gray-900"
            bg="bg-indigo-50"
          />
          <KpiCard
            icon={<AlertTriangle size={18} className="text-red-600" />}
            label="Cảnh báo tồn kho"
            value={`${fmtNumber(summary.SoCanhBaoTonKho)} NL`}
            color={summary.SoCanhBaoTonKho > 0 ? 'text-red-600' : 'text-gray-900'}
            bg={summary.SoCanhBaoTonKho > 0 ? 'bg-red-50' : 'bg-gray-50'}
            warn={summary.SoCanhBaoTonKho > 0}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card xl:col-span-2">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Doanh thu theo ngày</h2>
                <p className="text-xs text-gray-400 mt-1">Nguồn: Materialized View `mv_doanhthu_ngay` · Tháng {month}</p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Doanh thu thuần</p>
                <p className="font-semibold text-gray-700">{fmtCurrency(revenueSeries.reduce((sum, item) => sum + item.DoanhThuThuan, 0))}</p>
              </div>
            </div>

            <div className="h-[320px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm gap-2">
                  <RefreshCw size={16} className="animate-spin" /> Đang tải biểu đồ...
                </div>
              ) : !hasRevenue ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                  <TrendingUp size={28} className="mb-2 opacity-30" />
                  Chưa có dữ liệu doanh thu trong tháng {month}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
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
                    <Bar dataKey="DoanhThuThuan" fill="#f97316" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Top sản phẩm bán chạy</h2>
            <p className="text-xs text-gray-400 mb-3">Nguồn: Materialized View `mv_top_sanpham`</p>

            {topProducts.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-10">Chưa có dữ liệu</p>
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

        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Cảnh báo tồn kho thời gian thực</h2>
              <p className="text-xs text-gray-400 mt-1">Nguồn: View `v_CanhBaoTonKho`</p>
            </div>
            {lowStockItems.length === 0 && (
              <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                <CheckCircle2 size={14} /> Không có cảnh báo tồn kho
              </div>
            )}
          </div>

          {lowStockItems.length === 0 ? null : (
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
      </div>
    </div>
  )
}
