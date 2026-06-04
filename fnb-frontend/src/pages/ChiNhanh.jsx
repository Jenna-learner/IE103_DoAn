import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, Plus, RefreshCw, Search, MapPin, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Hoạt động' },
  { value: 'Inactive', label: 'Ngưng hoạt động' },
]

const EMPTY_BRANCH = {
  MaCN: '',
  TenCN: '',
  DiaChi: '',
  SDT: '',
  Email: '',
  TrangThai: 'Active',
}

function normalizeBranch(item) {
  return {
    MaCN: item.MaCN || item.macn,
    TenCN: item.TenCN || item.tencn,
    DiaChi: item.DiaChi || item.diachi || '',
    SDT: item.SDT || item.sdt || '',
    Email: item.Email || item.email || '',
    TrangThai: item.TrangThai || item.trangthai || 'Active',
  }
}

function normalizeDepartment(item) {
  return {
    MaBP: item.MaBP || item.mabp,
    TenBP: item.TenBP || item.tenbp,
    MoTa: item.MoTa || item.mota || '',
  }
}

export default function ChiNhanh() {
  const [branches, setBranches] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [branchForm, setBranchForm] = useState(EMPTY_BRANCH)

  const loadData = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const [branchRes, departmentRes] = await Promise.all([
        api.get('/chi-nhanh'),
        api.get('/chi-nhanh/bo-phan'),
      ])
      setBranches((branchRes.data || []).map(normalizeBranch))
      setDepartments((departmentRes.data || []).map(normalizeDepartment))
      if (showToast) toast.success('Đã làm mới dữ liệu chi nhánh')
    } catch (err) {
      toast.error(err.message || 'Không tải được dữ liệu chi nhánh')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return branches
    return branches.filter((item) =>
      item.MaCN?.toLowerCase().includes(q) ||
      item.TenCN?.toLowerCase().includes(q) ||
      item.DiaChi?.toLowerCase().includes(q)
    )
  }, [branches, search])

  const openCreate = () => {
    setEditingId('')
    setBranchForm(EMPTY_BRANCH)
    setShowBranchForm(true)
  }

  const openEdit = (branch) => {
    setEditingId(branch.MaCN)
    setBranchForm(branch)
    setShowBranchForm(true)
  }

  const handleBranchSubmit = async () => {
    if (!branchForm.MaCN && !editingId) return toast.error('Vui lòng nhập mã chi nhánh')
    if (!branchForm.TenCN) return toast.error('Vui lòng nhập tên chi nhánh')
    if (editingId) {
      const current = branches.find((item) => item.MaCN === editingId)
      if (current?.TrangThai === 'Active' && branchForm.TrangThai === 'Inactive') {
        const ok = window.confirm('Ngưng hoạt động chi nhánh có thể ảnh hưởng tới nhân sự, phân công ca, phiếu nhập và phiếu chi đang chờ xử lý. Bạn có chắc muốn tiếp tục?')
        if (!ok) return
      }
    }

    setSaving(true)
    try {
      if (editingId) {
        const res = await api.put(`/chi-nhanh/${editingId}`, branchForm)
        toast.success(res.message || 'Đã cập nhật chi nhánh')
        await loadData()
      } else {
        const res = await api.post('/chi-nhanh', branchForm)
        toast.success(res.message || 'Đã thêm chi nhánh')
        await loadData()
      }

      setShowBranchForm(false)
      setEditingId('')
      setBranchForm(EMPTY_BRANCH)
    } catch (err) {
      toast.error(err.message || 'Không lưu được chi nhánh')
    } finally {
      setSaving(false)
    }
  }

  const activeBranches = branches.filter((item) => item.TrangThai === 'Active').length
  const getStatusLabel = (status) => STATUS_OPTIONS.find((item) => item.value === status)?.label || status

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <div className="card">
          <p className="text-xs text-gray-400">Tổng chi nhánh</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{branches.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">Chi nhánh hoạt động</p>
          <p className="text-xl font-bold text-green-600 mt-1">{activeBranches}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">Tổng bộ phận</p>
          <p className="text-xl font-bold text-brand-600 mt-1">{departments.length}</p>
        </div>
      </div>

      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm chi nhánh theo mã, tên, địa chỉ..." className="input pl-8 text-sm" />
        </div>
        <button onClick={() => loadData(true)} className="btn-secondary text-sm px-3 py-2" disabled={loading}>
          <RefreshCw size={14} className={clsx(loading && 'animate-spin')} /> Làm mới
        </button>
        <button onClick={openCreate} className="btn-primary text-sm px-3 py-2">
          <Plus size={14} /> Thêm chi nhánh
        </button>
      </div>

      {showBranchForm && (
        <div className="card shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">{editingId ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh mới'}</h2>
            <button onClick={() => { setShowBranchForm(false); setBranchForm(EMPTY_BRANCH); setEditingId('') }} className="text-xs text-gray-400 hover:text-gray-600">✕ Đóng</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mã chi nhánh</label>
              <input value={branchForm.MaCN} onChange={(e) => setBranchForm((prev) => ({ ...prev, MaCN: e.target.value }))} className="input text-sm" disabled={!!editingId} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tên chi nhánh</label>
              <input value={branchForm.TenCN} onChange={(e) => setBranchForm((prev) => ({ ...prev, TenCN: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
              <select value={branchForm.TrangThai} onChange={(e) => setBranchForm((prev) => ({ ...prev, TrangThai: e.target.value }))} className="input text-sm">
                {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ</label>
              <input value={branchForm.DiaChi} onChange={(e) => setBranchForm((prev) => ({ ...prev, DiaChi: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">SĐT</label>
              <input value={branchForm.SDT} onChange={(e) => setBranchForm((prev) => ({ ...prev, SDT: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input value={branchForm.Email} onChange={(e) => setBranchForm((prev) => ({ ...prev, Email: e.target.value }))} className="input text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => { setShowBranchForm(false); setBranchForm(EMPTY_BRANCH); setEditingId('') }} className="btn-secondary text-sm px-4 py-2">Huỷ</button>
            <button onClick={handleBranchSubmit} className="btn-primary text-sm px-4 py-2" disabled={saving}>
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Đang lưu...</> : 'Lưu chi nhánh'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 overflow-hidden">
        <div className="card xl:col-span-2 flex flex-col overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            <div className="col-span-2">Mã CN</div>
            <div className="col-span-3">Chi nhánh</div>
            <div className="col-span-3">Địa chỉ</div>
            <div className="col-span-2">Liên hệ</div>
            <div className="col-span-1">T.thái</div>
            <div className="col-span-1 text-right">Sửa</div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <RefreshCw size={16} className="animate-spin" /> Đang tải chi nhánh...
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Building2 size={36} className="mb-2 opacity-30" />
                <p className="text-sm">Không có chi nhánh nào</p>
              </div>
            ) : filteredBranches.map((item) => (
              <div key={item.MaCN} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-gray-50">
                <div className="col-span-2 font-mono text-xs font-semibold text-gray-700">{item.MaCN}</div>
                <div className="col-span-3 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.TenCN}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.Email || 'Chưa cập nhật email'}</p>
                </div>
                <div className="col-span-3 text-xs text-gray-600 flex items-center gap-1 truncate"><MapPin size={12} /> {item.DiaChi || '—'}</div>
                <div className="col-span-2 text-xs text-gray-600 space-y-1">
                  <p className="flex items-center gap-1"><Phone size={12} /> {item.SDT || '—'}</p>
                  <p className="flex items-center gap-1 truncate"><Mail size={12} /> {item.Email || '—'}</p>
                </div>
                <div className="col-span-1">
                  <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', item.TrangThai === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                    {getStatusLabel(item.TrangThai)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => openEdit(item)} className="text-xs font-semibold text-brand-600 hover:underline">Sửa</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Danh sách bộ phận</h3>
            <div className="space-y-2">
              {departments.map((item) => (
                <div key={item.MaBP} className="rounded-lg border border-gray-100 p-3">
                  <p className="text-sm font-semibold text-gray-800">{item.TenBP}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{item.MaBP}</p>
                  <p className="text-xs text-gray-500 mt-2">{item.MoTa || 'Chưa có mô tả'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
