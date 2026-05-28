/**
 * PhieuNhap.jsx — UI 07: Quản lý Phiếu Nhập hàng
 * Route: /phieu-nhap
 *
 * Luồng nghiệp vụ:
 *   - Tạo: kho + quản lý + role_admin → tạo phiếu Draft
 *   - Duyệt (→ Approved): quản lý + role_admin → trigger tăng tồn kho
 *   - Huỷ (→ Cancelled): quản lý + role_admin
 *
 * Cấu trúc trang:
 *   - Thanh lọc + nút "Tạo phiếu nhập"
 *   - Danh sách phiếu (accordion xem chi tiết)
 *   - Form tạo phiếu mới (hiện inline khi nhấn nút)
 *
 * USE_MOCK = true → dùng MOCK_PHIEU_NHAP, MOCK_NHA_CUNG_CAP, MOCK_TONKHO
 */
import { useState, useMemo } from 'react'
import {
  Truck, Plus, ChevronDown, ChevronUp, CheckCircle,
  XCircle, Trash2, RefreshCw, Search, PackagePlus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import { MOCK_PHIEU_NHAP, MOCK_NHA_CUNG_CAP, MOCK_TONKHO } from '../lib/mock'
import { fmtCurrency } from '../lib/format'
import { useAuthStore } from '../store/authStore'

/* ── Feature flag ─────────────────────────────────────────────────────────── */
const USE_MOCK = true

/* ── Status config ────────────────────────────────────────────────────────── */
const STATUS = {
  Draft:     { label: 'Bản nháp',  cls: 'bg-gray-100 text-gray-600'    },
  Approved:  { label: 'Đã duyệt',  cls: 'bg-green-100 text-green-700'  },
  Cancelled: { label: 'Đã huỷ',    cls: 'bg-red-100 text-red-600'      },
}

const STATUS_FILTER = [
  { value: '',          label: 'Tất cả'    },
  { value: 'Draft',     label: 'Bản nháp'  },
  { value: 'Approved',  label: 'Đã duyệt'  },
  { value: 'Cancelled', label: 'Đã huỷ'    },
]

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function genMaPN() {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,'')
  return `PN${d}${String(Math.floor(Math.random()*900)+100)}`
}

