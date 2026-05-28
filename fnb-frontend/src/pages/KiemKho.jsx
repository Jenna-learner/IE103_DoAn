/**
 * KiemKho.jsx — UI 06: Lập Phiếu Kiểm kho & Điều chỉnh
 * Route: /kho/kiem-kho
 *
 * Luồng nghiệp vụ:
 *   1. Nhân viên kho / quản lý lập phiếu kiểm role_warehouse_staff:
 *      - Nhập số lượng thực tế cho từng nguyên liệu
 *      - Hệ thống tự tính chênh lệch (thực tế − hệ thống)
 *      - Nhập lý do điều chỉnh (bắt buộc khi có chênh lệch)
 *      - Gửi → phiếu tạo trạng thái "Chờ duyệt"
 *
 *   2. Admin / Quản lý duyệt phiếu:
 *      - Xem danh sách phiếu Chờ duyệt
 *      - Nhấn "Duyệt" → cập nhật tồn kho + ghi Audit_Loss / Audit_Gain vào nhật ký
 *      - Hoặc "Từ chối" → phiếu bị huỷ
 *
 * USE_MOCK = true → toàn bộ dùng state local
 */
import { useState, useMemo } from 'react'
import {
  ClipboardList, Plus, CheckCircle, XCircle,
  AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import { MOCK_TONKHO } from '../lib/mock'
import { useAuthStore } from '../store/authStore'

/* ── Feature flag ─────────────────────────────────────────────────────────── */
const USE_MOCK = true

/* ── Status config ────────────────────────────────────────────────────────── */
const STATUS = {
  pending:  { label: 'Chờ duyệt', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt',  cls: 'bg-green-100 text-green-700'   },
  rejected: { label: 'Từ chối',   cls: 'bg-red-100 text-red-600'       },
}

function fmtNow() {
  return new Date().toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── Component phiếu kiểm kho chi tiết (accordion) ──────────────────────── */
function PhieuDetail({ phieu, canApprove, onApprove, onReject }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header hàng */}
      <div
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-gray-600">{phieu.maPhieu}</span>
          <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-semibold', STATUS[phieu.status].cls)}>
            {STATUS[phieu.status].label}
          </span>
          <span className="text-xs text-gray-400">{phieu.thoiGian}</span>
          <span className="text-xs text-gray-400">· {phieu.nguoiLap}</span>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && phieu.status === 'pending' && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onApprove(phieu.maPhieu) }}
                className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
              >
                <CheckCircle size={12} /> Duyệt
              </button>
              <button
                onClick={e => { e.stopPropagation(); onReject(phieu.maPhieu) }}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
              >
                <XCircle size={12} /> Từ chối
              </button>
            </>
          )}
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </div>

      {/* Chi tiết */}
      {open && (
        <div className="border-t border-gray-100">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            <div className="col-span-4">Nguyên liệu</div>
            <div className="col-span-1 text-center">ĐV</div>
            <div className="col-span-2 text-right">Hệ thống</div>
            <div className="col-span-2 text-right">Thực tế</div>
            <div className="col-span-1 text-right">Chênh lệch</div>
            <div className="col-span-2">Lý do</div>
          </div>
          {phieu.chiTiet.map((row, i) => {
            const lech = row.thucTe - row.heThong
            return (
              <div key={i} className={clsx(
                'grid grid-cols-12 gap-2 px-4 py-2.5 text-sm border-t border-gray-50',
                lech < 0 ? 'bg-red-50/40' : lech > 0 ? 'bg-green-50/40' : ''
              )}>
                <div className="col-span-4">
                  <p className="text-sm font-medium text-gray-800">{row.tenNL}</p>
                </div>
                <div className="col-span-1 text-center text-xs text-gray-500">{row.donVi}</div>
                <div className="col-span-2 text-right text-xs text-gray-500">{row.heThong}</div>
                <div className="col-span-2 text-right text-xs font-semibold text-gray-800">{row.thucTe}</div>
                <div className="col-span-1 text-right">
                  {lech !== 0 && (
                    <span className={clsx('text-xs font-bold', lech < 0 ? 'text-red-600' : 'text-green-600')}>
                      {lech > 0 ? '+' : ''}{lech.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-xs text-gray-500 italic">{row.lyDo || '—'}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function KiemKho() {
  const { user } = useAuthStore()
  const canApprove = ['role_admin'].includes(user?.vaiTro)

  // Danh sách phiếu kiểm kho (mock state)
  const [phieuList, setPhieuList] = useState([
    {
      maPhieu: 'KK20260525001',
      thoiGian: '25/05/2026 17:00',
      nguoiLap: 'Trần Thị Bình',
      status: 'approved',
      chiTiet: [
        { maNL: 'NL005', tenNL: 'Nước cốt tắc',  donVi: 'lít', heThong: 1.5, thucTe: 1.2, lyDo: 'Đổ vỡ trong ca' },
        { maNL: 'NL006', tenNL: 'Trà vải nụ',     donVi: 'kg',  heThong: 0.6, thucTe: 0.5, lyDo: 'Hao hụt tự nhiên' },
      ],
    },
  ])

  // State form lập phiếu mới
  const [showForm, setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Mỗi dòng nguyên liệu: { maNL, tenNL, donVi, heThong, thucTe, lyDo }
  const initRows = () =>
    MOCK_TONKHO.map(nl => ({
      maNL: nl.MaNL, tenNL: nl.TenNL, donVi: nl.DonViTinh,
      heThong: nl.SoLuongTon, thucTe: '', lyDo: '',
    }))

  const [rows, setRows] = useState(initRows)
  const [search, setSearch] = useState('')

  const updateRow = (maNL, field, val) =>
    setRows(prev => prev.map(r => r.maNL === maNL ? { ...r, [field]: val } : r))

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(r => r.tenNL.toLowerCase().includes(q))
  }, [rows, search])

  // Tính số dòng có chênh lệch
  const soLechDong = rows.filter(r => r.thucTe !== '' && parseFloat(r.thucTe) !== r.heThong).length

  // Validate: dòng có chênh lệch phải có lý do
  const validate = () => {
    for (const r of rows) {
      if (r.thucTe === '') continue
      const lech = parseFloat(r.thucTe) - r.heThong
      if (lech !== 0 && !r.lyDo.trim()) {
        toast.error(`Vui lòng nhập lý do cho "${r.tenNL}"`)
        return false
      }
    }
    return true
  }

  /* ── Gửi phiếu ── */
  const handleSubmit = async () => {
    if (!validate()) return
    const coNhapLieu = rows.some(r => r.thucTe !== '')
    if (!coNhapLieu) { toast.error('Vui lòng nhập ít nhất 1 nguyên liệu'); return }

    setSubmitting(true)
    await new Promise(r => setTimeout(r, 500))

    const chiTiet = rows
      .filter(r => r.thucTe !== '')
      .map(r => ({ ...r, thucTe: parseFloat(r.thucTe) }))

    const maPhieu = `KK${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(phieuList.length+1).padStart(3,'0')}`
    setPhieuList(prev => [{
      maPhieu,
      thoiGian: fmtNow(),
      nguoiLap: user?.hoTen || 'Nhân viên',
      status: 'pending',
      chiTiet,
    }, ...prev])

    toast.success('Đã gửi phiếu kiểm kho, chờ quản lý duyệt')
    setRows(initRows())
    setSearch('')
    setShowForm(false)
    setSubmitting(false)
  }

  /* ── Duyệt phiếu ── */
  const handleApprove = async (maPhieu) => {
    if (!window.confirm(`Duyệt phiếu ${maPhieu}? Tồn kho sẽ được cập nhật theo số thực tế.`)) return
    await new Promise(r => setTimeout(r, 400))
    setPhieuList(prev => prev.map(p => p.maPhieu === maPhieu ? { ...p, status: 'approved' } : p))
    toast.success('Đã duyệt phiếu và cập nhật tồn kho')
  }

  /* ── Từ chối phiếu ── */
  const handleReject = async (maPhieu) => {
    if (!window.confirm(`Từ chối phiếu ${maPhieu}?`)) return
    await new Promise(r => setTimeout(r, 300))
    setPhieuList(prev => prev.map(p => p.maPhieu === maPhieu ? { ...p, status: 'rejected' } : p))
    toast.success('Đã từ chối phiếu kiểm kho')
  }

  const pendingCount = phieuList.filter(p => p.status === 'pending').length

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-brand-500" />
            Kiểm kho & Điều chỉnh
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {pendingCount > 0
              ? `${pendingCount} phiếu đang chờ duyệt`
              : 'Không có phiếu chờ duyệt'}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus size={15} /> Lập phiếu kiểm kho
          </button>
        )}
      </div>

      {/* ══ FORM LẬP PHIẾU ══ */}
      {showForm && (
        <div className="card flex-1 flex flex-col overflow-hidden p-0">
          {/* Form header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Phiếu kiểm kho mới</p>
              <p className="text-xs text-gray-400">{fmtNow()} · {user?.hoTen}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Lọc nguyên liệu..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-7 text-xs py-1.5 w-44"
                />
              </div>
              {soLechDong > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-semibold">
                  {soLechDong} dòng có chênh lệch
                </span>
              )}
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100
                          text-[11px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
            <div className="col-span-4">Nguyên liệu</div>
            <div className="col-span-1 text-center">ĐV</div>
            <div className="col-span-2 text-right">Hệ thống</div>
            <div className="col-span-2 text-right">Thực tế đếm được</div>
            <div className="col-span-1 text-right">Chênh lệch</div>
            <div className="col-span-2">Lý do (nếu lệch)</div>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredRows.map(row => {
              const lech = row.thucTe !== '' ? parseFloat(row.thucTe) - row.heThong : null
              const hasLech = lech !== null && lech !== 0
              const needLyDo = hasLech && !row.lyDo.trim()

              return (
                <div
                  key={row.maNL}
                  className={clsx(
                    'grid grid-cols-12 gap-2 px-4 py-2.5 items-center transition-colors',
                    lech !== null && lech < 0 ? 'bg-red-50/50' :
                    lech !== null && lech > 0 ? 'bg-green-50/50' : ''
                  )}
                >
                  {/* Tên NL */}
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-gray-800">{row.tenNL}</p>
                    <p className="text-[11px] text-gray-400">{row.maNL}</p>
                  </div>

                  {/* Đơn vị */}
                  <div className="col-span-1 text-center text-xs text-gray-500">{row.donVi}</div>

                  {/* Số hệ thống */}
                  <div className="col-span-2 text-right text-sm font-semibold text-gray-600">
                    {row.heThong}
                  </div>

                  {/* Số thực tế */}
                  <div className="col-span-2 flex justify-end">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Nhập..."
                      value={row.thucTe}
                      onChange={e => updateRow(row.maNL, 'thucTe', e.target.value)}
                      className={clsx(
                        'w-24 text-right text-sm px-2 py-1 border rounded-lg outline-none transition-colors',
                        needLyDo
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 focus:border-brand-400 focus:ring-1 focus:ring-brand-200'
                      )}
                    />
                  </div>

                  {/* Chênh lệch */}
                  <div className="col-span-1 text-right">
                    {lech !== null && lech !== 0 && (
                      <span className={clsx(
                        'text-sm font-bold',
                        lech < 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {lech > 0 ? '+' : ''}{lech.toFixed(2)}
                      </span>
                    )}
                    {lech === 0 && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>

                  {/* Lý do */}
                  <div className="col-span-2">
                    {hasLech ? (
                      <input
                        type="text"
                        placeholder="Nhập lý do..."
                        value={row.lyDo}
                        onChange={e => updateRow(row.maNL, 'lyDo', e.target.value)}
                        className={clsx(
                          'w-full text-xs px-2 py-1 border rounded-lg outline-none transition-colors',
                          needLyDo
                            ? 'border-red-300 bg-red-50 placeholder-red-400'
                            : 'border-gray-200 focus:border-brand-400 focus:ring-1 focus:ring-brand-200'
                        )}
                      />
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Form footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between shrink-0">
            <p className="text-xs text-gray-400">
              Sau khi gửi, phiếu sẽ chờ quản lý duyệt trước khi cập nhật tồn kho
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setRows(initRows()); setSearch('') }}
                className="btn-secondary text-sm px-4 py-1.5"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex items-center gap-1.5 text-sm px-4 py-1.5 disabled:opacity-60"
              >
                {submitting
                  ? <><RefreshCw size={13} className="animate-spin" /> Đang gửi...</>
                  : <><CheckCircle size={13} /> Gửi phiếu kiểm kho</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DANH SÁCH PHIẾU ══ */}
      {!showForm && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {phieuList.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
              <ClipboardList size={36} className="mb-2 opacity-30" />
              <p className="text-sm">Chưa có phiếu kiểm kho nào</p>
            </div>
          ) : phieuList.map(phieu => (
            <PhieuDetail
              key={phieu.maPhieu}
              phieu={phieu}
              canApprove={canApprove}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

    </div>
  )
}
