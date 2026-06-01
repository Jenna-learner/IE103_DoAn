import { useCallback, useEffect, useMemo, useState } from 'react'
import { Truck, Plus, RefreshCw, Search, Phone, MapPin, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'

const EMPTY_FORM = {
  MaNCC: '',
  TenNCC: '',
  NguoiLienHe: '',
  SDT: '',
  Email: '',
  DiaChi: '',
  TrangThai: 'Active',
}

function normalizeSupplier(item) {
  return {
    MaNCC: item.MaNCC || item.mancc,
    TenNCC: item.TenNCC || item.tenncc,
    NguoiLienHe: item.NguoiLienHe || item.nguoilienhe || '',
    SDT: item.SDT || item.sdt || '',
    Email: item.Email || item.email || '',
    DiaChi: item.DiaChi || item.diachi || '',
    TrangThai: item.TrangThai || item.trangthai || 'Active',
  }
}

export default function NhaCungCap() {
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const loadSuppliers = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const res = await api.get('/nha-cung-cap')
      setSuppliers((res.data || []).map(normalizeSupplier))
      if (showToast) toast.success('Đã làm mới danh sách nhà cung cấp')
    } catch (err) {
      toast.error(err.message || 'Không tải được nhà cung cấp')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter((item) =>
      item.MaNCC?.toLowerCase().includes(q) ||
      item.TenNCC?.toLowerCase().includes(q) ||
      item.SDT?.toLowerCase().includes(q)
    )
  }, [suppliers, search])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId('')
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (supplier) => {
    setForm(supplier)
    setEditingId(supplier.MaNCC)
    setShowForm(true)
  }

  const validate = () => {
    if (!form.MaNCC && !editingId) {
      toast.error('Vui lòng nhập mã nhà cung cấp')
      return false
    }
    if (!form.TenNCC) {
      toast.error('Vui lòng nhập tên nhà cung cấp')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editingId) {
        const res = await api.put(`/nha-cung-cap/${editingId}`, form)
        toast.success(res.message || 'Đã cập nhật nhà cung cấp')
        await loadSuppliers()
      } else {
        const res = await api.post('/nha-cung-cap', form)
        toast.success(res.message || 'Đã thêm nhà cung cấp')
        await loadSuppliers()
      }

      setShowForm(false)
      resetForm()
    } catch (err) {
      toast.error(err.message || 'Không lưu được nhà cung cấp')
    } finally {
      setSaving(false)
    }
  }

  const activeCount = suppliers.filter((item) => item.TrangThai === 'Active').length

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <div className="card">
          <p className="text-xs text-gray-400">Tổng nhà cung cấp</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{suppliers.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">Đang hoạt động</p>
          <p className="text-xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">Nguồn dữ liệu</p>
          <p className="text-sm font-semibold mt-2 text-brand-600">API backend</p>
        </div>
      </div>

      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã, tên hoặc SĐT nhà cung cấp..."
            className="input pl-8 text-sm"
          />
        </div>

        <button onClick={() => loadSuppliers(true)} className="btn-secondary text-sm px-3 py-2" disabled={loading}>
          <RefreshCw size={14} className={clsx(loading && 'animate-spin')} /> Làm mới
        </button>
        <button onClick={openCreate} className="btn-primary text-sm px-3 py-2">
          <Plus size={14} /> Thêm NCC
        </button>
      </div>

      {showForm && (
        <div className="card shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">{editingId ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}</h2>
            <button onClick={() => { setShowForm(false); resetForm() }} className="text-xs text-gray-400 hover:text-gray-600">✕ Đóng</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mã NCC</label>
              <input value={form.MaNCC} onChange={(e) => setForm((prev) => ({ ...prev, MaNCC: e.target.value }))} className="input text-sm" disabled={!!editingId} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tên NCC</label>
              <input value={form.TenNCC} onChange={(e) => setForm((prev) => ({ ...prev, TenNCC: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Người liên hệ</label>
              <input value={form.NguoiLienHe} onChange={(e) => setForm((prev) => ({ ...prev, NguoiLienHe: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại</label>
              <input value={form.SDT} onChange={(e) => setForm((prev) => ({ ...prev, SDT: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input value={form.Email} onChange={(e) => setForm((prev) => ({ ...prev, Email: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label>
              <select value={form.TrangThai} onChange={(e) => setForm((prev) => ({ ...prev, TrangThai: e.target.value }))} className="input text-sm">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ</label>
              <input value={form.DiaChi} onChange={(e) => setForm((prev) => ({ ...prev, DiaChi: e.target.value }))} className="input text-sm" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => { setShowForm(false); resetForm() }} className="btn-secondary text-sm px-4 py-2">Huỷ</button>
            <button onClick={handleSubmit} className="btn-primary text-sm px-4 py-2" disabled={saving}>
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Đang lưu...</> : 'Lưu nhà cung cấp'}
            </button>
          </div>
        </div>
      )}

      <div className="card flex-1 overflow-hidden p-0">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          <div className="col-span-2">Mã NCC</div>
          <div className="col-span-3">Tên / Liên hệ</div>
          <div className="col-span-2">SĐT</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-2">Địa chỉ</div>
          <div className="col-span-1 text-right">Thao tác</div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" /> Đang tải nhà cung cấp...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Truck size={36} className="mb-2 opacity-30" />
              <p className="text-sm">Không có nhà cung cấp nào</p>
            </div>
          ) : filtered.map((item) => (
            <div key={item.MaNCC} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-gray-50">
              <div className="col-span-2">
                <p className="font-mono text-xs font-semibold text-gray-700">{item.MaNCC}</p>
                <span className={clsx('inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', item.TrangThai === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                  {item.TrangThai}
                </span>
              </div>
              <div className="col-span-3 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.TenNCC}</p>
                <p className="text-[11px] text-gray-400 truncate">{item.NguoiLienHe || 'Chưa cập nhật liên hệ'}</p>
              </div>
              <div className="col-span-2 text-xs text-gray-600 flex items-center gap-1"><Phone size={12} /> {item.SDT || '—'}</div>
              <div className="col-span-2 text-xs text-gray-600 flex items-center gap-1 truncate"><Mail size={12} /> {item.Email || '—'}</div>
              <div className="col-span-2 text-xs text-gray-600 flex items-center gap-1 truncate"><MapPin size={12} /> {item.DiaChi || '—'}</div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => openEdit(item)} className="text-xs font-semibold text-brand-600 hover:underline">Sửa</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