/* ── Phiếu accordion row ─────────────────────────────────────────────────── */
function PhieuRow({ phieu, canApprove, onApprove, onCancel }) {
  const [open, setOpen] = useState(false)
  const st = STATUS[phieu.TrangThai] || STATUS.Draft

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
          {/* Mã phiếu */}
          <div className="col-span-3">
            <p className="font-mono text-xs font-bold text-gray-700">{phieu.MaPN}</p>
            <p className="text-[11px] text-gray-400">{fmtDateTime(phieu.NgayTao)}</p>
          </div>
          {/* NCC */}
          <div className="col-span-4">
            <p className="text-sm font-medium text-gray-800 truncate">{phieu.TenNCC}</p>
            <p className="text-[11px] text-gray-400">{phieu.NguoiTao}</p>
          </div>
          {/* Ngày nhập dự kiến */}
          <div className="col-span-2 text-xs text-gray-500 text-center">
            {fmtDate(phieu.NgayNhap)}
          </div>
          {/* Tổng tiền */}
          <div className="col-span-2 text-right">
            <p className="text-sm font-semibold text-gray-800">{fmtCurrency(phieu.TongTien)}</p>
            <p className="text-[11px] text-gray-400">{phieu.chiTiet?.length} nguyên liệu</p>
          </div>
          {/* Trạng thái */}
          <div className="col-span-1 flex justify-end">
            <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', st.cls)}>
              {st.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {canApprove && phieu.TrangThai === 'Draft' && (
            <>
              <button
                onClick={e => { e.stopPropagation(); onApprove(phieu.MaPN) }}
                className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
              >
                <CheckCircle size={12} /> Duyệt
              </button>
              <button
                onClick={e => { e.stopPropagation(); onCancel(phieu.MaPN) }}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
              >
                <XCircle size={12} /> Huỷ
              </button>
            </>
          )}
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </div>

      {/* Chi tiết */}
      {open && (
        <div className="border-t border-gray-100">
          {phieu.GhiChu && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
              <p className="text-xs text-amber-700"><span className="font-semibold">Ghi chú:</span> {phieu.GhiChu}</p>
            </div>
          )}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            <div className="col-span-5">Nguyên liệu</div>
            <div className="col-span-1 text-center">ĐV</div>
            <div className="col-span-2 text-right">Số lượng</div>
            <div className="col-span-2 text-right">Đơn giá</div>
            <div className="col-span-2 text-right">Thành tiền</div>
          </div>
          {(phieu.chiTiet || []).map((row, i) => (
            <div key={i} className={clsx(
              'grid grid-cols-12 gap-2 px-4 py-2.5 text-sm border-t border-gray-50',
              i % 2 === 1 ? 'bg-gray-50/40' : ''
            )}>
              <div className="col-span-5">
                <p className="font-medium text-gray-800">{row.TenNL}</p>
                <p className="text-[11px] text-gray-400">{row.MaNL}</p>
              </div>
              <div className="col-span-1 text-center text-xs text-gray-500">{row.DonViTinh}</div>
              <div className="col-span-2 text-right text-sm font-semibold text-gray-700">{row.SoLuong}</div>
              <div className="col-span-2 text-right text-xs text-gray-500">{fmtCurrency(row.DonGia)}</div>
              <div className="col-span-2 text-right text-sm font-semibold text-gray-800">{fmtCurrency(row.ThanhTien)}</div>
            </div>
          ))}
          <div className="flex justify-end px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <span className="text-sm font-bold text-gray-800">
              Tổng: <span className="text-brand-600 ml-1">{fmtCurrency(phieu.TongTien)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function PhieuNhap() {
  const { user } = useAuthStore()
  const canCreate  = ['role_admin', 'role_readonly', 'role_warehouse_staff'].includes(user?.vaiTro)
  const canApprove = ['role_admin', 'role_readonly'].includes(user?.vaiTro)

  const [phieuList, setPhieuList] = useState(MOCK_PHIEU_NHAP)
  const [showForm,  setShowForm]  = useState(false)
  const [search,    setSearch]    = useState('')
  const [filterSt,  setFilterSt]  = useState('')

  /* ── Form state ── */
  const [maNCC,    setMaNCC]    = useState('')
  const [ngay,     setNgay]     = useState('')
  const [ghiChu,   setGhiChu]   = useState('')
  const [chiTiet,  setChiTiet]  = useState([{ MaNL: '', SoLuong: '', DonGia: '' }])
  const [saving,   setSaving]   = useState(false)

  const tongTien = chiTiet.reduce((s, r) => s + (parseFloat(r.SoLuong)||0) * (parseFloat(r.DonGia)||0), 0)

  const addRow    = () => setChiTiet(p => [...p, { MaNL: '', SoLuong: '', DonGia: '' }])
  const removeRow = (i) => setChiTiet(p => p.filter((_, idx) => idx !== i))
  const updateRow = (i, field, val) => setChiTiet(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = phieuList
    if (filterSt) list = list.filter(p => p.TrangThai === filterSt)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.MaPN.toLowerCase().includes(q) || p.TenNCC.toLowerCase().includes(q))
    }
    return list
  }, [phieuList, filterSt, search])

  /* ── Validate form ── */
  const validate = () => {
    if (!maNCC)       { toast.error('Vui lòng chọn nhà cung cấp'); return false }
    if (!ngay)        { toast.error('Vui lòng chọn ngày nhập dự kiến'); return false }
    const valid = chiTiet.every(r => r.MaNL && parseFloat(r.SoLuong) > 0 && parseFloat(r.DonGia) > 0)
    if (!valid)       { toast.error('Vui lòng điền đầy đủ thông tin các dòng nguyên liệu'); return false }
    return true
  }

  /* ── Tạo phiếu ── */
  const handleCreate = async () => {
    if (!validate()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))

    const ncc = MOCK_NHA_CUNG_CAP.find(n => n.MaNCC === maNCC)
    const rows = chiTiet.map(r => {
      const nl = MOCK_TONKHO.find(n => n.MaNL === r.MaNL)
      return {
        MaNL: r.MaNL, TenNL: nl?.TenNL || r.MaNL, DonViTinh: nl?.DonViTinh || '',
        SoLuong: parseFloat(r.SoLuong), DonGia: parseFloat(r.DonGia),
        ThanhTien: parseFloat(r.SoLuong) * parseFloat(r.DonGia),
      }
    })

    const phieuMoi = {
      MaPN: genMaPN(), MaNCC: maNCC, TenNCC: ncc?.TenNCC || '',
      MaCN: user?.maCN || 'CN001', TenCN: user?.tenCN || '',
      NgayNhap: ngay, GhiChu: ghiChu,
      TrangThai: 'Draft',
      NgayTao: new Date().toISOString(), NguoiTao: user?.hoTen || '',
      TongTien: tongTien, chiTiet: rows,
    }
    setPhieuList(p => [phieuMoi, ...p])
    toast.success(`Đã tạo phiếu nhập ${phieuMoi.MaPN}`)
    // Reset form
    setMaNCC(''); setNgay(''); setGhiChu(''); setChiTiet([{ MaNL: '', SoLuong: '', DonGia: '' }])
    setShowForm(false)
    setSaving(false)
  }

  /* ── Duyệt phiếu ── */
  const handleApprove = async (maPN) => {
    if (!window.confirm(`Duyệt phiếu ${maPN}? Tồn kho sẽ được cập nhật tự động.`)) return
    await new Promise(r => setTimeout(r, 400))
    setPhieuList(p => p.map(x => x.MaPN === maPN ? { ...x, TrangThai: 'Approved' } : x))
    toast.success('Đã duyệt phiếu và cập nhật tồn kho')
  }

  /* ── Huỷ phiếu ── */
  const handleCancel = async (maPN) => {
    if (!window.confirm(`Huỷ phiếu ${maPN}?`)) return
    await new Promise(r => setTimeout(r, 300))
    setPhieuList(p => p.map(x => x.MaPN === maPN ? { ...x, TrangThai: 'Cancelled' } : x))
    toast.success('Đã huỷ phiếu nhập')
  }

  const draftCount = phieuList.filter(p => p.TrangThai === 'Draft').length

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Tìm mã phiếu hoặc nhà cung cấp..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-8 text-sm w-full"
          />
        </div>
        <select value={filterSt} onChange={e => setFilterSt(e.target.value)} className="input text-sm w-40">
          {STATUS_FILTER.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {draftCount > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg font-semibold">
            {draftCount} phiếu chờ duyệt
          </span>
        )}
        {canCreate && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm ml-auto">
            <Plus size={15} /> Tạo phiếu nhập
          </button>
        )}
      </div>

      {/* ══ FORM TẠO PHIẾU ══ */}
      {showForm && (
        <div className="card shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-800 flex items-center gap-2">
              <PackagePlus size={16} className="text-brand-500" /> Tạo phiếu nhập mới
            </p>
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">✕ Đóng</button>
          </div>

          {/* Row 1: NCC + Ngày + Ghi chú */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <select value={maNCC} onChange={e => setMaNCC(e.target.value)} className="input text-sm w-full">
                <option value="">-- Chọn NCC --</option>
                {MOCK_NHA_CUNG_CAP.map(n => (
                  <option key={n.MaNCC} value={n.MaNCC}>{n.TenNCC}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Ngày nhập dự kiến <span className="text-red-500">*</span>
              </label>
              <input type="date" value={ngay} onChange={e => setNgay(e.target.value)} className="input text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
              <input
                type="text" placeholder="Ghi chú cho phiếu..."
                value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                className="input text-sm w-full"
              />
            </div>
          </div>

          {/* Bảng nguyên liệu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">
                Danh sách nguyên liệu <span className="text-red-500">*</span>
              </label>
              <button onClick={addRow} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                <Plus size={12} /> Thêm dòng
              </button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-t-lg text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              <div className="col-span-5">Nguyên liệu</div>
              <div className="col-span-2 text-center">ĐV</div>
              <div className="col-span-2">Số lượng</div>
              <div className="col-span-2">Đơn giá (₫)</div>
              <div className="col-span-1"></div>
            </div>

            <div className="border border-gray-100 rounded-b-lg divide-y divide-gray-50">
              {chiTiet.map((row, i) => {
                const nl = MOCK_TONKHO.find(n => n.MaNL === row.MaNL)
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <div className="col-span-5">
                      <select
                        value={row.MaNL} onChange={e => updateRow(i, 'MaNL', e.target.value)}
                        className="input text-xs w-full py-1.5"
                      >
                        <option value="">-- Chọn nguyên liệu --</option>
                        {MOCK_TONKHO.map(n => (
                          <option key={n.MaNL} value={n.MaNL}>{n.TenNL}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 text-center text-xs text-gray-500">{nl?.DonViTinh || '—'}</div>
                    <div className="col-span-2">
                      <input
                        type="number" min={0} step="0.01" placeholder="0"
                        value={row.SoLuong} onChange={e => updateRow(i, 'SoLuong', e.target.value)}
                        className="input text-xs w-full py-1.5"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number" min={0} placeholder="0"
                        value={row.DonGia} onChange={e => updateRow(i, 'DonGia', e.target.value)}
                        className="input text-xs w-full py-1.5"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {chiTiet.length > 1 && (
                        <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tổng */}
            <div className="flex justify-end mt-2">
              <span className="text-sm font-bold text-gray-800">
                Tổng tiền: <span className="text-brand-600 ml-1">{fmtCurrency(tongTien)}</span>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm px-4 py-1.5">Huỷ</button>
            <button
              onClick={handleCreate} disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-sm px-4 py-1.5 disabled:opacity-60"
            >
              {saving ? <><RefreshCw size={13} className="animate-spin" /> Đang lưu...</> : <><Truck size={13} /> Tạo phiếu nháp</>}
            </button>
          </div>
        </div>
      )}

      {/* ══ DANH SÁCH PHIẾU ══ */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          <div className="col-span-3">Mã phiếu / Ngày tạo</div>
          <div className="col-span-4">Nhà cung cấp / Người tạo</div>
          <div className="col-span-2 text-center">Ngày nhập DK</div>
          <div className="col-span-2 text-right">Tổng tiền</div>
          <div className="col-span-1 text-right">T.Thái</div>
        </div>

        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
            <Truck size={36} className="mb-2 opacity-30" />
            <p className="text-sm">Không có phiếu nhập nào</p>
          </div>
        ) : filtered.map(phieu => (
          <PhieuRow
            key={phieu.MaPN}
            phieu={phieu}
            canApprove={canApprove}
            onApprove={handleApprove}
            onCancel={handleCancel}
          />
        ))}
      </div>

    </div>
  )
}