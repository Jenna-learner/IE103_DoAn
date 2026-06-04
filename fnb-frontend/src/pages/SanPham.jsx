import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Coffee, Plus, RefreshCw, Search,
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { fmtCurrency, fmtNumber } from '../lib/format'

const PRODUCT_STATUS = [
  { value: 'Đang bán', label: 'Đang bán' },
  { value: 'Ngừng bán', label: 'Ngừng bán' },
  { value: 'Hết món', label: 'Hết món' },
]

const EMPTY_FORM = {
  MaSP: '',
  TenSP: '',
  MaLoai: '',
  GiaBan: '',
  TrangThai: 'Đang bán',
}

const EMPTY_RECIPE = { MaNL: '', SoLuongLuong: '' }

function normalizeCategory(item) {
  return {
    MaLoai: item.MaLoai || item.maloai,
    TenLoai: item.TenLoai || item.tenloai,
  }
}

function normalizeIngredient(item) {
  return {
    MaNL: item.MaNL || item.manl,
    TenNL: item.TenNL || item.tennl,
    DonViTinh: item.DonViTinh || item.donvitinh,
  }
}

function normalizeProduct(item) {
  return {
    MaSP: item.MaSP || item.masp,
    TenSP: item.TenSP || item.tensp,
    GiaBan: Number(item.GiaBan ?? item.giaban ?? 0),
    TrangThai: item.TrangThai || item.trangthai || 'Đang bán',
    MaLoai: item.MaLoai || item.maloai,
    TenLoai: item.TenLoai || item.tenloai || '',
  }
}

function normalizeRecipe(item) {
  return {
    MaNL: item.MaNL || item.manl,
    TenNL: item.TenNL || item.tennl,
    DonViTinh: item.DonViTinh || item.donvitinh,
    SoLuongLuong: Number(item.SoLuongLuong ?? item.soluongluong ?? 0),
  }
}

