import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Download, Filter, Plus, RefreshCw, Users, X,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

import api from '../lib/api'
import { exportExcel } from '../lib/exportExcel'
import useAuthStore from '../store/authStore'
import { ROLE, ROLE_LABEL, normalizeRole } from '../lib/roles'

const DOW = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
const STATUS_LABEL = {
  Assigned: 'Đã phân công',
  Done: 'Hoàn tất',
  Absent: 'Vắng mặt',
  Cancelled: 'Đã huỷ',
}
const STATUS_CLASS = {
  Assigned: 'bg-amber-50 text-amber-700 border-amber-200',
  Done: 'bg-green-50 text-green-700 border-green-200',
  Absent: 'bg-red-50 text-red-700 border-red-200',
  Cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
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
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function fmtDate(date) {
  return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function fmtTime(value) {
  return String(value || '').slice(0, 5)
}

function normalizeShift(item = {}) {
  return {
    id: item.MaCa || item.maca,
    label: item.TenCa || item.tenca,
    time: `${fmtTime(item.GioBatDau || item.giobatdau)} – ${fmtTime(item.GioKetThuc || item.gioketthuc)}`,
  }
}

function normalizeBranch(item = {}) {
  return {
    MaCN: item.MaCN || item.macn,
    TenCN: item.TenCN || item.tencn,
  }
}

function normalizeEmployee(item = {}) {
  return {
    MaNV: item.MaNV || item.manv,
    HoTen: item.HoTen || item.hoten,
    MaCN: item.MaCN || item.macn || '',
    TenCN: item.TenCN || item.tencn || '',
    VaiTro: normalizeRole(item.VaiTro || item.vaitro),
  }
}

function normalizeAssignment(item = {}) {
  return {
    MaPC: String(item.MaPC || item.mapc),
    MaNV: item.MaNV || item.manv,
    HoTen: item.HoTen || item.hoten,
    MaCN: item.MaCN || item.macn,
    TenCN: item.TenCN || item.tencn || '',
    NgayLam: String(item.NgayLam || item.ngaylam || item.Ngay || item.ngay).slice(0, 10),
    MaCa: item.MaCa || item.maca || item.MaCL || item.macl,
    TenCa: item.TenCa || item.tenca || '',
    GioBatDau: fmtTime(item.GioBatDau || item.giobatdau),
    GioKetThuc: fmtTime(item.GioKetThuc || item.gioketthuc),
    TrangThai: item.TrangThai || item.trangthai || 'Assigned',
  }
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </div>
  )
}

export default function PhanCong() {
  const user = useAuthStore((s) => s.user)
  const role = normalizeRole(user?.vaiTro)

  const canEdit = [ROLE.ADMIN, ROLE.BRANCH_MANAGER].includes(role)
  const canPickBranch = [ROLE.ADMIN, ROLE.OPS_DIRECTOR].includes(role)

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [branches, setBranches] = useState([])
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({ MaCN: user?.maCN || '', NgayLam: dateKey(new Date()), MaCa: '', MaNV: '' })

  const selectedBranch = branchFilter === 'ALL' ? '' : branchFilter
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekLabel = `${fmtDate(weekDays[0])} – ${fmtDate(weekDays[6])}/${weekDays[6].getFullYear()}`

  const loadBranches = useCallback(async () => {
    if (!canPickBranch) return
    try {
      const res = await api.get('/chi-nhanh')
      setBranches((res.data || []).map(normalizeBranch))
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách chi nhánh')
    }
  }, [canPickBranch])

  const loadShifts = useCallback(async () => {
    try {
      const res = await api.get('/phan-cong/ca-lam')
      const items = (res.data || []).map(normalizeShift)
      setShifts(items)
      setForm((prev) => ({ ...prev, MaCa: prev.MaCa || items[0]?.id || '' }))
    } catch (err) {
      toast.error(err.message || 'Không tải được ca làm')
    }
  }, [])

  const loadEmployees = useCallback(async () => {
    try {
      const params = { trangThai: 'Active' }
      const targetBranch = canPickBranch ? selectedBranch : user?.maCN
      if (targetBranch) params.maCN = targetBranch

      const res = await api.get('/nhan-vien', { params })
      setEmployees((res.data || []).map(normalizeEmployee))
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách nhân viên')
    }
  }, [canPickBranch, selectedBranch, user?.maCN])

  const loadAssignments = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const params = { tuan: dateKey(weekStart) }
      const targetBranch = canPickBranch ? selectedBranch : user?.maCN
      if (targetBranch) params.maCN = targetBranch
      if (statusFilter) params.trangThai = statusFilter

      const res = await api.get('/phan-cong', { params })
      setRecords((res.data || []).map(normalizeAssignment))
      if (showToast) toast.success('Đã làm mới lịch phân công')
    } catch (err) {
      toast.error(err.message || 'Không tải được lịch phân công')
    } finally {
      setLoading(false)
    }
  }, [canPickBranch, selectedBranch, statusFilter, user?.maCN, weekStart])

  useEffect(() => {
    loadBranches()
    loadShifts()
  }, [loadBranches, loadShifts])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const tableRecords = useMemo(() => (
    records.filter((item) => {
      if (!employeeFilter.trim()) return true
      const q = employeeFilter.trim().toLowerCase()
      return item.HoTen.toLowerCase().includes(q) || item.MaNV.toLowerCase().includes(q)
    })
  ), [employeeFilter, records])

  const weekKeys = weekDays.map(dateKey)
  const weekRecords = tableRecords.filter((item) => weekKeys.includes(item.NgayLam))

  const cellMap = useMemo(() => {
    const map = {}
    weekRecords.forEach((item) => {
      const key = `${item.NgayLam}_${item.MaCa}`
      if (!map[key]) map[key] = []
      map[key].push(item)
    })
    return map
  }, [weekRecords])

  const assignedEmployees = new Set(weekRecords.map((item) => item.MaNV)).size
  const selectedBranchLabel = selectedBranch
    ? branches.find((item) => item.MaCN === selectedBranch)?.TenCN || 'Chi nhánh'
    : user?.tenCN || 'Toàn hệ thống'

  const openCreateModal = (day = dateKey(new Date()), shiftId = shifts[0]?.id || '') => {
    setForm({
      MaCN: canPickBranch ? selectedBranch : user?.maCN || '',
      NgayLam: day,
      MaCa: shiftId,
      MaNV: '',
    })
    setEmployeeFilter('')
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (!form.MaNV || !form.MaCa || !form.NgayLam || !(form.MaCN || user?.maCN)) return
    setSaving(true)
    try {
      const res = await api.post('/phan-cong', {
        ...form,
        MaCN: form.MaCN || user?.maCN,
      })
      toast.success(res.message || 'Đã thêm phân công')
      setShowModal(false)
      await loadAssignments()
    } catch (err) {
      toast.error(err.message || 'Không thêm được phân công')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (maPC) => {
    try {
      const res = await api.delete(`/phan-cong/${maPC}`)
      toast.success(res.message || 'Đã xoá phân công')
      await loadAssignments()
    } catch (err) {
      toast.error(err.message || 'Không xoá được phân công')
    }
  }

  const exportRows = tableRecords.map((item) => ({
    ...item,
    VaiTro: ROLE_LABEL[employees.find((employee) => employee.MaNV === item.MaNV)?.VaiTro] || '',
    KhungGio: `${item.GioBatDau} - ${item.GioKetThuc}`,
    TrangThaiHienThi: STATUS_LABEL[item.TrangThai] || item.TrangThai,
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phân công ca làm việc</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi lịch tuần theo chi nhánh, ca làm và nhân sự phụ trách.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadAssignments(true)}
            className="btn-secondary px-3 py-2 text-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={clsx(loading && 'animate-spin')} />
            Làm mới
          </button>
          <button
            onClick={() => exportExcel('phan-cong-ca', 'Phân công', [
              { label: 'Ngày', value: 'NgayLam' },
              { label: 'Chi nhánh', value: 'TenCN' },
              { label: 'Ca', value: 'TenCa' },
              { label: 'Khung giờ', value: 'KhungGio' },
              { label: 'Mã nhân viên', value: 'MaNV' },
              { label: 'Nhân viên', value: 'HoTen' },
              { label: 'Vai trò', value: 'VaiTro' },
              { label: 'Trạng thái', value: 'TrangThaiHienThi' },
            ], exportRows)}
            className="btn-secondary px-3 py-2 text-sm"
            disabled={exportRows.length === 0}
          >
            <Download size={14} />
            Xuất báo cáo
          </button>
          {canEdit && (
            <button onClick={() => openCreateModal()} className="btn-primary px-3 py-2 text-sm">
              <Plus size={14} />
              Thêm phân công
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard label="Tuần đang xem" value={weekLabel} hint={selectedBranchLabel} />
        <SummaryCard label="Nhân viên đã xếp ca" value={assignedEmployees} hint={`${employees.length} nhân viên sẵn sàng`} />
        <SummaryCard label="Tổng phân công" value={weekRecords.length} hint="Tính trên bộ lọc hiện tại" />
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setWeekStart((prev) => addDays(prev, -7))}
              className="btn-secondary h-10 w-10 px-0"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
              <CalendarDays size={15} className="text-gray-400" />
              <span className="font-medium">{weekLabel}</span>
            </div>
            <button
              onClick={() => setWeekStart((prev) => addDays(prev, 7))}
              className="btn-secondary h-10 w-10 px-0"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canPickBranch && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="input min-w-52 text-sm"
              >
                <option value="ALL">Toàn hệ thống</option>
                {branches.map((branch) => (
                  <option key={branch.MaCN} value={branch.MaCN}>{branch.TenCN}</option>
                ))}
              </select>
            )}

            <div className="relative min-w-60 flex-1">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                placeholder="Tìm theo mã hoặc tên nhân viên..."
                className="input pl-9 text-sm"
              />
            </div>

            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input min-w-44 pl-9 text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-[980px] w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-100">
                <th className="w-44 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ca làm</th>
                {weekDays.map((day, index) => {
                  const key = dateKey(day)
                  const isToday = key === dateKey(new Date())
                  return (
                    <th key={key} className="px-3 py-3 text-left">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{DOW[index]}</p>
                      <p className={clsx('mt-1 text-sm font-bold', isToday ? 'text-brand-600' : 'text-gray-800')}>
                        {fmtDate(day)}
                      </p>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-4 align-top">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm font-semibold text-gray-800">{shift.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{shift.time}</p>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const key = `${dateKey(day)}_${shift.id}`
                    const items = cellMap[key] || []
                    return (
                      <td key={key} className="px-3 py-3 align-top">
                        <div className="min-h-28 space-y-2">
                          {items.map((item) => (
                            <div key={item.MaPC} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{item.HoTen}</p>
                                  <p className="mt-1 text-[11px] text-gray-500">{item.MaNV}</p>
                                  {canPickBranch && <p className="mt-1 text-[11px] text-gray-400">{item.TenCN}</p>}
                                </div>
                                <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-semibold', STATUS_CLASS[item.TrangThai] || STATUS_CLASS.Assigned)}>
                                  {STATUS_LABEL[item.TrangThai] || item.TrangThai}
                                </span>
                              </div>
                              {canEdit && (
                                <button
                                  onClick={() => handleRemove(item.MaPC)}
                                  className="mt-3 text-xs font-medium text-red-500 hover:text-red-600"
                                >
                                  Xoá phân công
                                </button>
                              )}
                            </div>
                          ))}
                          {canEdit && items.length === 0 && (
                            <button
                              onClick={() => openCreateModal(dateKey(day), shift.id)}
                              className="flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-600"
                            >
                              <Plus size={14} className="mr-1" />
                              Thêm ca
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
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Danh sách phân công</h2>
            <p className="mt-1 text-xs text-gray-400">Bảng chi tiết theo bộ lọc hiện tại</p>
          </div>
          <span className="text-xs font-medium text-gray-500">{tableRecords.length} bản ghi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-100">
                {['Ngày', 'Ca', 'Khung giờ', 'Nhân viên', ...(canPickBranch ? ['Chi nhánh'] : []), 'Trạng thái'].map((label) => (
                  <th key={label} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>
                ))}
                {canEdit && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canPickBranch ? 7 : 6} className="px-5 py-10 text-center text-sm text-gray-400">
                    <RefreshCw size={16} className="mr-2 inline animate-spin" />
                    Đang tải dữ liệu phân công...
                  </td>
                </tr>
              ) : tableRecords.length === 0 ? (
                <tr>
                  <td colSpan={canPickBranch ? 7 : 6} className="px-5 py-10 text-center text-sm text-gray-400">
                    Chưa có phân công nào khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                tableRecords
                  .slice()
                  .sort((a, b) => `${a.NgayLam}${a.GioBatDau}`.localeCompare(`${b.NgayLam}${b.GioBatDau}`))
                  .map((item) => (
                    <tr key={item.MaPC} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80">
                      <td className="px-5 py-4 text-gray-700">{item.NgayLam}</td>
                      <td className="px-5 py-4 font-medium text-gray-800">{item.TenCa || item.MaCa}</td>
                      <td className="px-5 py-4 text-gray-500">{item.GioBatDau} – {item.GioKetThuc}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{item.HoTen}</p>
                        <p className="text-xs text-gray-400">{item.MaNV}</p>
                      </td>
                      {canPickBranch && <td className="px-5 py-4 text-gray-600">{item.TenCN}</td>}
                      <td className="px-5 py-4">
                        <span className={clsx('rounded-full border px-2.5 py-1 text-xs font-semibold', STATUS_CLASS[item.TrangThai] || STATUS_CLASS.Assigned)}>
                          {STATUS_LABEL[item.TrangThai] || item.TrangThai}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => handleRemove(item.MaPC)} className="text-sm font-medium text-red-500 hover:text-red-600">
                            Xoá
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Tạo phân công mới</h3>
                <p className="mt-1 text-xs text-gray-400">Chọn ngày, ca và nhân viên phù hợp.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              {canPickBranch && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Chi nhánh</label>
                  <select
                    value={form.MaCN}
                    onChange={(e) => setForm((prev) => ({ ...prev, MaCN: e.target.value, MaNV: '' }))}
                    className="input text-sm"
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches.map((branch) => (
                      <option key={branch.MaCN} value={branch.MaCN}>{branch.TenCN}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Ngày làm việc</label>
                <input
                  type="date"
                  value={form.NgayLam}
                  onChange={(e) => setForm((prev) => ({ ...prev, NgayLam: e.target.value }))}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Ca làm việc</label>
                <select
                  value={form.MaCa}
                  onChange={(e) => setForm((prev) => ({ ...prev, MaCa: e.target.value }))}
                  className="input text-sm"
                >
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>{shift.label} · {shift.time}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Nhân viên</label>
                <select
                  value={form.MaNV}
                  onChange={(e) => setForm((prev) => ({ ...prev, MaNV: e.target.value }))}
                  className="input text-sm"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees
                    .filter((item) => !form.MaCN || item.MaCN === form.MaCN)
                    .map((employee) => (
                      <option key={employee.MaNV} value={employee.MaNV}>
                        {employee.HoTen} · {employee.MaNV}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Huỷ</button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.MaCN || !form.MaNV || !form.MaCa || !form.NgayLam}
                className="btn-primary flex-1"
              >
                {saving ? 'Đang lưu...' : 'Lưu phân công'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
