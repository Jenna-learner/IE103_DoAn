import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, Plus, Receipt, RefreshCw, Search, XCircle } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

import api from '../lib/api'
import { exportExcel } from '../lib/exportExcel'
import useAuthStore from '../store/authStore'
import { ROLE, normalizeRole } from '../lib/roles'

const EXPENSE_TYPES = [
  { value: 'Electricity', label: 'Điện' },
  { value: 'Water', label: 'Nước' },
  { value: 'Internet', label: 'Internet' },
  { value: 'Premises', label: 'Mặt bằng' },
  { value: 'Maintenance & Repair', label: 'Bảo trì' },
  { value: 'Marketing & Advertising', label: 'Marketing' },
  { value: 'Taxes & Fees', label: 'Thuế & phí' },
  { value: 'Other expenses', label: 'Khác' },
]

const STATUS_LABEL = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
}

const STATUS_CLASS = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-green-50 text-green-700 border-green-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
}

function fmtCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' ₫'
}

function fmtDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function normalizeBranch(item = {}) {
  return {
    MaCN: item.MaCN || item.macn,
    TenCN: item.TenCN || item.tencn,
  }
}

function normalizeExpense(item = {}) {
  return {
    MaPC: item.MaPC || item.mapc,
    MaCN: item.MaCN || item.macn,
    TenCN: item.TenCN || item.tencn || '—',
    LoaiChi: item.LoaiChi || item.loaichi || '',
    LoaiChiHienThi: item.LoaiChiHienThi || item.loaichihienthi || item.LoaiChi || item.loaichi || 'Khác',
    SoTien: Number(item.SoTien ?? item.sotien ?? 0),
    MoTa: item.MoTa || item.mota || '',
    NgayChi: item.NgayChi || item.ngaychi || '',
    TrangThai: item.TrangThai || item.trangthai || 'Pending',
    NguoiLap: item.TenNhanVienLap || item.tennhanvienlap || '—',
  }
}

function KpiCard({ icon, label, value, hint }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-brand-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      </div>
    </div>
  )
}

