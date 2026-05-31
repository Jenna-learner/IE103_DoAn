import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Package, AlertTriangle, DollarSign, Search,
  RefreshCw, ArrowDownCircle, ArrowUpCircle, ClipboardList, Database,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { MOCK_TONKHO, MOCK_NHATKYKHO } from '../lib/mock'
import { fmtCurrency, fmtNumber } from '../lib/format'
import { isMockSession } from '../lib/mockSession'

const GIA_NHAP_MAP = Object.fromEntries(MOCK_TONKHO.map((item) => [item.MaNL, item.GiaNhap]))

const LOAI_CONFIG = {
  Import:     { label: 'Nhập kho',    cls: 'bg-green-100 text-green-700', icon: <ArrowDownCircle size={12} /> },
  Export:     { label: 'Xuất kho',    cls: 'bg-blue-100 text-blue-700',   icon: <ArrowUpCircle size={12} /> },
  Audit_Loss: { label: 'Hao hụt',     cls: 'bg-red-100 text-red-600',     icon: <AlertTriangle size={12} /> },
  Audit_Gain: { label: 'Điều chỉnh+', cls: 'bg-amber-100 text-amber-700', icon: <RefreshCw size={12} /> },
}

const LOAI_OPTIONS = [
  { value: '',           label: 'Tất cả loại' },
  { value: 'Import',     label: 'Nhập kho' },
  { value: 'Export',     label: 'Xuất kho' },
  { value: 'Audit_Loss', label: 'Hao hụt' },
  { value: 'Audit_Gain', label: 'Điều chỉnh+' },
]

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function normalizeTonKhoItem(item) {
  return {
    MaNL: item.MaNL || item.manl,
    TenNL: item.TenNL || item.tennl,
    DonViTinh: item.DonViTinh || item.donvitinh,
    SoLuongTon: Number(item.SoLuongTon ?? item.soluongton ?? 0),
    TonToiThieu: Number(item.TonToiThieu ?? item.tontoithieu ?? 0),
    GiaNhap: Number(item.GiaNhap ?? item.gianhap ?? GIA_NHAP_MAP[item.MaNL || item.manl] ?? 0),
  }
}

function normalizeNhatKyItem(item) {
  return {
    MaLog: item.MaLog || item.malog,
    MaNL: item.MaNL || item.manl,
    TenNL: item.TenNL || item.tennl,
    LoaiBienDong: item.LoaiBienDong || item.loaibiendong,
    SoLuong: Number(item.SoLuong ?? item.soluong ?? 0),
    SoLuongTruoc: Number(item.SoLuongTruoc ?? item.soluongtruoc ?? 0),
    SoLuongSau: Number(item.SoLuongSau ?? item.soluongsau ?? 0),
    MaChungTu: item.MaChungTu || item.machungtu,
    NgayThayDoi: item.NgayThayDoi || item.ngaythaydoi,
    TenNV: item.TenNhanVien || item.TenNV || item.tennhanvien || '—',
  }
}

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

