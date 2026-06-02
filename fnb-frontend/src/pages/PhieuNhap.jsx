import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Truck, Plus, ChevronDown, ChevronUp, CheckCircle,
  XCircle, Trash2, RefreshCw, Search, PackagePlus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { fmtCurrency, fmtNumber } from '../lib/format'
import useAuthStore from '../store/authStore'
import { ROLE, normalizeRole } from '../lib/roles'

const STATUS = {
  Draft:     { label: 'Bản nháp', cls: 'bg-gray-100 text-gray-600' },
  Approved:  { label: 'Đã duyệt', cls: 'bg-green-100 text-green-700' },
  Cancelled: { label: 'Đã huỷ',   cls: 'bg-red-100 text-red-600' },
}

const STATUS_FILTER = [
  { value: '',          label: 'Tất cả' },
  { value: 'Draft',     label: 'Bản nháp' },
  { value: 'Approved',  label: 'Đã duyệt' },
  { value: 'Cancelled', label: 'Đã huỷ' },
]

function fmtDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fmtDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function normalizeNCC(item) {
  return {
    MaNCC: item.MaNCC || item.mancc,
    TenNCC: item.TenNCC || item.tenncc,
    SDT: item.SDT || item.sdt,
    DiaChi: item.DiaChi || item.diachi,
  }
}

function normalizeIngredient(item) {
  return {
    MaNL: item.MaNL || item.manl,
    TenNL: item.TenNL || item.tennl,
    DonViTinh: item.DonViTinh || item.donvitinh,
  }
}

function normalizeChiTiet(item) {
  return {
    MaNL: item.MaNL || item.manl,
    TenNL: item.TenNL || item.tennl,
    DonViTinh: item.DonViTinh || item.donvitinh,
    SoLuong: Number(item.SoLuong ?? item.soluong ?? 0),
    DonGia: Number(item.DonGia ?? item.dongia ?? 0),
    ThanhTien: Number(item.ThanhTien ?? item.thanhtien ?? 0),
  }
}

function normalizePhieu(item) {
  return {
    MaPN: item.MaPN || item.mapn,
    MaNCC: item.MaNCC || item.mancc,
    TenNCC: item.TenNCC || item.tenncc,
    NgayNhap: item.NgayNhap || item.ngaynhap,
    GhiChu: item.GhiChu || item.ghichu || '',
    TrangThai: item.TrangThai || item.trangthai,
    NgayTao: item.NgayTao || item.ngaytao,
    NguoiTao: item.TenNhanVienLap || item.NguoiTao || item.nguoitao || '—',
    TongTien: Number(item.TongTien ?? item.tongtien ?? 0),
    chiTiet: (item.chiTiet || item.chitiet || []).map(normalizeChiTiet),
  }
}

