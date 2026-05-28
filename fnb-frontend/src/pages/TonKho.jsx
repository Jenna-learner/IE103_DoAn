/**
 * TonKho.jsx — UI 05: Quản lý Tồn kho & Nhật ký kho
 *
 * Gồm 2 tab:
 *   Tab 1 – Tồn kho hiện tại:
 *     - Bảng nguyên liệu: Tên, Đơn vị, Tồn kho, Mức tối thiểu, Giá nhập
 *     - Highlight ĐỎ khi SoLuongTon < TonToiThieu (cảnh báo sắp hết)
 *     - KPI: Tổng NL, số NL cảnh báo, giá trị tồn kho
 *
 *   Tab 2 – Nhật ký role_warehouse_staff:
 *     - Bảng lịch sử biến động: Import / Export / Audit_Loss / Audit_Gain
 *     - Lọc theo loại biến động
 *     - Badge màu phân biệt loại
 *
 * Route: /kho/ton-kho  và  /kho/nhat-ky  (dùng chung component, tab khác nhau)
 *
 * USE_MOCK = true  → dùng MOCK_TONKHO, MOCK_NHATKYKHO
 * USE_MOCK = false → GET /api/v1/kho/ton-kho, /api/v1/kho/nhat-ky
 */
import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Package, AlertTriangle, DollarSign, Search,
  RefreshCw, ArrowDownCircle, ArrowUpCircle, ClipboardList, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { MOCK_TONKHO, MOCK_NHATKYKHO } from '../lib/mock'
import { fmtCurrency, fmtNumber } from '../lib/format'

/* ── Feature flag ─────────────────────────────────────────────────────────── */
const USE_MOCK = true

/* ── Loại biến động config ────────────────────────────────────────────────── */
const LOAI_CONFIG = {
  Import:     { label: 'Nhập kho',    cls: 'bg-green-100 text-green-700',  icon: <ArrowDownCircle size={12} /> },
  Export:     { label: 'Xuất kho',    cls: 'bg-blue-100 text-blue-700',    icon: <ArrowUpCircle size={12} />   },
  Audit_Loss: { label: 'Hao hụt',     cls: 'bg-red-100 text-red-600',      icon: <AlertTriangle size={12} />   },
  Audit_Gain: { label: 'Điều chỉnh+', cls: 'bg-amber-100 text-amber-700',  icon: <RefreshCw size={12} />       },
}