export default function TonKho() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = location.pathname.includes('nhat-ky') ? 1 : 0

  const [tonKho, setTonKho] = useState([])
  const [nhatKy, setNhatKy] = useState([])
  const [loading, setLoading] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)

  const [search, setSearch] = useState('')
  const [filterLoai, setFilterLoai] = useState('')
  const [showWarnOnly, setShowWarnOnly] = useState(false)

  const loadData = useCallback(async (showToast = false) => {
    setLoading(true)
    if (isMockSession()) {
      setTonKho(MOCK_TONKHO.map(normalizeTonKhoItem))
      setNhatKy(MOCK_NHATKYKHO.map(normalizeNhatKyItem))
      setUsingFallback(true)
      setLoading(false)
      if (showToast) toast.success('Đã làm mới dữ liệu demo kho')
      return
    }
    try {
      const [tkRes, nkRes] = await Promise.all([
        api.get('/kho/ton-kho'),
        api.get('/kho/nhat-ky'),
      ])

      const tonKhoData = (tkRes.data || []).map(normalizeTonKhoItem)
      const nhatKyData = (nkRes.data || []).map(normalizeNhatKyItem)

      setTonKho(tonKhoData)
      setNhatKy(nhatKyData)
      setUsingFallback(false)

      if (showToast) toast.success('Đã làm mới dữ liệu kho')
    } catch (err) {
      setTonKho(MOCK_TONKHO.map(normalizeTonKhoItem))
      setNhatKy(MOCK_NHATKYKHO.map(normalizeNhatKyItem))
      setUsingFallback(true)
      toast.error(err.message || 'Không tải được dữ liệu kho, đang hiển thị dữ liệu demo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredTonKho = useMemo(() => {
    let list = tonKho
    if (showWarnOnly) list = list.filter((item) => item.SoLuongTon <= item.TonToiThieu)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((item) =>
        item.TenNL?.toLowerCase().includes(q) || item.MaNL?.toLowerCase().includes(q)
      )
    }
    return list
  }, [tonKho, search, showWarnOnly])

  const filteredNhatKy = useMemo(() => {
    let list = nhatKy
    if (filterLoai) list = list.filter((item) => item.LoaiBienDong === filterLoai)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((item) =>
        item.TenNL?.toLowerCase().includes(q) ||
        item.MaNL?.toLowerCase().includes(q) ||
        item.MaChungTu?.toLowerCase().includes(q)
      )
    }
    return list
  }, [nhatKy, filterLoai, search])

  const soNLCanhBao = tonKho.filter((item) => item.SoLuongTon <= item.TonToiThieu).length
  const giaTriTonKho = tonKho.reduce((sum, item) => sum + item.SoLuongTon * item.GiaNhap, 0)

  const switchTab = (idx) => {
    setSearch('')
    setFilterLoai('')
    setShowWarnOnly(false)
    navigate(idx === 0 ? '/kho/ton-kho' : '/kho/nhat-ky')
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <KpiCard
          icon={<Package size={18} className="text-brand-600" />}
          label="Tổng nguyên liệu"
          value={`${fmtNumber(tonKho.length)} loại`}
          color="bg-amber-50"
        />
        <KpiCard
          icon={<AlertTriangle size={18} className="text-red-500" />}
          label="Cảnh báo sắp hết"
          value={`${fmtNumber(soNLCanhBao)} loại`}
          color="bg-red-100"
          warn={soNLCanhBao > 0}
        />
        <KpiCard
          icon={<DollarSign size={18} className="text-green-600" />}
          label="Giá trị tồn kho"
          value={fmtCurrency(giaTriTonKho)}
          color="bg-green-50"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="card p-1 flex gap-1 w-fit">
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
              {idx === 0
                ? <Package size={13} className="inline mr-1.5 -mt-0.5" />
                : <ClipboardList size={13} className="inline mr-1.5 -mt-0.5" />}
              {label}
              {idx === 0 && soNLCanhBao > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {soNLCanhBao}
                </span>
              )}
            </button>
          ))}
        </div>

        {usingFallback && (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold">
            <Database size={13} /> Đang hiển thị dữ liệu demo
          </div>
        )}
      </div>

      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 0 ? 'Tìm nguyên liệu...' : 'Tìm nguyên liệu hoặc mã chứng từ...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 text-sm w-full"
          />
        </div>

        {activeTab === 0 && (
          <button
            onClick={() => setShowWarnOnly((value) => !value)}
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
            onChange={(e) => setFilterLoai(e.target.value)}
            className="input text-sm w-44"
          >
            {LOAI_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => loadData(true)}
          className="btn-secondary text-sm px-3 py-2 ml-auto"
          disabled={loading}
        >
          <RefreshCw size={13} className={clsx(loading && 'animate-spin')} /> Làm mới dữ liệu
        </button>
      </div>

      {activeTab === 0 ? (
        <div className="card flex-1 flex flex-col overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
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
            ) : filteredTonKho.map((item, index) => {
              const isWarn = item.SoLuongTon <= item.TonToiThieu
              return (
                <div
                  key={item.MaNL}
                  className={clsx(
                    'grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm transition-colors',
                    isWarn
                      ? 'bg-red-50 hover:bg-red-100/60 border-l-4 border-red-400'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  )}
                >
                  <div className="col-span-1 text-center text-xs text-gray-400">{index + 1}</div>

                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      {isWarn && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                      <div>
                        <p className={clsx('font-medium', isWarn ? 'text-red-700' : 'text-gray-800')}>{item.TenNL}</p>
                        <p className="text-[11px] text-gray-400">{item.MaNL}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 text-center text-xs text-gray-500">{item.DonViTinh}</div>

                  <div className="col-span-2 text-right">
                    <p className={clsx('font-bold text-base', isWarn ? 'text-red-600' : 'text-gray-800')}>
                      {fmtNumber(item.SoLuongTon)}
                    </p>
                    {isWarn && <p className="text-[10px] text-red-500 font-medium">⚠ Sắp hết</p>}
                  </div>

                  <div className="col-span-2 text-right text-xs text-gray-500">
                    {fmtNumber(item.TonToiThieu)} {item.DonViTinh}
                  </div>

                  <div className="col-span-2 text-right text-xs text-gray-600">
                    {item.GiaNhap > 0 ? `${fmtCurrency(item.GiaNhap)}/${item.DonViTinh}` : '—'}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 shrink-0 text-xs text-gray-400">
            {filteredTonKho.length} nguyên liệu hiển thị
          </div>
        </div>
      ) : (
        <div className="card flex-1 flex flex-col overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
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
            ) : filteredNhatKy.map((log) => {
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
                      {isPlus ? '+' : '-'}{fmtNumber(log.SoLuong)}
                    </span>
                  </div>

                  <div className="col-span-2 text-right text-xs text-gray-500">
                    {fmtNumber(log.SoLuongTruoc)} → <span className="font-semibold text-gray-700">{fmtNumber(log.SoLuongSau)}</span>
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

          <div className="px-4 py-3 border-t border-gray-100 shrink-0 text-xs text-gray-400">
            {filteredNhatKy.length} bản ghi hiển thị
          </div>
        </div>
      )}
    </div>
  )
}