export default function PhieuChi() {
  const user = useAuthStore((s) => s.user)
  const role = normalizeRole(user?.vaiTro)

  const canApprove = [ROLE.ADMIN, ROLE.OPS_DIRECTOR, ROLE.BRANCH_MANAGER].includes(role)
  const canCreate = [ROLE.ADMIN, ROLE.BRANCH_MANAGER, ROLE.CASHIER, ROLE.WAREHOUSE].includes(role)
  const canPickBranch = [ROLE.ADMIN, ROLE.OPS_DIRECTOR].includes(role)

  const [branches, setBranches] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [form, setForm] = useState({
    MaCN: user?.maCN || '',
    LoaiChi: 'Electricity',
    SoTien: '',
    NgayChi: new Date().toISOString().slice(0, 10),
    MoTa: '',
  })

  const selectedBranch = branchFilter === 'ALL' ? '' : branchFilter

  const loadBranches = useCallback(async () => {
    if (!canPickBranch) return
    try {
      const res = await api.get('/chi-nhanh')
      setBranches((res.data || []).map(normalizeBranch))
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách chi nhánh')
    }
  }, [canPickBranch])

  const loadData = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const params = {}
      const targetBranch = canPickBranch ? selectedBranch : user?.maCN
      if (targetBranch) params.maCN = targetBranch
      if (statusFilter) params.trangThai = statusFilter

      const res = await api.get('/phieu-chi', { params })
      setRecords((res.data?.items || []).map(normalizeExpense))
      if (showToast) toast.success('Đã làm mới danh sách phiếu chi')
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách phiếu chi')
    } finally {
      setLoading(false)
    }
  }, [canPickBranch, selectedBranch, statusFilter, user?.maCN])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return records.filter((item) => {
      if (typeFilter && item.LoaiChi !== typeFilter) return false
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        item.MaPC.toLowerCase().includes(q) ||
        item.MoTa.toLowerCase().includes(q) ||
        item.NguoiLap.toLowerCase().includes(q) ||
        item.TenCN.toLowerCase().includes(q)
      )
    })
  }, [records, search, typeFilter])

  const totalApproved = filtered
    .filter((item) => item.TrangThai === 'Approved')
    .reduce((sum, item) => sum + item.SoTien, 0)
  const totalPending = filtered.filter((item) => item.TrangThai === 'Pending').length
  const totalRejected = filtered.filter((item) => item.TrangThai === 'Rejected').length

  const handleCreate = async () => {
    if (!form.MaCN || !form.LoaiChi || !form.SoTien || !form.MoTa.trim()) return
    setSaving(true)
    try {
      const res = await api.post('/phieu-chi', {
        ...form,
        SoTien: Number(form.SoTien),
      })
      toast.success(res.message || 'Đã tạo phiếu chi')
      setShowCreate(false)
      setForm({
        MaCN: canPickBranch ? selectedBranch : user?.maCN || '',
        LoaiChi: 'Electricity',
        SoTien: '',
        NgayChi: new Date().toISOString().slice(0, 10),
        MoTa: '',
      })
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Không tạo được phiếu chi')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (maPC) => {
    try {
      const res = await api.patch(`/phieu-chi/${maPC}/duyet`)
      toast.success(res.message || 'Đã duyệt phiếu chi')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Không duyệt được phiếu chi')
    }
  }

  const handleReject = async (maPC) => {
    try {
      const res = await api.patch(`/phieu-chi/${maPC}/tu-choi`)
      toast.success(res.message || 'Đã từ chối phiếu chi')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Không từ chối được phiếu chi')
    }
  }

  const exportRows = filtered.map((item) => ({
    ...item,
    NgayChiHienThi: fmtDateTime(item.NgayChi),
    TrangThaiHienThi: STATUS_LABEL[item.TrangThai] || item.TrangThai,
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phiếu chi vận hành</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi và phê duyệt các khoản chi theo chi nhánh, trạng thái và loại chi phí.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => loadData(true)} className="btn-secondary px-3 py-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={clsx(loading && 'animate-spin')} />
            Làm mới
          </button>
          <button
            onClick={() => exportExcel('phieu-chi', 'Phiếu chi', [
              { label: 'Mã phiếu', value: 'MaPC' },
              { label: 'Chi nhánh', value: 'TenCN' },
              { label: 'Loại chi', value: 'LoaiChiHienThi' },
              { label: 'Số tiền', value: 'SoTien' },
              { label: 'Ngày chi', value: 'NgayChiHienThi' },
              { label: 'Người lập', value: 'NguoiLap' },
              { label: 'Trạng thái', value: 'TrangThaiHienThi' },
              { label: 'Mô tả', value: 'MoTa' },
            ], exportRows)}
            className="btn-secondary px-3 py-2 text-sm"
            disabled={exportRows.length === 0}
          >
            <Download size={14} />
            Xuất báo cáo
          </button>
          {canCreate && (
            <button
              onClick={() => {
                setForm((prev) => ({ ...prev, MaCN: canPickBranch ? selectedBranch : user?.maCN || '' }))
                setShowCreate(true)
              }}
              className="btn-primary px-3 py-2 text-sm"
            >
              <Plus size={14} />
              Tạo phiếu chi
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard icon={<Receipt size={18} />} label="Tổng chi đã duyệt" value={fmtCurrency(totalApproved)} hint="Theo bộ lọc hiện tại" />
        <KpiCard icon={<RefreshCw size={18} />} label="Phiếu chờ duyệt" value={totalPending} hint="Cần quản lý xử lý" />
        <KpiCard icon={<XCircle size={18} />} label="Phiếu bị từ chối" value={totalRejected} hint="Các khoản chi chưa được chấp thuận" />
      </div>

      <div className="card flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã phiếu, người lập, mô tả, chi nhánh..."
            className="input pl-9 text-sm"
          />
        </div>

        {canPickBranch && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="input min-w-52 text-sm"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.MaCN} value={branch.MaCN}>{branch.TenCN}</option>
            ))}
          </select>
        )}

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input min-w-44 text-sm">
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input min-w-44 text-sm">
          <option value="">Tất cả loại chi</option>
          {EXPENSE_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-100">
                {['Mã phiếu', 'Chi nhánh', 'Loại chi', 'Ngày chi', 'Người lập', 'Số tiền', 'Trạng thái', 'Mô tả'].map((label) => (
                  <th key={label} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>
                ))}
                {canApprove && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canApprove ? 9 : 8} className="px-5 py-10 text-center text-sm text-gray-400">
                    <RefreshCw size={16} className="mr-2 inline animate-spin" />
                    Đang tải dữ liệu phiếu chi...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canApprove ? 9 : 8} className="px-5 py-10 text-center text-sm text-gray-400">
                    Không có phiếu chi nào khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.MaPC} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-700">{item.MaPC}</td>
                    <td className="px-5 py-4 text-gray-700">{item.TenCN}</td>
                    <td className="px-5 py-4 text-gray-700">{item.LoaiChiHienThi}</td>
                    <td className="px-5 py-4 text-gray-500">{fmtDateTime(item.NgayChi)}</td>
                    <td className="px-5 py-4 text-gray-700">{item.NguoiLap}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{fmtCurrency(item.SoTien)}</td>
                    <td className="px-5 py-4">
                      <span className={clsx('rounded-full border px-2.5 py-1 text-xs font-semibold', STATUS_CLASS[item.TrangThai] || STATUS_CLASS.Pending)}>
                        {STATUS_LABEL[item.TrangThai] || item.TrangThai}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{item.MoTa || '—'}</td>
                    {canApprove && (
                      <td className="px-5 py-4">
                        {item.TrangThai === 'Pending' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(item.MaPC)} className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100">
                              <CheckCircle2 size={13} />
                              Duyệt
                            </button>
                            <button onClick={() => handleReject(item.MaPC)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                              <XCircle size={13} />
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Đã xử lý</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Tạo phiếu chi mới</h3>
                <p className="mt-1 text-xs text-gray-400">Điền đủ thông tin khoản chi để gửi phê duyệt.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <XCircle size={16} />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              {canPickBranch && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Chi nhánh</label>
                  <select
                    value={form.MaCN}
                    onChange={(e) => setForm((prev) => ({ ...prev, MaCN: e.target.value }))}
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
                <label className="mb-1 block text-xs font-semibold text-gray-600">Loại chi</label>
                <select
                  value={form.LoaiChi}
                  onChange={(e) => setForm((prev) => ({ ...prev, LoaiChi: e.target.value }))}
                  className="input text-sm"
                >
                  {EXPENSE_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Ngày chi</label>
                <input
                  type="date"
                  value={form.NgayChi}
                  onChange={(e) => setForm((prev) => ({ ...prev, NgayChi: e.target.value }))}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Số tiền</label>
                <input
                  type="number"
                  min="0"
                  value={form.SoTien}
                  onChange={(e) => setForm((prev) => ({ ...prev, SoTien: e.target.value }))}
                  className="input text-sm"
                  placeholder="Nhập số tiền..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Người lập</label>
                <input readOnly value={user?.hoTen || '—'} className="input bg-gray-50 text-sm text-gray-500" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-gray-600">Mô tả khoản chi</label>
                <textarea
                  rows={4}
                  value={form.MoTa}
                  onChange={(e) => setForm((prev) => ({ ...prev, MoTa: e.target.value }))}
                  className="input min-h-28 resize-none text-sm"
                  placeholder="Ví dụ: Thanh toán chi phí bảo trì máy pha cà phê..."
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Huỷ</button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.MaCN || !form.LoaiChi || !form.SoTien || !form.MoTa.trim()}
                className="btn-primary flex-1"
              >
                {saving ? 'Đang lưu...' : 'Tạo phiếu chi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
