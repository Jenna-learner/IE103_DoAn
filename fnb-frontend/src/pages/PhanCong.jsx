import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { ROLE, normalizeRole } from '../lib/roles'

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const ROLE_LABEL = {
  [ROLE.ADMIN]: 'Admin',
  [ROLE.BRANCH_MANAGER]: 'Quản lý chi nhánh',
  [ROLE.CASHIER]: 'Thu ngân',
  [ROLE.WAREHOUSE]: 'Kho vận',
}

const ROLE_COLOR = {
  [ROLE.ADMIN]: 'bg-purple-500/20 text-purple-300',
  [ROLE.BRANCH_MANAGER]: 'bg-blue-500/20 text-blue-300',
  [ROLE.CASHIER]: 'bg-amber-500/20 text-amber-300',
  [ROLE.WAREHOUSE]: 'bg-green-500/20 text-green-300',
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
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
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

function shiftColor(maCa, index = 0) {
  if (maCa === 'CA001') return 'bg-amber-500/10 border-amber-500/30 text-amber-300'
  if (maCa === 'CA002') return 'bg-blue-500/10 border-blue-500/30 text-blue-300'
  if (maCa === 'CA003') return 'bg-purple-500/10 border-purple-500/30 text-purple-300'
  return [
    'bg-amber-500/10 border-amber-500/30 text-amber-300',
    'bg-blue-500/10 border-blue-500/30 text-blue-300',
    'bg-purple-500/10 border-purple-500/30 text-purple-300',
  ][index % 3]
}

function normalizeShift(item, index = 0) {
  return {
    id: item.MaCa || item.maca,
    label: item.TenCa || item.tenca,
    time: `${formatTime(item.GioBatDau || item.giobatdau)}–${formatTime(item.GioKetThuc || item.gioketthuc)}`,
    color: shiftColor(item.MaCa || item.maca, index),
  }
}

function normalizeEmployee(item) {
  return {
    MaNV: item.MaNV || item.manv,
    HoTen: item.HoTen || item.hoten,
    VaiTro: normalizeRole(item.VaiTro || item.vaitro),
  }
}

function normalizeAssignment(item) {
  return {
    MaPC: String(item.MaPC || item.mapc),
    MaNV: item.MaNV || item.manv,
    HoTen: item.HoTen || item.hoten,
    NgayLam: String(item.NgayLam || item.ngaylam).slice(0, 10),
    MaCa: item.MaCa || item.maca,
    GioBatDau: formatTime(item.GioBatDau || item.giobatdau),
    GioKetThuc: formatTime(item.GioKetThuc || item.gioketthuc),
    TrangThai: item.TrangThai || item.trangthai || 'Scheduled',
  }
}

function NVChip({ nv, onRemove, canEdit }) {
  return (
    <div className="flex items-center gap-1.5 bg-surface rounded-md px-2 py-1 text-xs group">
      <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
        <span className="text-brand-400 text-[9px] font-bold">{nv.HoTen.charAt(0)}</span>
      </div>
      <span className="text-gray-200 truncate max-w-[80px]">{nv.HoTen}</span>
      <span className={clsx('text-[9px] px-1 py-0.5 rounded font-medium shrink-0', ROLE_COLOR[nv.VaiTro] || 'bg-white/10 text-gray-300')}>
        {ROLE_LABEL[nv.VaiTro] || nv.VaiTro || 'Nhân viên'}
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

export default function PhanCong() {
  const user = useAuthStore((s) => s.user)
  const role = normalizeRole(user?.vaiTro)
  const canEdit = [ROLE.ADMIN, ROLE.BRANCH_MANAGER].includes(role)

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('calendar')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ NgayLam: dateKey(new Date()), MaCa: '', MaNV: '' })
  const [filterNV, setFilterNV] = useState('')

  const loadMeta = useCallback(async () => {
    try {
      const [shiftRes, employeeRes] = await Promise.all([
        api.get('/phan-cong/ca-lam'),
        api.get('/nhan-vien', { params: { trangThai: 'Active' } }),
      ])
      const normalizedShifts = (shiftRes.data || []).map((item, index) => normalizeShift(item, index))
      setShifts(normalizedShifts)
      setEmployees((employeeRes.data || []).map(normalizeEmployee))
      setForm((prev) => ({ ...prev, MaCa: prev.MaCa || normalizedShifts[0]?.id || '' }))
    } catch (err) {
      toast.error(err.message || 'Không tải được dữ liệu phân công')
    }
  }, [])

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/phan-cong', { params: { tuan: dateKey(weekStart) } })
      setRecords((res.data || []).map(normalizeAssignment))
    } catch (err) {
      toast.error(err.message || 'Không tải được lịch phân công')
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const weekLabel = `${formatDate(weekDays[0])} – ${formatDate(weekDays[6])}/${weekDays[6].getFullYear()}`
  const nvMap = useMemo(() => Object.fromEntries(employees.map((n) => [n.MaNV, n])), [employees])

  const cellMap = useMemo(() => {
    const map = {}
    records.forEach((record) => {
      const key = `${record.NgayLam}_${record.MaCa}`
      if (!map[key]) map[key] = []
      map[key].push(record)
    })
    return map
  }, [records])

  const filteredEmployees = useMemo(() => {
    const q = filterNV.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((nv) => nv.HoTen.toLowerCase().includes(q) || nv.MaNV.toLowerCase().includes(q))
  }, [employees, filterNV])

  const weekKeys = weekDays.map(dateKey)
  const weekRecords = records.filter((r) => weekKeys.includes(r.NgayLam))
  const assignedNV = new Set(weekRecords.map((r) => r.MaNV)).size
  const totalSlots = weekRecords.length

  const handleAdd = async () => {
    if (!form.MaNV || !form.MaCa || !form.NgayLam) return
    setSubmitting(true)
    try {
      const res = await api.post('/phan-cong', form)
      toast.success(res.message || 'Thêm phân công thành công')
      setShowModal(false)
      setFilterNV('')
      setForm({ NgayLam: dateKey(new Date()), MaCa: shifts[0]?.id || '', MaNV: '' })
      await loadAssignments()
    } catch (err) {
      toast.error(err.message || 'Không thêm được phân công')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (MaPC) => {
    try {
      const res = await api.delete(`/phan-cong/${MaPC}`)
      toast.success(res.message || 'Đã xoá phân công')
      await loadAssignments()
    } catch (err) {
      toast.error(err.message || 'Không xoá được phân công')
    }
  }

  return (
    <div className="p-6 space-y-5">
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

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng ca tuần này', value: totalSlots, sub: `${weekRecords.filter((r) => r.MaCa === shifts[0]?.id).length} ca 1 · ${weekRecords.filter((r) => r.MaCa === shifts[1]?.id).length} ca 2 · ${weekRecords.filter((r) => r.MaCa === shifts[2]?.id).length} ca 3` },
          { label: 'Nhân viên được phân công', value: assignedNV, sub: `/${employees.length} nhân viên` },
          { label: 'Tuần xem', value: weekLabel, sub: 'Tuần đang chọn', isText: true },
        ].map((k) => (
          <div key={k.label} className="bg-surface rounded-xl p-4 border border-white/5">
            <p className="text-gray-500 text-xs">{k.label}</p>
            <p className={clsx('font-bold mt-1', k.isText ? 'text-base text-brand-400' : 'text-2xl text-white')}>{k.value}</p>
            <p className="text-gray-600 text-xs mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-surface rounded-lg p-1 border border-white/5">
          {[['calendar', 'Lịch tuần'], ['list', 'Danh sách']].map(([id, label]) => (
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
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              className="p-1.5 rounded-lg bg-surface border border-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-300 font-medium min-w-[140px] text-center">{weekLabel}</span>
            <button
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              className="p-1.5 rounded-lg bg-surface border border-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

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
              {shifts.map((ca) => (
                <tr key={ca.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 align-top">
                    <div className={clsx('inline-block px-2 py-1 rounded-lg border text-[11px] font-semibold', ca.color)}>
                      {ca.label}
                    </div>
                    <div className="text-gray-600 text-[10px] mt-1">{ca.time}</div>
                  </td>
                  {weekDays.map((d, i) => {
                    const key = `${dateKey(d)}_${ca.id}`
                    const cell = cellMap[key] || []
                    return (
                      <td key={i} className="px-2 py-2 align-top min-h-[70px]">
                        <div className="space-y-1 min-h-[56px]">
                          {cell.map((r) => (
                            <NVChip
                              key={r.MaPC}
                              nv={nvMap[r.MaNV] || { HoTen: r.HoTen, VaiTro: ROLE.CASHIER }}
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
          {loading && <div className="p-4 text-center text-gray-500 text-sm">Đang tải lịch phân công...</div>}
        </div>
      )}

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
                  {['Mã PC', 'Ngày', 'Ca', 'Nhân viên', 'Vai trò', 'Giờ làm', 'Trạng thái'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {records
                  .slice()
                  .sort((a, b) => b.NgayLam.localeCompare(a.NgayLam))
                  .map((r) => {
                    const ca = shifts.find((c) => c.id === r.MaCa)
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
                          <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium', ROLE_COLOR[nv.VaiTro] || 'bg-white/10 text-gray-300')}>
                            {ROLE_LABEL[nv.VaiTro] || 'Nhân viên'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{r.GioBatDau} – {r.GioKetThuc}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.TrangThai}</td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <button onClick={() => handleRemove(r.MaPC)} className="text-gray-600 hover:text-red-400 transition-colors">
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
              </tbody>
            </table>
            {!loading && records.length === 0 && (
              <div className="text-center py-12 text-gray-600">Chưa có phân công nào</div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-sidebar rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-bold text-base">Thêm phân công ca</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Ngày làm việc</label>
                <input
                  type="date"
                  value={form.NgayLam}
                  onChange={(e) => setForm((f) => ({ ...f, NgayLam: e.target.value }))}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Ca làm việc</label>
                <div className="grid grid-cols-3 gap-2">
                  {shifts.map((ca) => (
                    <button
                      key={ca.id}
                      onClick={() => setForm((f) => ({ ...f, MaCa: ca.id }))}
                      className={clsx(
                        'px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-center',
                        form.MaCa === ca.id ? `${ca.color} border-current` : 'border-white/10 text-gray-500 hover:border-white/20'
                      )}
                    >
                      <div>{ca.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{ca.time}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Nhân viên</label>
                <input
                  type="text"
                  placeholder="Tìm tên nhân viên..."
                  value={filterNV}
                  onChange={(e) => setFilterNV(e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-600"
                />
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {filteredEmployees.map((nv) => (
                    <button
                      key={nv.MaNV}
                      onClick={() => setForm((f) => ({ ...f, MaNV: nv.MaNV }))}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors text-left',
                        form.MaNV === nv.MaNV ? 'border-brand-500 bg-brand-500/10' : 'border-white/5 hover:bg-white/5'
                      )}
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                        <span className="text-brand-400 text-xs font-bold">{nv.HoTen.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{nv.HoTen}</p>
                        <p className="text-gray-500 text-xs">{ROLE_LABEL[nv.VaiTro] || 'Nhân viên'}</p>
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
                disabled={!form.MaNV || !form.MaCa || submitting}
                className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Đang lưu...' : 'Thêm phân công'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