const LOAI_OPTIONS = [
  { value: '',           label: 'Tất cả loại'  },
  { value: 'Import',     label: 'Nhập kho'     },
  { value: 'Export',     label: 'Xuất kho'     },
  { value: 'Audit_Loss', label: 'Hao hụt'      },
  { value: 'Audit_Gain', label: 'Điều chỉnh+'  },
]

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── KPI card ─────────────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, color, warn }) {
  return (
    <div className={clsx('card flex items-center gap-3', warn && 'border-red-200 bg-red-50')}>
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={clsx('text-base font-bold', warn ? 'text-red-600' : 'text-gray-800')}>{value}</p>
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function TonKho() {
  const location = useLocation()
  const navigate  = useNavigate()

  // Xác định tab từ URL: /kho/ton-kho → tab 0, /kho/nhat-ky → tab 1
  const activeTab = location.pathname.includes('nhat-ky') ? 1 : 0

  const [tonKho,   setTonKho]   = useState([])
  const [nhatKy,   setNhatKy]   = useState([])
  const [loading,  setLoading]  = useState(false)

  // Filters
  const [search,      setSearch]      = useState('')
  const [filterLoai,  setFilterLoai]  = useState('')
  const [showWarnOnly, setShowWarnOnly] = useState(false)

  /* ── Load ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (USE_MOCK) {
          await new Promise(r => setTimeout(r, 300))
          setTonKho(MOCK_TONKHO)
          setNhatKy(MOCK_NHATKYKHO)
        } else {
          const [tk, nk] = await Promise.all([
            api.get('/kho/ton-kho'),
            api.get('/kho/nhat-ky'),
          ])
          setTonKho(tk.rows || tk.data || [])
          setNhatKy(nk.rows || nk.data || [])
        }
      } catch {
        toast.error('Không tải được dữ liệu kho')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* ── Filtered lists ── */
  const filteredTonKho = useMemo(() => {
    let list = tonKho
    if (showWarnOnly) list = list.filter(n => n.SoLuongTon < n.TonToiThieu)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(n => n.TenNL.toLowerCase().includes(q) || n.MaNL.toLowerCase().includes(q))
    }
    return list
  }, [tonKho, search, showWarnOnly])

  const filteredNhatKy = useMemo(() => {
    let list = nhatKy
    if (filterLoai) list = list.filter(n => n.LoaiBienDong === filterLoai)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(n =>
        n.TenNL.toLowerCase().includes(q) ||
        (n.MaChungTu && n.MaChungTu.toLowerCase().includes(q))
      )
    }
    return list
  }, [nhatKy, filterLoai, search])

  /* ── KPI ── */
  const soNLCanhBao   = tonKho.filter(n => n.SoLuongTon < n.TonToiThieu).length
  const giaTriTonKho  = tonKho.reduce((s, n) => s + n.SoLuongTon * n.GiaNhap, 0)

  /* ── Switch tab ── */
  const switchTab = (idx) => {
    setSearch('')
    setFilterLoai('')
    setShowWarnOnly(false)
    navigate(idx === 0 ? '/kho/ton-kho' : '/kho/nhat-ky')
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <KpiCard
          icon={<Package size={18} className="text-brand-600" />}
          label="Tổng nguyên liệu" value={`${tonKho.length} loại`} color="bg-amber-50"
        />
        <KpiCard
          icon={<AlertTriangle size={18} className="text-red-500" />}
          label="Cảnh báo sắp hết" value={`${soNLCanhBao} loại`} color="bg-red-100" warn={soNLCanhBao > 0}
        />
        <KpiCard
          icon={<DollarSign size={18} className="text-green-600" />}
          label="Giá trị tồn kho" value={fmtCurrency(giaTriTonKho)} color="bg-green-50"
        />
      </div>

      {/* ── Tabs ── */}
      <div className="card shrink-0 p-1 flex gap-1 w-fit">
        {['Tồn kho hiện tại', 'Nhật ký biến động'].map((label, idx) => (
          <button
            key={idx}
            onClick={() => switchTab(idx)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === idx
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            {idx === 0 ? <Package size={13} className="inline mr-1.5 -mt-0.5" /> : <ClipboardList size={13} className="inline mr-1.5 -mt-0.5" />}
            {label}
            {idx === 0 && soNLCanhBao > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {soNLCanhBao}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Thanh lọc ── */}
      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 0 ? 'Tìm nguyên liệu...' : 'Tìm nguyên liệu hoặc mã chứng từ...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-8 text-sm w-full"
          />
        </div>

        {activeTab === 0 && (
          <button
            onClick={() => setShowWarnOnly(v => !v)}
            className={clsx(
              'flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-all font-medium',
              showWarnOnly
                ? 'bg-red-50 border-red-300 text-red-600'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            )}
          >
            <AlertTriangle size={13} />
            Chỉ cảnh báo
          </button>
        )}

        {activeTab === 1 && (
          <select
            value={filterLoai}
            onChange={e => setFilterLoai(e.target.value)}
            className="input text-sm w-40"
          >
            {LOAI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}

        <button
          onClick={() => { setSearch(''); setFilterLoai(''); setShowWarnOnly(false) }}
          className="text-sm text-gray-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={13} /> Làm mới
        </button>
      </div>

      {/* ── Nội dung tab ── */}
      {activeTab === 0 ? (
        /* ══ TAB 1: TỒN KHO ══ */
        <div className="card flex-1 flex flex-col overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100
                          text-[11px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Nguyên liệu</div>
            <div className="col-span-1 text-center">ĐV</div>
            <div className="col-span-2 text-right">Tồn hiện tại</div>
            <div className="col-span-2 text-right">Mức tối thiểu</div>
            <div className="col-span-2 text-right">Giá nhập</div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <RefreshCw size={16} className="animate-spin" /> Đang tải...
              </div>
            ) : filteredTonKho.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package size={36} className="mb-2 opacity-30" />
                <p className="text-sm">Không có nguyên liệu nào</p>
              </div>
            ) : filteredTonKho.map((nl, i) => {
              const isWarn = nl.SoLuongTon < nl.TonToiThieu
              return (
                <div
                  key={nl.MaNL}
                  className={clsx(
                    'grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm transition-colors',
                    isWarn ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="col-span-1 text-center text-xs text-gray-400">{i + 1}</div>

                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      {isWarn && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                      <div>
                        <p className={clsx('font-medium', isWarn ? 'text-red-700' : 'text-gray-800')}>{nl.TenNL}</p>
                        <p className="text-[11px] text-gray-400">{nl.MaNL}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 text-center text-xs text-gray-500">{nl.DonViTinh}</div>

                  <div className="col-span-2 text-right">
                    <p className={clsx('font-bold text-base', isWarn ? 'text-red-600' : 'text-gray-800')}>
                      {nl.SoLuongTon}
                    </p>
                    {isWarn && (
                      <p className="text-[10px] text-red-500 font-medium">⚠ Sắp hết</p>
                    )}
                  </div>

                  <div className="col-span-2 text-right text-xs text-gray-500">
                    {nl.TonToiThieu} {nl.DonViTinh}
                  </div>

                  <div className="col-span-2 text-right text-xs text-gray-600">
                    {fmtCurrency(nl.GiaNhap)}/{nl.DonViTinh}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-400">{filteredTonKho.length} nguyên liệu</p>
          </div>
        </div>
      ) : (
        /* ══ TAB 2: NHẬT KÝ KHO ══ */
        <div className="card flex-1 flex flex-col overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100
                          text-[11px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
            <div className="col-span-3">Nguyên liệu</div>
            <div className="col-span-2 text-center">Loại</div>
            <div className="col-span-1 text-right">Số lượng</div>
            <div className="col-span-2 text-right">Trước → Sau</div>
            <div className="col-span-2">Chứng từ</div>
            <div className="col-span-2">Thời gian</div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <RefreshCw size={16} className="animate-spin" /> Đang tải...
              </div>
            ) : filteredNhatKy.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ClipboardList size={36} className="mb-2 opacity-30" />
                <p className="text-sm">Không có nhật ký nào</p>
              </div>
            ) : filteredNhatKy.map(log => {
              const cfg = LOAI_CONFIG[log.LoaiBienDong] || { label: log.LoaiBienDong, cls: 'bg-gray-100 text-gray-600', icon: null }
              const isPlus = log.LoaiBienDong === 'Import' || log.LoaiBienDong === 'Audit_Gain'
              return (
                <div key={log.MaLog} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-gray-50 transition-colors">
                  <div className="col-span-3">
                    <p className="font-medium text-gray-800 text-xs">{log.TenNL}</p>
                    <p className="text-[11px] text-gray-400">{log.MaNL}</p>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', cfg.cls)}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <div className="col-span-1 text-right">
                    <span className={clsx('font-bold text-sm', isPlus ? 'text-green-600' : 'text-red-600')}>
                      {isPlus ? '+' : '-'}{log.SoLuong}
                    </span>
                  </div>

                  <div className="col-span-2 text-right text-xs text-gray-500">
                    {log.SoLuongTruoc} → <span className="font-semibold text-gray-700">{log.SoLuongSau}</span>
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs font-mono text-gray-600">{log.MaChungTu || '—'}</p>
                    <p className="text-[11px] text-gray-400">{log.TenNV}</p>
                  </div>

                  <div className="col-span-2 text-xs text-gray-500">
                    {fmtDateTime(log.NgayThayDoi)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <p className="text-xs text-gray-400">{filteredNhatKy.length} bản ghi</p>
          </div>
        </div>
      )}
    </div>
  )
}