function PhieuRow({ phieu, canApprove, canCancel, busy, onApprove, onCancel }) {
  const [open, setOpen] = useState(false)
  const st = STATUS[phieu.TrangThai] || STATUS.Draft

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      <div
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 grid grid-cols-12 gap-2 items-center min-w-0">
          <div className="col-span-3 min-w-0">
            <p className="font-mono text-xs font-bold text-gray-700 truncate">{phieu.MaPN}</p>
            <p className="text-[11px] text-gray-400">{fmtDateTime(phieu.NgayTao)}</p>
          </div>

          <div className="col-span-4 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{phieu.TenNCC}</p>
            <p className="text-[11px] text-gray-400 truncate">{phieu.NguoiTao}</p>
          </div>

          <div className="col-span-2 text-xs text-gray-500 text-center">
            {fmtDate(phieu.NgayNhap)}
          </div>

          <div className="col-span-2 text-right">
            <p className="text-sm font-semibold text-gray-800">{fmtCurrency(phieu.TongTien)}</p>
            <p className="text-[11px] text-gray-400">{phieu.chiTiet.length} nguyên liệu</p>
          </div>

          <div className="col-span-1 flex justify-end">
            <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap', st.cls)}>
              {st.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {phieu.TrangThai === 'Draft' && canApprove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApprove(phieu.MaPN)
              }}
              disabled={busy}
              className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
            >
              <CheckCircle size={12} /> Duyệt
            </button>
          )}

          {phieu.TrangThai === 'Draft' && canCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancel(phieu.MaPN)
              }}
              disabled={busy}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors disabled:opacity-60"
            >
              <XCircle size={12} /> Huỷ
            </button>
          )}

          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100">
          {phieu.GhiChu && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
              <p className="text-xs text-amber-700"><span className="font-semibold">Ghi chú:</span> {phieu.GhiChu}</p>
            </div>
          )}

          {phieu.chiTiet.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">Chưa có chi tiết nguyên liệu</div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                <div className="col-span-5">Nguyên liệu</div>
                <div className="col-span-1 text-center">ĐV</div>
                <div className="col-span-2 text-right">Số lượng</div>
                <div className="col-span-2 text-right">Đơn giá</div>
                <div className="col-span-2 text-right">Thành tiền</div>
              </div>

              {phieu.chiTiet.map((row, index) => (
                <div
                  key={`${phieu.MaPN}-${row.MaNL}-${index}`}
                  className={clsx(
                    'grid grid-cols-12 gap-2 px-4 py-2.5 text-sm border-t border-gray-50',
                    index % 2 === 1 && 'bg-gray-50/40'
                  )}
                >
                  <div className="col-span-5">
                    <p className="font-medium text-gray-800">{row.TenNL}</p>
                    <p className="text-[11px] text-gray-400">{row.MaNL}</p>
                  </div>
                  <div className="col-span-1 text-center text-xs text-gray-500">{row.DonViTinh}</div>
                  <div className="col-span-2 text-right text-sm font-semibold text-gray-700">{fmtNumber(row.SoLuong)}</div>
                  <div className="col-span-2 text-right text-xs text-gray-500">{fmtCurrency(row.DonGia)}</div>
                  <div className="col-span-2 text-right text-sm font-semibold text-gray-800">{fmtCurrency(row.ThanhTien)}</div>
                </div>
              ))}

              <div className="flex justify-end px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                <span className="text-sm font-bold text-gray-800">
                  Tổng: <span className="text-brand-600 ml-1">{fmtCurrency(phieu.TongTien)}</span>
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function PhieuNhap() {
  const user = useAuthStore((state) => state.user)
  const role = normalizeRole(user?.vaiTro)
  const canCreate = [ROLE.ADMIN, ROLE.BRANCH_MANAGER, ROLE.WAREHOUSE].includes(role)
  const canApprove = [ROLE.ADMIN, ROLE.OPS_DIRECTOR, ROLE.BRANCH_MANAGER].includes(role)
  const canCancel = [ROLE.ADMIN, ROLE.BRANCH_MANAGER, ROLE.WAREHOUSE].includes(role)

  const [phieuList, setPhieuList] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSt, setFilterSt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionKey, setActionKey] = useState('')

  const [maNCC, setMaNCC] = useState('')
  const [ngay, setNgay] = useState('')
  const [ghiChu, setGhiChu] = useState('')
  const [chiTiet, setChiTiet] = useState([{ MaNL: '', SoLuong: '', DonGia: '' }])

  const ingredientMap = useMemo(
    () => Object.fromEntries(ingredients.map((item) => [item.MaNL, item])),
    [ingredients]
  )

  const resetForm = () => {
    setMaNCC('')
    setNgay('')
    setGhiChu('')
    setChiTiet([{ MaNL: '', SoLuong: '', DonGia: '' }])
  }

  const loadData = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const [listRes, supplierRes, ingredientRes] = await Promise.all([
        api.get('/phieu-nhap'),
        api.get('/nha-cung-cap'),
        api.get('/kho/nguyen-lieu'),
      ])

      const baseList = (listRes.data || []).map(normalizePhieu)
      const detailResults = await Promise.all(
        baseList.map(async (item) => {
          try {
            const detailRes = await api.get(`/phieu-nhap/${item.MaPN}`)
            return normalizePhieu(detailRes.data)
          } catch {
            return item
          }
        })
      )

      setPhieuList(detailResults)
      setSuppliers((supplierRes.data || []).map(normalizeNCC))
      setIngredients((ingredientRes.data || []).map(normalizeIngredient))

      if (showToast) toast.success('Đã làm mới danh sách phiếu nhập')
    } catch (err) {
      toast.error(err.message || 'Không tải được phiếu nhập')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const tongTien = chiTiet.reduce(
    (sum, row) => sum + (parseFloat(row.SoLuong) || 0) * (parseFloat(row.DonGia) || 0),
    0
  )

  const filtered = useMemo(() => {
    let list = phieuList
    if (filterSt) list = list.filter((item) => item.TrangThai === filterSt)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((item) =>
        item.MaPN?.toLowerCase().includes(q) ||
        item.TenNCC?.toLowerCase().includes(q) ||
        item.NguoiTao?.toLowerCase().includes(q)
      )
    }
    return list
  }, [phieuList, filterSt, search])

  const addRow = () => setChiTiet((prev) => [...prev, { MaNL: '', SoLuong: '', DonGia: '' }])
  const removeRow = (index) => setChiTiet((prev) => prev.filter((_, idx) => idx !== index))
  const updateRow = (index, field, value) => {
    setChiTiet((prev) => prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)))
  }

  const validate = () => {
    if (!maNCC) {
      toast.error('Vui lòng chọn nhà cung cấp')
      return false
    }
    if (!ngay) {
      toast.error('Vui lòng chọn ngày nhập dự kiến')
      return false
    }
    if (!chiTiet.length) {
      toast.error('Vui lòng thêm ít nhất 1 dòng nguyên liệu')
      return false
    }

    const selected = new Set()
    for (const row of chiTiet) {
      if (!row.MaNL || Number(row.SoLuong) <= 0 || Number(row.DonGia) <= 0) {
        toast.error('Vui lòng điền đầy đủ thông tin các dòng nguyên liệu')
        return false
      }
      if (selected.has(row.MaNL)) {
        toast.error('Không chọn trùng nguyên liệu trong cùng một phiếu')
        return false
      }
      selected.add(row.MaNL)
    }

    return true
  }

  const handleCreate = async () => {
    if (!validate()) return

    const rows = chiTiet.map((row) => {
      const ingredient = ingredientMap[row.MaNL]
      return {
        MaNL: row.MaNL,
        TenNL: ingredient?.TenNL || row.MaNL,
        DonViTinh: ingredient?.DonViTinh || '',
        SoLuong: Number(row.SoLuong),
        DonGia: Number(row.DonGia),
        ThanhTien: Number(row.SoLuong) * Number(row.DonGia),
      }
    })

    setSaving(true)
    try {
      const res = await api.post('/phieu-nhap', {
        MaNCC: maNCC,
        NgayNhap: ngay,
        GhiChu: ghiChu,
        items: rows.map((row) => ({ MaNL: row.MaNL, SoLuong: row.SoLuong, DonGia: row.DonGia })),
      })
      await loadData()
      toast.success(res.message || 'Đã tạo phiếu nhập thành công')

      resetForm()
      setShowForm(false)
    } catch (err) {
      toast.error(err.message || 'Không tạo được phiếu nhập')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (maPN) => {
    if (!window.confirm(`Duyệt phiếu ${maPN}? Tồn kho sẽ được cập nhật tự động.`)) return

    setActionKey(`approve-${maPN}`)
    try {
      const res = await api.patch(`/phieu-nhap/${maPN}/duyet`)
      await loadData()
      toast.success(res.message || 'Đã duyệt phiếu nhập')
    } catch (err) {
      toast.error(err.message || 'Không duyệt được phiếu nhập')
    } finally {
      setActionKey('')
    }
  }

  const handleCancel = async (maPN) => {
    if (!window.confirm(`Huỷ phiếu ${maPN}?`)) return

    setActionKey(`cancel-${maPN}`)
    try {
      const res = await api.patch(`/phieu-nhap/${maPN}/huy`)
      await loadData()
      toast.success(res.message || 'Đã huỷ phiếu nhập')
    } catch (err) {
      toast.error(err.message || 'Không huỷ được phiếu nhập')
    } finally {
      setActionKey('')
    }
  }

  const draftCount = phieuList.filter((item) => item.TrangThai === 'Draft').length

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã phiếu, nhà cung cấp hoặc người tạo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 text-sm w-full"
          />
        </div>

        <select value={filterSt} onChange={(e) => setFilterSt(e.target.value)} className="input text-sm w-40">
          {STATUS_FILTER.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {draftCount > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg font-semibold">
            {draftCount} phiếu chờ duyệt
          </span>
        )}

        <button
          onClick={() => loadData(true)}
          className="btn-secondary text-sm px-3 py-2 ml-auto"
          disabled={loading}
        >
          <RefreshCw size={13} className={clsx(loading && 'animate-spin')} /> Làm mới
        </button>

        {canCreate && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Tạo phiếu nhập
          </button>
        )}
      </div>

      {showForm && (
        <div className="card shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-800 flex items-center gap-2">
              <PackagePlus size={16} className="text-brand-500" /> Lập phiếu nhập hàng NCC
            </p>
            <button onClick={() => { setShowForm(false); resetForm() }} className="text-xs text-gray-400 hover:text-gray-600">✕ Đóng</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <select value={maNCC} onChange={(e) => setMaNCC(e.target.value)} className="input text-sm w-full">
                <option value="">-- Chọn NCC --</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.MaNCC} value={supplier.MaNCC}>{supplier.TenNCC}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Ngày nhập dự kiến <span className="text-red-500">*</span>
              </label>
              <input type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} className="input text-sm w-full" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
              <input
                type="text"
                placeholder="Ghi chú cho phiếu..."
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                className="input text-sm w-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">
                Danh sách nguyên liệu <span className="text-red-500">*</span>
              </label>
              <button onClick={addRow} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                <Plus size={12} /> Thêm dòng
              </button>
            </div>

            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-t-lg text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              <div className="col-span-5">Nguyên liệu</div>
              <div className="col-span-2 text-center">ĐV</div>
              <div className="col-span-2">Số lượng</div>
              <div className="col-span-2">Đơn giá (₫)</div>
              <div className="col-span-1"></div>
            </div>

            <div className="border border-gray-100 rounded-b-lg divide-y divide-gray-50">
              {chiTiet.map((row, index) => {
                const ingredient = ingredientMap[row.MaNL]
                const lineTotal = (parseFloat(row.SoLuong) || 0) * (parseFloat(row.DonGia) || 0)

                return (
                  <div key={index} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <div className="col-span-5">
                      <select
                        value={row.MaNL}
                        onChange={(e) => updateRow(index, 'MaNL', e.target.value)}
                        className="input text-xs w-full py-1.5"
                      >
                        <option value="">-- Chọn nguyên liệu --</option>
                        {ingredients.map((ingredientOption) => (
                          <option key={ingredientOption.MaNL} value={ingredientOption.MaNL}>{ingredientOption.TenNL}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 text-center text-xs text-gray-500">{ingredient?.DonViTinh || '—'}</div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0"
                        value={row.SoLuong}
                        onChange={(e) => updateRow(index, 'SoLuong', e.target.value)}
                        className="input text-xs w-full py-1.5"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={row.DonGia}
                        onChange={(e) => updateRow(index, 'DonGia', e.target.value)}
                        className="input text-xs w-full py-1.5"
                      />
                      <p className="text-[10px] text-gray-400 mt-1 truncate">Thành tiền: {fmtCurrency(lineTotal)}</p>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      {chiTiet.length > 1 && (
                        <button onClick={() => removeRow(index)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end mt-2">
              <span className="text-sm font-bold text-gray-800">
                Tổng tiền: <span className="text-brand-600 ml-1">{fmtCurrency(tongTien)}</span>
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => { setShowForm(false); resetForm() }} className="btn-secondary text-sm px-4 py-1.5">Huỷ</button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-sm px-4 py-1.5 disabled:opacity-60"
            >
              {saving
                ? <><RefreshCw size={13} className="animate-spin" /> Đang lưu...</>
                : <><Truck size={13} /> Tạo phiếu nháp</>}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          <div className="col-span-3">Mã phiếu / Ngày tạo</div>
          <div className="col-span-4">Nhà cung cấp / Người tạo</div>
          <div className="col-span-2 text-center">Ngày nhập DK</div>
          <div className="col-span-2 text-right">Tổng tiền</div>
          <div className="col-span-1 text-right">T.Thái</div>
        </div>

        {loading ? (
          <div className="card flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Đang tải phiếu nhập...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
            <Truck size={36} className="mb-2 opacity-30" />
            <p className="text-sm">Không có phiếu nhập nào</p>
          </div>
        ) : filtered.map((phieu) => (
          <PhieuRow
            key={phieu.MaPN}
            phieu={phieu}
            canApprove={canApprove}
            canCancel={canCancel}
            busy={actionKey.endsWith(phieu.MaPN)}
            onApprove={handleApprove}
            onCancel={handleCancel}
          />
        ))}
      </div>
    </div>
  )
}
