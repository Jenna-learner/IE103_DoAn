import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserCog, Plus, RefreshCw, Search, Phone, Mail, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { fmtCurrency } from '../lib/format'
import useAuthStore from '../store/authStore'
import { ROLE, ROLE_LABEL, normalizeRole } from '../lib/roles'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'giam_doc_van_hanh', label: 'Giám đốc vận hành' },
  { value: 'quan_ly_chinhanh', label: 'Quản lý chi nhánh' },
  { value: 'thu_ngan', label: 'Thu ngân' },
  { value: 'kho', label: 'Kho vận' },
]

const EMPTY_FORM = {
  MaNV: '',
  HoTen: '',
  MaBP: '',
  MaCN: '',
  SDT: '',
  Email: '',
  ChucVu: '',
  LuongCoBan: '',
  TrangThai: 'Active',
  TenDangNhap: '',
  MatKhau: '',
  VaiTro: 'thu_ngan',
}

function normalizeEmployee(item) {
  return {
    MaNV: item.MaNV || item.manv,
    HoTen: item.HoTen || item.hoten,
    SDT: item.SDT || item.sdt || '',
    Email: item.Email || item.email || '',
    ChucVu: item.ChucVu || item.chucvu || '',
    LuongCoBan: Number(item.LuongCoBan ?? item.luongcoban ?? 0),
    TrangThai: item.TrangThai || item.trangthai || 'Active',
    TenBP: item.TenBP || item.tenbp || '',
    MaBP: item.MaBP || item.mabp || '',
    MaCN: item.MaCN || item.macn || '',
    TenCN: item.TenCN || item.tencn || '',
    TenDangNhap: item.TenDangNhap || item.tendangnhap || '',
    VaiTro: item.VaiTro || item.vaitro || 'thu_ngan',
    TaiKhoanActive: item.TaiKhoanActive ?? item.taikhoanactive ?? true,
  }
}

function normalizeBranch(item) {
  return {
    MaCN: item.MaCN || item.macn,
    TenCN: item.TenCN || item.tencn,
  }
}

function normalizeDepartment(item) {
  return {
    MaBP: item.MaBP || item.mabp,
    TenBP: item.TenBP || item.tenbp,
  }
}

