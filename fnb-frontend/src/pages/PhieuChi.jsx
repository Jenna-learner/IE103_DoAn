/**
 * UI 09 — Phiếu Chi vận hành (/phieu-chi)
 * Roles: ALL (xem) | role_admin + role_readonly (duyệt / từ chối) | tất cả (tạo)
 *
 * Tính năng:
 *  - Danh sách phiếu chi dạng bảng (kèm bộ lọc trạng thái + loại chi + tìm kiếm)
 *  - Tạo phiếu chi mới (inline form trong modal)
 *  - Duyệt / Từ chối phiếu (canApprove = role_admin + role_readonly)
 *  - Hủy phiếu do chính mình tạo (chỉ khi pending)
 *  - KPI: tổng chi tháng này, số phiếu chờ duyệt, tổng phiếu
 */
import { useState, useMemo } from 'react'
import { Receipt, Plus, X, Check, ChevronDown, Search } from 'lucide-react'
import clsx from 'clsx'
import { MOCK_PHIEU_CHI } from '../lib/mock'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const USE_MOCK = true

// ─── Config ──────────────────────────────────────────────────────────────────
const LOAI_CHI = ['Vận hành', 'Nguyên liệu', 'Lương', 'Bảo trì', 'Marketing', 'Khác']

// TrangThai khớp DB CHECK: ('Pending', 'Approved', 'Rejected')
const STATUS_CFG = {
  Pending:  { label: 'Chờ duyệt', cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  Approved: { label: 'Đã duyệt',  cls: 'bg-green-500/15 text-green-300 border border-green-500/30' },
  Rejected: { label: 'Từ chối',   cls: 'bg-red-500/15 text-red-300 border border-red-500/30' },
}

function fmt(n) {
  return n?.toLocaleString('vi-VN') + ' ₫'
}

function genMaPC() {
  const now = new Date()
  const yyyymmdd = now.toISOString().slice(0,10).replace(/-/g,'')
  const rand = Math.floor(Math.random() * 900 + 100)
  return `PChi${yyyymmdd}${rand}`
}

// ─── Row component (accordion) ────────────────────────────────────────────────
function PhieuRow({ pc, canApprove, currentUser, onApprove, onReject, onCancel }) {
  const [open, setOpen] = useState(false)
  const [lyDo, setLyDo] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)
  const cfg = STATUS_CFG[pc.TrangThai] || STATUS_CFG.Pending
  const canCancel = pc.NguoiLap === currentUser?.hoTen && pc.TrangThai === 'Pending'

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden bg-surface/50">
      {/* Row header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0 grid grid-cols-5 gap-3 items-center">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Mã phiếu</p>
            <p className="text-white text-sm font-mono font-medium">{pc.MaPC}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Loại chi</p>
            <p className="text-gray-200 text-sm">{pc.LoaiChi}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mb-0.5">Mô tả</p>
            <p className="text-gray-200 text-sm truncate">{pc.MoTa}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-base">{fmt(pc.SoTien)}</p>
            <p className="text-gray-600 text-xs mt-0.5">{pc.NgayChi}</p>
          </div>
        </div>
        <span className={clsx('shrink-0 text-xs px-2.5 py-1 rounded-full font-medium', cfg.cls)}>{cfg.label}</span>
        <ChevronDown size={15} className={clsx('shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-1">Người lập</p>
              <p className="text-gray-200">{pc.NguoiLap}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Chi nhánh</p>
              <p className="text-gray-200">{pc.TenCN}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Trạng thái</p>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', cfg.cls)}>{cfg.label}</span>
            </div>
            {pc.NguoiDuyet && (
              <div>
                <p className="text-gray-500 text-xs mb-1">Người duyệt</p>
                <p className="text-gray-200">{pc.NguoiDuyet}</p>
              </div>
            )}
            {pc.NgayDuyet && (
              <div>
                <p className="text-gray-500 text-xs mb-1">Ngày duyệt</p>
                <p className="text-gray-200">{pc.NgayDuyet}</p>
              </div>
            )}
            {pc.LyDoTuChoi && (
              <div className="col-span-3">
                <p className="text-gray-500 text-xs mb-1">Lý do từ chối</p>
                <p className="text-red-300 text-sm italic">"{pc.LyDoTuChoi}"</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {pc.TrangThai === 'Pending' && (
            <div className="flex gap-2 pt-2 border-t border-white/5">
              {canApprove && (
                <>
                  <button
                    onClick={() => onApprove(pc.MaPC)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Check size={13} /> Duyệt
                  </button>
                  {!showRejectBox ? (
                    <button
                      onClick={() => setShowRejectBox(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition-colors"
                    >
                      <X size={13} /> Từ chối
                    </button>
                  ) : (
                    <div className="flex gap-2 flex-1">
                      <input
                        value={lyDo}
                        onChange={e => setLyDo(e.target.value)}
                        placeholder="Nhập lý do từ chối..."
                        className="flex-1 bg-surface border border-red-500/30 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-gray-600"
                      />
                      <button
                        onClick={() => { onReject(pc.MaPC, lyDo); setShowRejectBox(false); setLyDo('') }}
                        disabled={!lyDo.trim()}
                        className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Xác nhận
                      </button>
                      <button
                        onClick={() => { setShowRejectBox(false); setLyDo('') }}
                        className="px-2 py-1.5 text-gray-500 hover:text-white transition-colors text-xs"
                      >
                        Huỷ
                      </button>
                    </div>
                  )}
                </>
              )}
              {canCancel && (
                <button
                  onClick={() => onCancel(pc.MaPC)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  <X size={13} /> Hủy phiếu
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PhieuChi() {
  const user = useAuthStore((s) => s.user)
  const canApprove = ['role_admin', 'role_readonly'].includes(user?.vaiTro)

  const [records, setRecords] = useState(USE_MOCK ? MOCK_PHIEU_CHI : [])
  const [filterStatus, setFilterStatus]   = useState('all')
  const [filterLoai, setFilterLoai]       = useState('all')
  const [search, setSearch]               = useState('')
  const [showModal, setShowModal]         = useState(false)
  const [form, setForm] = useState({
    LoaiChi: 'Vận hành',
    MoTa: '',
    SoTien: '',
    NgayChi: new Date().toISOString().slice(0, 10),
  })

  // ─── KPI ───────────────────────────────────────────────────────────────────
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const tongChiThang = records
    .filter(r => r.TrangThai === 'Approved' && r.NgayChi.startsWith(thisMonth))
    .reduce((s, r) => s + r.SoTien, 0)
  const chooDuyet = records.filter(r => r.TrangThai === 'Pending').length
  const tongPhieu = records.length

  // ─── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records
      .filter(r => filterStatus === 'all' || r.TrangThai === filterStatus)
      .filter(r => filterLoai === 'all' || r.LoaiChi === filterLoai)
      .filter(r => {
        if (!search) return true
        const q = search.toLowerCase()
        return r.MaPC.toLowerCase().includes(q) || r.MoTa.toLowerCase().includes(q) || r.NguoiLap.toLowerCase().includes(q)
      })
      .sort((a, b) => b.NgayChi.localeCompare(a.NgayChi))
  }, [records, filterStatus, filterLoai, search])

  // ─── Handlers ───────────────────────────────────────────────────────────────
  function handleCreate() {
    if (!form.MoTa.trim() || !form.SoTien) return
    const newRec = {
      MaPC:       genMaPC(),
      LoaiChi:    form.LoaiChi,
      MoTa:       form.MoTa.trim(),
      SoTien:     Number(form.SoTien),
      NgayChi:    form.NgayChi,
      TrangThai:  'Pending',
      NguoiLap:   user?.hoTen || 'Người dùng',
      MaCN:       user?.maCN  || 'CN001',
      TenCN:      user?.tenCN || 'Chi nhánh',
      NguoiDuyet: null,
      NgayDuyet:  null,
      LyDoTuChoi: null,
    }
    setRecords(prev => [newRec, ...prev])
    toast.success('Đã tạo phiếu chi!')
    setShowModal(false)
    setForm({ LoaiChi: 'Vận hành', MoTa: '', SoTien: '', NgayChi: new Date().toISOString().slice(0,10) })
  }

  function handleApprove(MaPC) {
    setRecords(prev => prev.map(r =>
      r.MaPC === MaPC
        ? { ...r, TrangThai: 'Approved', NguoiDuyet: user?.hoTen, NgayDuyet: new Date().toISOString().slice(0,10) }
        : r
    ))
    toast.success('Đã duyệt phiếu chi!')
  }

  function handleReject(MaPC, lyDo) {
    setRecords(prev => prev.map(r =>
      r.MaPC === MaPC
        ? { ...r, TrangThai: 'Rejected', NguoiDuyet: user?.hoTen, NgayDuyet: new Date().toISOString().slice(0,10), LyDoTuChoi: lyDo }
        : r
    ))
    toast.success('Đã từ chối phiếu chi.')
  }

  function handleCancel(MaPC) {
    // DB không có 'Cancelled' — người lập tự hủy → ghi nhận là 'Rejected' với lý do tự hủy
    setRecords(prev => prev.map(r =>
      r.MaPC === MaPC
        ? { ...r, TrangThai: 'Rejected', NguoiDuyet: r.NguoiLap, NgayDuyet: new Date().toISOString().slice(0,10), LyDoTuChoi: 'Người lập phiếu tự hủy' }
        : r
    ))
    toast('Đã hủy phiếu chi.', { icon: '🗑️' })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt size={22} className="text-brand-400" />
            Phiếu Chi vận hành
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Quản lý các khoản chi phí hoạt động chi nhánh</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Tạo phiếu chi
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng chi đã duyệt (tháng này)', value: fmt(tongChiThang), sub: 'Chỉ tính phiếu đã duyệt', accent: false },
          { label: 'Phiếu chờ duyệt', value: chooDuyet, sub: 'Cần xử lý', accent: chooDuyet > 0 },
          { label: 'Tổng phiếu chi', value: tongPhieu, sub: 'Tất cả trạng thái', accent: false },
        ].map(k => (
          <div key={k.label} className="bg-surface rounded-xl p-4 border border-white/5">
            <p className="text-gray-500 text-xs">{k.label}</p>
            <p className={clsx('font-bold text-2xl mt-1', k.accent ? 'text-amber-400' : 'text-white')}>{k.value}</p>
            <p className="text-gray-600 text-xs mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã phiếu, mô tả, người lập..."
            className="w-full pl-9 pr-3 py-2 bg-surface border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Pending">Chờ duyệt</option>
          <option value="Approved">Đã duyệt</option>
          <option value="Rejected">Từ chối / Đã hủy</option>
        </select>

        {/* Loại chi filter */}
        <select
          value={filterLoai}
          onChange={e => setFilterLoai(e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">Tất cả loại chi</option>
          {LOAI_CHI.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <Receipt size={32} className="mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy phiếu chi nào</p>
          </div>
        )}
        {filtered.map(pc => (
          <PhieuRow
            key={pc.MaPC}
            pc={pc}
            canApprove={canApprove}
            currentUser={user}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={handleCancel}
          />
        ))}
      </div>

      {/* ── Modal tạo phiếu chi ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-sidebar rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Receipt size={16} className="text-brand-400" />
                Tạo phiếu chi mới
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Loại chi */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Loại chi <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {LOAI_CHI.map(l => (
                    <button
                      key={l}
                      onClick={() => setForm(f => ({ ...f, LoaiChi: l }))}
                      className={clsx(
                        'px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
                        form.LoaiChi === l
                          ? 'bg-brand-500/15 border-brand-500 text-brand-300'
                          : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Mô tả chi tiết <span className="text-red-400">*</span></label>
                <textarea
                  rows={3}
                  value={form.MoTa}
                  onChange={e => setForm(f => ({ ...f, MoTa: e.target.value }))}
                  placeholder="Nhập mô tả khoản chi..."
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-600"
                />
              </div>

              {/* Số tiền + Ngày lập */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Số tiền (VNĐ) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={form.SoTien}
                    onChange={e => setForm(f => ({ ...f, SoTien: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-600"
                  />
                  {form.SoTien && (
                    <p className="text-brand-400 text-xs mt-1">{fmt(Number(form.SoTien))}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Ngày lập</label>
                  <input
                    type="date"
                    value={form.NgayChi}
                    onChange={e => setForm(f => ({ ...f, NgayChi: e.target.value }))}
                    className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Người lập (readonly) */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Người lập</label>
                <input
                  readOnly
                  value={user?.hoTen || '—'}
                  className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.MoTa.trim() || !form.SoTien}
                className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Tạo phiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}