function ProductRow({ item, detail, loadingDetail, onToggle, onEdit, onStatusChange }) {
  const [open, setOpen] = useState(false)

  const handleToggle = async () => {
    const next = !open
    setOpen(next)
    if (next) onToggle(item.MaSP)
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-gray-50 cursor-pointer" onClick={handleToggle}>
        <div className="col-span-2 min-w-0">
          <p className="font-mono text-xs font-semibold text-gray-700 truncate">{item.MaSP}</p>
          <p className="text-[11px] text-gray-400 truncate">{item.TenLoai || 'Chưa phân loại'}</p>
        </div>
        <div className="col-span-3 min-w-0">
          <p className="font-medium text-gray-800 truncate">{item.TenSP}</p>
          <p className="text-[11px] text-gray-400 truncate">Giá bán: {fmtCurrency(item.GiaBan)}</p>
        </div>
        <div className="col-span-2 text-xs text-gray-600">{item.TenLoai || '—'}</div>
        <div className="col-span-2 text-sm font-semibold text-gray-800">{fmtCurrency(item.GiaBan)}</div>
        <div className="col-span-2">
          <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', item.TrangThai === 'Đang bán' ? 'bg-green-100 text-green-700' : item.TrangThai === 'Hết món' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600')}>
            {item.TrangThai}
          </span>
        </div>
        <div className="col-span-1 flex items-center justify-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); onEdit(item) }} className="text-xs font-semibold text-brand-600 hover:underline">Sửa</button>
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
            <div>
              <p className="text-xs font-semibold text-gray-600">Công thức nguyên liệu</p>
              <p className="text-[11px] text-gray-400 mt-1">Chi tiết dùng để xuất kho khi hóa đơn hoàn tất.</p>
            </div>
            <div className="flex items-center gap-2">
              {PRODUCT_STATUS.map((status) => (
                <button
                  key={status.value}
                  onClick={(e) => { e.stopPropagation(); onStatusChange(item.MaSP, status.value) }}
                  className={clsx('text-xs px-2.5 py-1 rounded-lg border font-medium', item.TrangThai === status.value ? 'border-brand-300 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-500 hover:border-gray-300')}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {loadingDetail ? (
            <div className="px-4 py-6 text-sm text-gray-400 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Đang tải công thức...</div>
          ) : !detail?.congthuc?.length ? (
            <div className="px-4 py-6 text-sm text-gray-400">Sản phẩm chưa có công thức nguyên liệu.</div>
          ) : (
            <div>
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-white text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                <div className="col-span-5">Nguyên liệu</div>
                <div className="col-span-3">Đơn vị</div>
                <div className="col-span-4 text-right">Định mức</div>
              </div>
              {detail.congthuc.map((ct, index) => (
                <div key={`${item.MaSP}-${ct.MaNL}-${index}`} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm border-t border-gray-50">
                  <div className="col-span-5">
                    <p className="font-medium text-gray-800">{ct.TenNL}</p>
                    <p className="text-[11px] text-gray-400">{ct.MaNL}</p>
                  </div>
                  <div className="col-span-3 text-xs text-gray-500">{ct.DonViTinh}</div>
                  <div className="col-span-4 text-right font-semibold text-gray-700">{fmtNumber(ct.SoLuongLuong)} {ct.DonViTinh}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SanPham() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [detailMap, setDetailMap] = useState({})
  const [detailLoadingMap, setDetailLoadingMap] = useState({})
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [recipe, setRecipe] = useState([EMPTY_RECIPE])

  const loadData = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const [productRes, categoryRes, ingredientRes] = await Promise.all([
        api.get('/san-pham', { params: { trangThai: '' } }),
        api.get('/loai-san-pham'),
        api.get('/kho/nguyen-lieu'),
      ])
      setProducts((productRes.data || []).map(normalizeProduct))
      setCategories((categoryRes.data || []).map(normalizeCategory))
      setIngredients((ingredientRes.data || []).map(normalizeIngredient))
      setDetailMap({})
      if (showToast) toast.success('Đã làm mới dữ liệu sản phẩm')
    } catch (err) {
      toast.error(err.message || 'Không tải được dữ liệu sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    let list = products
    if (filterCategory) list = list.filter((item) => item.MaLoai === filterCategory)
    if (filterStatus) list = list.filter((item) => item.TrangThai === filterStatus)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((item) => item.MaSP?.toLowerCase().includes(q) || item.TenSP?.toLowerCase().includes(q))
    }
    return list
  }, [products, filterCategory, filterStatus, search])

  const loadProductDetail = async (maSP) => {
    if (detailMap[maSP]) return
    setDetailLoadingMap((prev) => ({ ...prev, [maSP]: true }))
    try {
      const res = await api.get(`/san-pham/${maSP}`)
      setDetailMap((prev) => ({
        ...prev,
        [maSP]: {
          ...normalizeProduct(res.data),
          congthuc: (res.data.congthuc || []).map(normalizeRecipe),
        },
      }))
    } catch {
      setDetailMap((prev) => ({ ...prev, [maSP]: { congthuc: [] } }))
    } finally {
      setDetailLoadingMap((prev) => ({ ...prev, [maSP]: false }))
    }
  }

  const openCreate = () => {
    setEditingId('')
    setForm(EMPTY_FORM)
    setRecipe([EMPTY_RECIPE])
    setShowForm(true)
  }

  const openEdit = async (product) => {
    setEditingId(product.MaSP)
    setForm({ ...product, GiaBan: product.GiaBan })
    setShowForm(true)

    try {
      const res = await api.get(`/san-pham/${product.MaSP}`)
      setForm({ ...normalizeProduct(res.data), GiaBan: normalizeProduct(res.data).GiaBan })
      setRecipe((res.data.congthuc || []).map((item) => ({ MaNL: item.MaNL, SoLuongLuong: item.SoLuongLuong })) || [EMPTY_RECIPE])
    } catch (err) {
      toast.error(err.message || 'Không tải được chi tiết sản phẩm')
      setRecipe([EMPTY_RECIPE])
    }
  }

  const updateRecipe = (index, field, value) => {
    setRecipe((prev) => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item))
  }

  const addRecipeRow = () => setRecipe((prev) => [...prev, EMPTY_RECIPE])
  const removeRecipeRow = (index) => setRecipe((prev) => prev.filter((_, idx) => idx !== index))

  const validate = () => {
    if (!form.MaSP && !editingId) return toast.error('Vui lòng nhập mã sản phẩm'), false
    if (!form.TenSP) return toast.error('Vui lòng nhập tên sản phẩm'), false
    if (!form.MaLoai) return toast.error('Vui lòng chọn loại sản phẩm'), false
    if (Number(form.GiaBan) <= 0) return toast.error('Giá bán phải lớn hơn 0'), false

    const recipeItems = recipe.filter((item) => item.MaNL)
    const duplicated = new Set()
    for (const item of recipeItems) {
      if (duplicated.has(item.MaNL)) return toast.error('Không chọn trùng nguyên liệu trong cùng một công thức'), false
      duplicated.add(item.MaNL)
    }

    const validRecipe = recipe.every((item) => !item.MaNL || Number(item.SoLuongLuong) > 0)
    if (!validRecipe) return toast.error('Định mức nguyên liệu phải lớn hơn 0'), false
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        GiaBan: Number(form.GiaBan),
        congthuc: recipe.filter((item) => item.MaNL && Number(item.SoLuongLuong) > 0).map((item) => ({
          MaNL: item.MaNL,
          SoLuongLuong: Number(item.SoLuongLuong),
        })),
      }

      if (editingId) {
        const res = await api.put(`/san-pham/${editingId}`, payload)
        toast.success(res.message || 'Đã cập nhật sản phẩm')
        await loadData()
      } else {
        const res = await api.post('/san-pham', payload)
        toast.success(res.message || 'Đã thêm sản phẩm')
        await loadData()
      }

      setShowForm(false)
      setEditingId('')
      setForm(EMPTY_FORM)
      setRecipe([EMPTY_RECIPE])
    } catch (err) {
      toast.error(err.message || 'Không lưu được sản phẩm')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (maSP, TrangThai) => {
    const target = products.find((item) => item.MaSP === maSP)
    if (!target) return
    if (target.TrangThai === TrangThai) return
    const ok = window.confirm(`Đổi trạng thái sản phẩm "${target.TenSP}" sang "${TrangThai}"? Thay đổi này sẽ ảnh hưởng trực tiếp tới màn hình bán hàng.`)
    if (!ok) return
    try {
      const res = await api.patch(`/san-pham/${maSP}/trang-thai`, { TrangThai })
      toast.success(res.message || 'Đã cập nhật trạng thái sản phẩm')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được trạng thái sản phẩm')
    }
  }

  const activeCount = products.filter((item) => item.TrangThai === 'Đang bán').length
  const inactiveCount = products.filter((item) => item.TrangThai !== 'Đang bán').length

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <div className="card"><p className="text-xs text-gray-400">Tổng sản phẩm</p><p className="text-xl font-bold text-gray-900 mt-1">{products.length}</p></div>
        <div className="card"><p className="text-xs text-gray-400">Đang bán</p><p className="text-xl font-bold text-green-600 mt-1">{activeCount}</p></div>
        <div className="card"><p className="text-xs text-gray-400">Cần xử lý</p><p className="text-xl font-bold text-amber-600 mt-1">{inactiveCount}</p></div>
      </div>

      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã hoặc tên sản phẩm..." className="input pl-8 text-sm" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input text-sm w-44">
          <option value="">Tất cả loại</option>
          {categories.map((item) => <option key={item.MaLoai} value={item.MaLoai}>{item.TenLoai}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input text-sm w-44">
          <option value="">Tất cả trạng thái</option>
          {PRODUCT_STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button onClick={() => loadData(true)} className="btn-secondary text-sm px-3 py-2" disabled={loading}><RefreshCw size={14} className={clsx(loading && 'animate-spin')} /> Làm mới</button>
        <button onClick={openCreate} className="btn-primary text-sm px-3 py-2"><Plus size={14} /> Thêm sản phẩm</button>
      </div>

      {showForm && (
        <div className="card shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">{editingId ? 'Cập nhật sản phẩm / menu' : 'Thêm sản phẩm mới'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(''); setForm(EMPTY_FORM); setRecipe([EMPTY_RECIPE]) }} className="text-xs text-gray-400 hover:text-gray-600">✕ Đóng</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Mã SP</label><input value={form.MaSP} onChange={(e) => setForm((p) => ({ ...p, MaSP: e.target.value }))} className="input text-sm" disabled={!!editingId} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tên SP</label><input value={form.TenSP} onChange={(e) => setForm((p) => ({ ...p, TenSP: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Loại SP</label><select value={form.MaLoai} onChange={(e) => setForm((p) => ({ ...p, MaLoai: e.target.value }))} className="input text-sm"><option value="">-- Chọn loại --</option>{categories.map((item) => <option key={item.MaLoai} value={item.MaLoai}>{item.TenLoai}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Giá bán</label><input type="number" value={form.GiaBan} onChange={(e) => setForm((p) => ({ ...p, GiaBan: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái</label><select value={form.TrangThai} onChange={(e) => setForm((p) => ({ ...p, TrangThai: e.target.value }))} className="input text-sm">{PRODUCT_STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Công thức nguyên liệu</label>
              <button onClick={addRecipeRow} className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"><Plus size={12} /> Thêm dòng</button>
            </div>
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-t-lg text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              <div className="col-span-6">Nguyên liệu</div>
              <div className="col-span-4">Định mức</div>
              <div className="col-span-2"></div>
            </div>
            <div className="border border-gray-100 rounded-b-lg divide-y divide-gray-50">
              {recipe.map((row, index) => {
                const ingredient = ingredients.find((item) => item.MaNL === row.MaNL)
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <div className="col-span-6">
                      <select value={row.MaNL} onChange={(e) => updateRecipe(index, 'MaNL', e.target.value)} className="input text-xs w-full py-1.5">
                        <option value="">-- Chọn nguyên liệu --</option>
                        {ingredients.map((item) => <option key={item.MaNL} value={item.MaNL}>{item.TenNL}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} step="0.01" value={row.SoLuongLuong} onChange={(e) => updateRecipe(index, 'SoLuongLuong', e.target.value)} className="input text-xs w-full py-1.5" placeholder="Số lượng định mức" />
                        <span className="text-xs text-gray-500 w-16 text-right">{ingredient?.DonViTinh || '—'}</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {recipe.length > 1 && <button onClick={() => removeRecipeRow(index)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => { setShowForm(false); setEditingId(''); setForm(EMPTY_FORM); setRecipe([EMPTY_RECIPE]) }} className="btn-secondary text-sm px-4 py-2">Huỷ</button>
            <button onClick={handleSubmit} className="btn-primary text-sm px-4 py-2" disabled={saving}>{saving ? <><RefreshCw size={14} className="animate-spin" /> Đang lưu...</> : 'Lưu sản phẩm'}</button>
          </div>
        </div>
      )}

      <div className="card flex-1 overflow-hidden p-0">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          <div className="col-span-2">Mã SP</div>
          <div className="col-span-3">Sản phẩm</div>
          <div className="col-span-2">Loại</div>
          <div className="col-span-2">Giá bán</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-1 text-right">Chi tiết</div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 p-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2"><RefreshCw size={16} className="animate-spin" /> Đang tải sản phẩm...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400"><Coffee size={36} className="mb-2 opacity-30" /><p className="text-sm">Không có sản phẩm nào</p></div>
          ) : filtered.map((item) => (
            <ProductRow
              key={item.MaSP}
              item={item}
              detail={detailMap[item.MaSP]}
              loadingDetail={detailLoadingMap[item.MaSP]}
              onToggle={loadProductDetail}
              onEdit={openEdit}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