export default function NhanVien() {
  const user = useAuthStore((s) => s.user)
  const role = normalizeRole(user?.vaiTro)
  const canCreateUser = role === ROLE.ADMIN
  const canEditEmployee = [ROLE.ADMIN, ROLE.BRANCH_MANAGER].includes(role)
  const canResetPassword = role === ROLE.ADMIN
  const [employees, setEmployees] = useState([])
  const [branches, setBranches] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [resetPassword, setResetPassword] = useState('')
  const [resettingId, setResettingId] = useState('')

  const loadData = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const [employeeRes, branchRes, departmentRes] = await Promise.all([
        api.get('/nhan-vien'),
        api.get('/chi-nhanh'),
        api.get('/chi-nhanh/bo-phan'),
      ])
      setEmployees((employeeRes.data || []).map(normalizeEmployee))
      setBranches((branchRes.data || []).map(normalizeBranch))
      setDepartments((departmentRes.data || []).map(normalizeDepartment))
      if (showToast) toast.success('Đã làm mới dữ liệu nhân viên')
    } catch (err) {
      toast.error(err.message || 'Không tải được nhân viên')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    let list = employees
    if (filterStatus) list = list.filter((item) => item.TrangThai === filterStatus)
    if (filterDepartment) list = list.filter((item) => item.MaBP === filterDepartment)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((item) =>
        item.MaNV?.toLowerCase().includes(q) ||
        item.HoTen?.toLowerCase().includes(q) ||
        item.SDT?.toLowerCase().includes(q)
      )
    }
    return list
  }, [employees, filterStatus, filterDepartment, search])

  const openCreate = () => {
    setEditingId('')
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (employee) => {
    setEditingId(employee.MaNV)
    setForm({
      ...EMPTY_FORM,
      ...employee,
      LuongCoBan: employee.LuongCoBan || '',
      MatKhau: '',
    })
    setShowForm(true)
  }

  const validate = () => {
    if (!form.MaNV && !editingId) return toast.error('Vui lòng nhập mã nhân viên'), false
    if (!form.HoTen) return toast.error('Vui lòng nhập họ tên'), false
    if (!form.MaBP) return toast.error('Vui lòng chọn bộ phận'), false
    if (!editingId && (!form.TenDangNhap || !form.MatKhau)) return toast.error('Vui lòng nhập tài khoản đăng nhập'), false
    return true
  }

  const handleSubmit = async () => {
    if (!editingId && !canCreateUser) {
      toast.error('Chỉ admin mới được tạo tài khoản người dùng')
      return
    }
    if (!validate()) return
    setSaving(true)
    try {
      if (editingId) {
        const res = await api.put(`/nhan-vien/${editingId}`, {
          HoTen: form.HoTen,
          MaBP: form.MaBP,
          SDT: form.SDT,
          Email: form.Email,
          ChucVu: form.ChucVu,
          LuongCoBan: Number(form.LuongCoBan) || 0,
          TrangThai: form.TrangThai,
        })
        toast.success(res.message || 'Đã cập nhật nhân viên')
        await loadData()
      } else {
        const res = await api.post('/nhan-vien', {
          MaNV: form.MaNV,
          HoTen: form.HoTen,
          MaBP: form.MaBP,
          SDT: form.SDT,
          Email: form.Email,
          ChucVu: form.ChucVu,
          LuongCoBan: Number(form.LuongCoBan) || 0,
          MaCN: form.MaCN,
          TenDangNhap: form.TenDangNhap,
          MatKhau: form.MatKhau,
          VaiTro: form.VaiTro,
        })
        toast.success(res.message || 'Đã thêm nhân viên')
        await loadData()
      }

      setShowForm(false)
      setEditingId('')
      setForm(EMPTY_FORM)
    } catch (err) {
      toast.error(err.message || 'Không lưu được nhân viên')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async (maNV) => {
    if (!resetPassword) {
      toast.error('Nhập mật khẩu mới trước khi reset')
      return
    }
    setResettingId(maNV)
    try {
      const res = await api.patch(`/nhan-vien/${maNV}/dat-lai-mat-khau`, { MatKhauMoi: resetPassword })
      toast.success(res.message || 'Đã đặt lại mật khẩu')
      setResetPassword('')
    } catch (err) {
      toast.error(err.message || 'Không đặt lại được mật khẩu')
    } finally {
      setResettingId('')
    }
  }

  const activeCount = employees.filter((item) => item.TrangThai === 'Active').length

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <div className="card"><p className="text-xs text-gray-400">Tổng nhân viên</p><p className="text-xl font-bold text-gray-900 mt-1">{employees.length}</p></div>
        <div className="card"><p className="text-xs text-gray-400">Đang hoạt động</p><p className="text-xl font-bold text-green-600 mt-1">{activeCount}</p></div>
        <div className="card"><p className="text-xs text-gray-400">Bộ phận</p><p className="text-xl font-bold text-brand-600 mt-1">{departments.length}</p></div>
      </div>

      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã, tên hoặc SĐT nhân viên..." className="input pl-8 text-sm" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input text-sm w-36">
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="input text-sm w-44">
          <option value="">Tất cả bộ phận</option>
          {departments.map((item) => <option key={item.MaBP} value={item.MaBP}>{item.TenBP}</option>)}
        </select>
        <button onClick={() => loadData(true)} className="btn-secondary text-sm px-3 py-2" disabled={loading}><RefreshCw size={14} className={clsx(loading && 'animate-spin')} /> Làm mới</button>
        {canCreateUser && (
          <button onClick={openCreate} className="btn-primary text-sm px-3 py-2"><Plus size={14} /> Thêm người dùng</button>
        )}
      </div>

      {showForm && (
        <div className="card shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-800">{editingId ? 'Cập nhật nhân viên' : 'Thêm nhân viên & tài khoản'}</h2>
              {!editingId && <p className="text-xs text-gray-400 mt-1">Admin có thể tạo tài khoản demo theo đúng role để kiểm thử phân quyền.</p>}
            </div>
            <button onClick={() => { setShowForm(false); setEditingId(''); setForm(EMPTY_FORM) }} className="text-xs text-gray-400 hover:text-gray-600">✕ Đóng</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mã NV</label><input value={form.MaNV} onChange={(e) => setForm((p) => ({ ...p, MaNV: e.target.value }))} className="input text-sm" disabled={!!editingId} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Họ tên</label><input value={form.HoTen} onChange={(e) => setForm((p) => ({ ...p, HoTen: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Bộ phận</label><select value={form.MaBP} onChange={(e) => setForm((p) => ({ ...p, MaBP: e.target.value }))} className="input text-sm"><option value="">-- Chọn bộ phận --</option>{departments.map((item) => <option key={item.MaBP} value={item.MaBP}>{item.TenBP}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Chi nhánh</label><select value={form.MaCN} onChange={(e) => setForm((p) => ({ ...p, MaCN: e.target.value }))} className="input text-sm" disabled={!!editingId || !canCreateUser}><option value="">-- Chọn chi nhánh --</option>{branches.map((item) => <option key={item.MaCN} value={item.MaCN}>{item.TenCN}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">SĐT</label><input value={form.SDT} onChange={(e) => setForm((p) => ({ ...p, SDT: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input value={form.Email} onChange={(e) => setForm((p) => ({ ...p, Email: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Chức vụ</label><input value={form.ChucVu} onChange={(e) => setForm((p) => ({ ...p, ChucVu: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Lương cơ bản</label><input type="number" value={form.LuongCoBan} onChange={(e) => setForm((p) => ({ ...p, LuongCoBan: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label><select value={form.TrangThai} onChange={(e) => setForm((p) => ({ ...p, TrangThai: e.target.value }))} className="input text-sm"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
            {!editingId && canCreateUser && (
              <>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tên đăng nhập</label><input value={form.TenDangNhap} onChange={(e) => setForm((p) => ({ ...p, TenDangNhap: e.target.value }))} className="input text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu</label><input type="password" value={form.MatKhau} onChange={(e) => setForm((p) => ({ ...p, MatKhau: e.target.value }))} className="input text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Vai trò hệ thống</label><select value={form.VaiTro} onChange={(e) => setForm((p) => ({ ...p, VaiTro: e.target.value }))} className="input text-sm">{ROLE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => { setShowForm(false); setEditingId(''); setForm(EMPTY_FORM) }} className="btn-secondary text-sm px-4 py-2">Huỷ</button>
            <button onClick={handleSubmit} className="btn-primary text-sm px-4 py-2" disabled={saving}>{saving ? <><RefreshCw size={14} className="animate-spin" /> Đang lưu...</> : editingId ? 'Lưu thay đổi' : 'Tạo người dùng'}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 flex-1 overflow-hidden">
        <div className="card flex flex-col overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            <div className="col-span-2">Mã NV</div>
            <div className="col-span-3">Nhân viên</div>
            <div className="col-span-2">Bộ phận</div>
            <div className="col-span-2">Chi nhánh</div>
            <div className="col-span-2">Liên hệ</div>
            <div className="col-span-1 text-right">Sửa</div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2"><RefreshCw size={16} className="animate-spin" /> Đang tải nhân viên...</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400"><UserCog size={36} className="mb-2 opacity-30" /><p className="text-sm">Không có nhân viên nào</p></div>
            ) : filtered.map((item) => (
              <div key={item.MaNV} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-gray-50">
                <div className="col-span-2 font-mono text-xs font-semibold text-gray-700">{item.MaNV}</div>
                <div className="col-span-3 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.HoTen}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.ChucVu || ROLE_LABEL[normalizeRole(item.VaiTro)] || item.VaiTro}</p>
                  <span className={clsx('inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', item.TrangThai === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>{item.TrangThai}</span>
                </div>
                <div className="col-span-2 text-xs text-gray-600">{item.TenBP || '—'}</div>
                <div className="col-span-2 text-xs text-gray-600">{item.TenCN || '—'}</div>
                <div className="col-span-2 text-xs text-gray-600 space-y-1">
                  <p className="flex items-center gap-1"><Phone size={12} /> {item.SDT || '—'}</p>
                  <p className="flex items-center gap-1 truncate"><Mail size={12} /> {item.Email || '—'}</p>
                </div>
                <div className="col-span-1 flex justify-end">{canEditEmployee && <button onClick={() => openEdit(item)} className="text-xs font-semibold text-brand-600 hover:underline">Sửa</button>}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto">
          {canResetPassword && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3"><KeyRound size={16} className="text-brand-500" /><h3 className="font-semibold text-gray-800">Đặt lại mật khẩu</h3></div>
            <input value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} type="password" placeholder="Nhập mật khẩu mới..." className="input text-sm mb-3" />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {employees.map((item) => (
                <div key={item.MaNV} className="rounded-lg border border-gray-100 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.HoTen}</p>
                    <p className="text-[11px] text-gray-400">{item.MaNV} · {item.TenDangNhap || 'Chưa có tài khoản'}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Lương cơ bản: {fmtCurrency(item.LuongCoBan)}</p>
                  </div>
                  <button onClick={() => handleResetPassword(item.MaNV)} className="text-xs font-semibold text-brand-600 hover:underline" disabled={resettingId === item.MaNV}>
                    {resettingId === item.MaNV ? 'Đang reset...' : 'Reset'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
