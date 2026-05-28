/**
 * KhachHangModal — Modal xem/sửa/thêm khách hàng
 *
 * Mode:
 *   mode='view'  → xem thông tin + lịch sử mua hàng, có nút "Chỉnh sửa"
 *   mode='edit'  → form chỉnh sửa điểm, hạng
 *   mode='add'   → form thêm khách hàng mới (tên + SĐT)
 *
 * Props:
 *   customer    object | null  (null khi mode='add')
 *   mode        'view' | 'edit' | 'add'
 *   onClose     fn()
 *   onSave      fn(data)  → trả data về cho page xử lý
 *   orderHistory array    (các đơn hàng của KH, để hiển thị khi view)
 */
import { useState, useEffect } from 'react'
import { X, User, Phone, Star, Award, ShoppingBag, Edit2, Check } from 'lucide-react'
import clsx from 'clsx'
import { fmtCurrency } from '../../lib/format'

/* ── Hạng thành viên config ─────────────────────────────────────────────── */
const MEMBERSHIP = {
  Bronze:  { cls: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🥉', label: 'Bronze'  },
  Silver:  { cls: 'bg-gray-100 text-gray-700 border-gray-200',       icon: '🥈', label: 'Silver'  },
  Gold:    { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🥇', label: 'Gold'    },
  Diamond: { cls: 'bg-blue-100 text-blue-700 border-blue-200',       icon: '💎', label: 'Diamond' },
}

const HANG_OPTIONS = ['Bronze', 'Silver', 'Gold', 'Diamond']

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function KhachHangModal({ customer, mode: initMode, onClose, onSave, orderHistory = [] }) {
  const [mode, setMode] = useState(initMode)

  // Form state
  const [tenKH,   setTenKH]   = useState(customer?.TenKH   || '')
  const [sdt,     setSDT]     = useState(customer?.SDT      || '')
  const [diem,    setDiem]    = useState(customer?.DiemTichLuy ?? 0)
  const [hang,    setHang]    = useState(customer?.HangThanhVien || 'Bronze')
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})

  useEffect(() => { setMode(initMode) }, [initMode])

  /* ── Validation ── */
  const validate = () => {
    const e = {}
    if (!tenKH.trim())              e.tenKH = 'Vui lòng nhập tên khách hàng'
    if (!/^0\d{9}$/.test(sdt))     e.sdt   = 'SĐT không hợp lệ (10 số, bắt đầu bằng 0)'
    if (diem < 0)                   e.diem  = 'Điểm không được âm'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Submit ── */
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 300)) // mock delay
    onSave({ TenKH: tenKH.trim(), SDT: sdt.trim(), DiemTichLuy: Number(diem), HangThanhVien: hang })
    setSaving(false)
  }

  const mem = MEMBERSHIP[customer?.HangThanhVien] || MEMBERSHIP.Bronze

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-base">
            {mode === 'add'  ? 'Thêm khách hàng mới' :
             mode === 'edit' ? 'Chỉnh sửa thông tin'  :
             'Chi tiết khách hàng'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400
                       hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Nội dung ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ─── VIEW mode ─── */}
          {mode === 'view' && customer && (
            <>
              {/* Avatar + hạng */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
                  {mem.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-lg leading-tight">{customer.TenKH}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                    <Phone size={12} /> {customer.SDT}
                  </p>
                  <span className={clsx('inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold border', mem.cls)}>
                    {mem.icon} {mem.label}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <Star size={14} className="text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{customer.DiemTichLuy?.toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400">Điểm tích lũy</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <ShoppingBag size={14} className="text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800">{customer.TongDonHang || 0}</p>
                  <p className="text-[11px] text-gray-400">Đơn hàng</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <Award size={14} className="text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-800">{fmtCurrency(customer.TongChiTieu || 0)}</p>
                  <p className="text-[11px] text-gray-400">Tổng chi tiêu</p>
                </div>
              </div>

              {/* Ngày tham gia */}
              <div className="text-xs text-gray-400 text-center">
                Tham gia từ {fmtDate(customer.NgayThamGia)}
              </div>

              {/* Lịch sử mua hàng gần đây */}
              {orderHistory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Đơn hàng gần đây
                  </p>
                  <div className="space-y-1.5">
                    {orderHistory.slice(0, 4).map(o => (
                      <div key={o.MaHD} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs font-mono font-semibold text-gray-700">{o.MaHD}</p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(o.NgayLap).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-800">{fmtCurrency(o.TongThanhToan)}</p>
                          <span className={clsx(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                            o.TrangThai === 'Completed' ? 'bg-green-100 text-green-700' :
                            o.TrangThai === 'Cancelled' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-700'
                          )}>
                            {o.TrangThai === 'Completed' ? 'Hoàn thành' :
                             o.TrangThai === 'Cancelled' ? 'Đã huỷ' : 'Đang xử lý'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── ADD / EDIT mode ─── */}
          {(mode === 'add' || mode === 'edit') && (
            <div className="space-y-4">
              {/* Tên KH */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={tenKH}
                    onChange={e => setTenKH(e.target.value)}
                    placeholder="Nhập tên khách hàng..."
                    className={clsx('input pl-8 w-full text-sm', errors.tenKH && 'border-red-400 focus:ring-red-300')}
                  />
                </div>
                {errors.tenKH && <p className="text-xs text-red-500 mt-1">{errors.tenKH}</p>}
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={sdt}
                    onChange={e => setSDT(e.target.value)}
                    placeholder="0xxxxxxxxx"
                    disabled={mode === 'edit'} // không cho đổi SĐT khi sửa
                    className={clsx(
                      'input pl-8 w-full text-sm',
                      errors.sdt && 'border-red-400 focus:ring-red-300',
                      mode === 'edit' && 'bg-gray-50 cursor-not-allowed text-gray-400'
                    )}
                  />
                </div>
                {errors.sdt && <p className="text-xs text-red-500 mt-1">{errors.sdt}</p>}
                {mode === 'edit' && <p className="text-[11px] text-gray-400 mt-1">SĐT không thể thay đổi</p>}
              </div>

              {/* Hạng thành viên */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Hạng thành viên</label>
                <div className="grid grid-cols-2 gap-2">
                  {HANG_OPTIONS.map(h => {
                    const m = MEMBERSHIP[h]
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHang(h)}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all',
                          hang === h ? m.cls + ' border-current' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                        )}
                      >
                        <span>{m.icon}</span> {m.label}
                        {hang === h && <Check size={13} className="ml-auto" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Điểm tích lũy (chỉ edit) */}
              {mode === 'edit' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Điểm tích lũy</label>
                  <input
                    type="number"
                    min={0}
                    value={diem}
                    onChange={e => setDiem(e.target.value)}
                    className={clsx('input w-full text-sm', errors.diem && 'border-red-400')}
                  />
                  {errors.diem && <p className="text-xs text-red-500 mt-1">{errors.diem}</p>}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          {mode === 'view' ? (
            <>
              <button onClick={onClose} className="btn-secondary text-sm px-4 py-1.5">Đóng</button>
              <button
                onClick={() => setMode('edit')}
                className="btn-primary flex items-center gap-1.5 text-sm px-4 py-1.5"
              >
                <Edit2 size={13} /> Chỉnh sửa
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => mode === 'edit' ? setMode('view') : onClose()}
                className="btn-secondary text-sm px-4 py-1.5"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-1.5 text-sm px-4 py-1.5 disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : mode === 'add' ? 'Thêm khách hàng' : 'Lưu thay đổi'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
