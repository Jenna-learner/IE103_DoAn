/**
 * UI 08 — Phân công Ca làm việc (/phan-cong)
 * Roles: role_admin, role_readonly
 *
 * Tính năng:
 *  - Lịch tuần: 7 cột (T2–CN) × 3 ca (Sáng / Chiều / Tối)
 *  - Chọn tuần bằng nút ← →
 *  - Thêm phân công: chọn ngày + ca + nhân viên → thêm vào ô
 *  - Xoá phân công: nhấn × trên chip nhân viên
 *  - Hiển thị tên + badge vai trò trong mỗi chip
 *  - Tab "Danh sách" để xem toàn bộ theo dạng bảng
 */
import { useState, useMemo } from 'react'
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, Users, List } from 'lucide-react'
import clsx from 'clsx'
import { MOCK_PHAN_CONG, MOCK_NHAN_VIEN } from '../lib/mock'
import useAuthStore from '../store/authStore'

const USE_MOCK = true

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CA_LIST = [
  { id: 'CA001', label: 'Ca Sáng',  time: '06:00–12:00', color: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  { id: 'CA002', label: 'Ca Chiều', time: '12:00–18:00', color: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
  { id: 'CA003', label: 'Ca Tối',   time: '18:00–23:00', color: 'bg-purple-500/10 border-purple-500/30 text-purple-300' },
]

const DOW = ['T2','T3','T4','T5','T6','T7','CN']

const ROLE_LABEL = {
  role_admin:            'Admin',
  role_readonly: 'Quản lý',
  role_cashier:         'Thu ngân',
  role_warehouse_staff:              'Kho vận',
}

const ROLE_COLOR = {
  role_admin:            'bg-purple-500/20 text-purple-300',
  role_readonly: 'bg-blue-500/20 text-blue-300',
  role_cashier:         'bg-amber-500/20 text-amber-300',
  role_warehouse_staff:              'bg-green-500/20 text-green-300',
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function dateKey(date) {
  return date.toISOString().slice(0, 10)
}

function formatDate(date) {
  return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}`
}

function genMaPC() {
  const now = new Date()
  const yyyymmdd = now.toISOString().slice(0,10).replace(/-/g,'')
  const rand = Math.floor(Math.random() * 900 + 100)
  return `PC${yyyymmdd}${rand}`
}

// ─── Component chip nhân viên ─────────────────────────────────────────────────
function NVChip({ nv, onRemove, canEdit }) {
  return (
    <div className="flex items-center gap-1.5 bg-surface rounded-md px-2 py-1 text-xs group">
      <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
        <span className="text-brand-400 text-[9px] font-bold">{nv.HoTen.charAt(0)}</span>
      </div>
      <span className="text-gray-200 truncate max-w-[80px]">{nv.HoTen}</span>
      <span className={clsx('text-[9px] px-1 py-0.5 rounded font-medium shrink-0', ROLE_COLOR[nv.VaiTro])}>
        {ROLE_LABEL[nv.VaiTro]}
      </span>
      {canEdit && (
        <button
          onClick={onRemove}
          className="text-gray-600 hover:text-red-400 transition-colors ml-0.5 shrink-0"
        >
          <X size={10} />
        </button>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PhanCong() {
  const user = useAuthStore((s) => s.user)
  const canEdit = ['role_admin', 'role_readonly'].includes(user?.vaiTro)

  // State tuần hiện tại
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  // State phân công
  const [records, setRecords] = useState(USE_MOCK ? MOCK_PHAN_CONG : [])

  // Tab: 'calendar' | 'list'
  const [tab, setTab] = useState('calendar')

  // Modal thêm phân công
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ NgayLam: dateKey(new Date()), MaCa: 'CA001', MaNV: '' })
  const [filterNV, setFilterNV] = useState('')

  // ─── Week nav ───────────────────────────────────────────────────────────────
  const weekLabel = `${formatDate(weekDays[0])} – ${formatDate(weekDays[6])}/${weekDays[6].getFullYear()}`

  // ─── Lookup ─────────────────────────────────────────────────────────────────
  const nvMap = useMemo(() => Object.fromEntries(MOCK_NHAN_VIEN.map(n => [n.MaNV, n])), [])

  // records theo ngày+ca
  const cellMap = useMemo(() => {
    const m = {}
    records.forEach(r => {
      const k = `${r.NgayLam}_${r.MaCa}`
      if (!m[k]) m[k] = []
      m[k].push(r)
    })
    return m
  }, [records])

  // ─── Handlers ───────────────────────────────────────────────────────────────
  function handleAdd() {
    if (!form.MaNV) return
    const nv = MOCK_NHAN_VIEN.find(n => n.MaNV === form.MaNV)
    // tránh trùng
    const dup = records.find(r => r.NgayLam === form.NgayLam && r.MaCa === form.MaCa && r.MaNV === form.MaNV)
    if (dup) { setShowModal(false); return }
    const ca = CA_LIST.find(c => c.id === form.MaCa)
    const newRec = {
      MaPC: genMaPC(),
      MaNV: form.MaNV,
      HoTen: nv.HoTen,
      NgayLam: form.NgayLam,
      MaCa: form.MaCa,
      GioBatDau: ca.time.split('–')[0],
      GioKetThuc: ca.time.split('–')[1],
      GhiChu: '',
    }
    setRecords(prev => [newRec, ...prev])
    setShowModal(false)
    setForm({ NgayLam: dateKey(new Date()), Ca: 'sang', MaNV: '' })
  }

  function handleRemove(MaPC) {
    setRecords(prev => prev.filter(r => r.MaPC !== MaPC))
  }

  // ─── KPI ─────────────────────────────────────────────────────────────────────
  const weekKeys = weekDays.map(dateKey)
  const weekRecords = records.filter(r => weekKeys.includes(r.NgayLam))
  const assignedNV = new Set(weekRecords.map(r => r.MaNV)).size
  const totalSlots = weekRecords.length

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays size={22} className="text-brand-400" />
            Phân công Ca làm việc
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Quản lý lịch ca theo tuần cho chi nhánh</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Thêm phân công
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng ca tuần này', value: totalSlots, sub: `${weekRecords.filter(r=>r.MaCa==='CA001').length} sáng · ${weekRecords.filter(r=>r.MaCa==='CA002').length} chiều · ${weekRecords.filter(r=>r.MaCa==='CA003').length} tối` },
          { label: 'Nhân viên được phân công', value: assignedNV, sub: `/${MOCK_NHAN_VIEN.length} nhân viên` },
          { label: 'Tuần xem', value: weekLabel, sub: 'Tuần đang chọn', isText: true },
        ].map(k => (
          <div key={k.label} className="bg-surface rounded-xl p-4 border border-white/5">
            <p className="text-gray-500 text-xs">{k.label}</p>
            <p className={clsx('font-bold mt-1', k.isText ? 'text-base text-brand-400' : 'text-2xl text-white')}>{k.value}</p>
            <p className="text-gray-600 text-xs mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab + Week nav */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-surface rounded-lg p-1 border border-white/5">
          {[['calendar','Lịch tuần'],['list','Danh sách']].map(([id,label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={clsx('px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === id ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white')}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'calendar' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="p-1.5 rounded-lg bg-surface border border-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-300 font-medium min-w-[140px] text-center">{weekLabel}</span>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="p-1.5 rounded-lg bg-surface border border-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Calendar view ────────────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div className="bg-surface rounded-xl border border-white/5 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="w-28 text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Ca</th>
                {weekDays.map((d, i) => {
                  const isToday = dateKey(d) === dateKey(new Date())
                  return (
                    <th key={i} className={clsx('text-center px-2 py-3 text-xs font-semibold uppercase tracking-wider', isToday ? 'text-brand-400' : 'text-gray-500')}>
                      <div>{DOW[i]}</div>
                      <div className={clsx('text-base font-bold mt-0.5', isToday ? 'text-brand-400' : 'text-white')}>{d.getDate()}</div>
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mx-auto mt-0.5" />}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {CA_LIST.map(ca => (
                <tr key={ca.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 align-top">
                    <div className={clsx('inline-block px-2 py-1 rounded-lg border text-[11px] font-semibold', ca.color)}>
                      {ca.label}
                    </div>
                    <div className="text-gray-600 text-[10px] mt-1">{ca.time}</div>
                  </td>
                  {weekDays.map((d, i) => {
                    const k = `${dateKey(d)}_${ca.id}`
                    const cell = cellMap[k] || []
                    return (
                      <td key={i} className="px-2 py-2 align-top min-h-[70px]">
                        <div className="space-y-1 min-h-[56px]">
                          {cell.map(r => (
                            <NVChip
                              key={r.MaPC}
                              nv={nvMap[r.MaNV] || { HoTen: r.HoTen, VaiTro: 'role_warehouse_staff' }}
                              canEdit={canEdit}
                              onRemove={() => handleRemove(r.MaPC)}
                            />
                          ))}
                          {canEdit && cell.length === 0 && (
                            <button
                              onClick={() => {
                                setForm({ NgayLam: dateKey(d), MaCa: ca.id, MaNV: '' })
                                setShowModal(true)
                              }}
                              className="w-full h-8 border border-dashed border-white/10 rounded-md text-gray-700 hover:border-brand-500/40 hover:text-brand-500 transition-colors flex items-center justify-center"
                            >
                              <Plus size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── List view ─────────────────────────────────────────────────────────── */}
      {tab === 'list' && (
        <div className="bg-surface rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <Users size={15} className="text-gray-500" />
            <span className="text-sm text-gray-400">Tất cả phân công ({records.length} bản ghi)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr>
                  {['Mã PC','Ngày','Ca','Nhân viên','Vai trò','Giờ làm','Ghi chú'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {records
                  .slice()
                  .sort((a,b) => b.NgayLam.localeCompare(a.NgayLam))
                  .map(r => {
                    const ca = CA_LIST.find(c => c.id === r.MaCa)
                    const nv = nvMap[r.MaNV] || {}
                    return (
                      <tr key={r.MaPC} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{r.MaPC}</td>
                        <td className="px-4 py-3 text-gray-300">{r.NgayLam}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', ca?.color)}>
                            {ca?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-medium">{r.HoTen}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium', ROLE_COLOR[nv.VaiTro])}>
                            {ROLE_LABEL[nv.VaiTro] || r.VaiTro}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{r.GioBatDau} – {r.GioKetThuc}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.GhiChu || '—'}</td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRemove(r.MaPC)}
                              className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
              </tbody>
            </table>
            {records.length === 0 && (
              <div className="text-center py-12 text-gray-600">Chưa có phân công nào</div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal thêm phân công ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-sidebar rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-bold text-base">Thêm phân công ca</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Ngày */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Ngày làm việc</label>
                <input
                  type="date"
                  value={form.NgayLam}
                  onChange={e => setForm(f => ({ ...f, NgayLam: e.target.value }))}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Ca */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Ca làm việc</label>
                <div className="grid grid-cols-3 gap-2">
                  {CA_LIST.map(ca => (
                    <button
                      key={ca.id}
                      onClick={() => setForm(f => ({ ...f, MaCa: ca.id }))}
                      className={clsx(
                        'px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-center',
                        form.MaCa === ca.id ? ca.color + ' border-current' : 'border-white/10 text-gray-500 hover:border-white/20'
                      )}
                    >
                      <div>{ca.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{ca.time}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhân viên */}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Nhân viên</label>
                <input
                  type="text"
                  placeholder="Tìm tên nhân viên..."
                  value={filterNV}
                  onChange={e => setFilterNV(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-600"
                />
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {MOCK_NHAN_VIEN.filter(n => n.HoTen.toLowerCase().includes(filterNV.toLowerCase())).map(nv => (
                    <button
                      key={nv.MaNV}
                      onClick={() => setForm(f => ({ ...f, MaNV: nv.MaNV }))}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors text-left',
                        form.MaNV === nv.MaNV
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-white/5 hover:bg-white/5'
                      )}
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                        <span className="text-brand-400 text-xs font-bold">{nv.HoTen.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{nv.HoTen}</p>
                        <p className="text-gray-500 text-xs">{ROLE_LABEL[nv.VaiTro]}</p>
                      </div>
                      {form.MaNV === nv.MaNV && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
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
                onClick={handleAdd}
                disabled={!form.MaNV}
                className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Thêm phân công
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
