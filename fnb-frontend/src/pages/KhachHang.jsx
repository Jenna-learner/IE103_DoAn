/**
 * KhachHang.jsx — Khách hàng CRM (/khach-hang)
 *
 * Tính năng:
 *   - Bảng danh sách: Tên + SĐT, Hạng thành viên, Điểm tích lũy, Ngày tham gia
 *   - Tìm kiếm theo tên hoặc SĐT
 *   - Lọc theo hạng thành viên (Đồng / Bạc / Vàng / Kim cương)
 *   - Nút "Thêm khách hàng" → mở modal form
 *   - Click hàng → modal xem chi tiết + lịch sử mua hàng
 *   - Trong modal: nút Chỉnh sửa → chỉ sửa tên và email
 *   - Hạng + điểm tích lũy do hệ thống tự tính, không chỉnh thủ công
 *
 * Quyền truy cập: admin, quản lý chi nhánh, thu ngân
 *
 */
import { useState, useEffect, useMemo } from 'react'
import { Search, UserPlus, RefreshCw, Users, Star, Award, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { fmtCurrency } from '../lib/format'
import KhachHangModal from '../components/khachhang/KhachHangModal'

/* ── Membership config ────────────────────────────────────────────────────── */
const MEMBERSHIP = {
  'Đồng':      { cls: 'bg-orange-100 text-orange-700', icon: '🥉' },
  'Bạc':       { cls: 'bg-gray-100 text-gray-700',     icon: '🥈' },
  'Vàng':      { cls: 'bg-yellow-100 text-yellow-700', icon: '🥇' },
  'Kim cương': { cls: 'bg-blue-100 text-blue-700',     icon: '💎' },
}

const HANG_FILTER = [
  { value: '',           label: 'Tất cả hạng'   },
  { value: 'Đồng',      label: '🥉 Đồng'        },
  { value: 'Bạc',       label: '🥈 Bạc'         },
  { value: 'Vàng',      label: '🥇 Vàng'        },
  { value: 'Kim cương', label: '💎 Kim cương'   },
]


// DB có thể trả hạng bằng tiếng Anh (Bronze/Silver/Gold/Platinum) hoặc tiếng Việt.
// Chuẩn hóa hết về tiếng Việt để khớp MEMBERSHIP, bộ lọc và KPI bên dưới.
const RANK_VI = {
  Bronze: 'Đồng', Silver: 'Bạc', Gold: 'Vàng', Platinum: 'Kim cương',
  'Đồng': 'Đồng', 'Bạc': 'Bạc', 'Vàng': 'Vàng', 'Kim cương': 'Kim cương',
}
const toVietRank = (r) => RANK_VI[r] || 'Đồng'

function normalizeCustomer(item = {}) {
  return {
    MaKH: item.MaKH || item.makh,
    TenKH: item.TenKH || item.tenkh || '',
    SDT: item.SDT || item.sdt || '',
    Email: item.Email || item.email || '',
    HangThanhVien: toVietRank(item.HangThanhVien || item.hangthanhvien),
    DiemTichLuy: Number(item.DiemTichLuy ?? item.diemtichluy ?? 0),
    TongDonHang: Number(item.TongDonHang ?? item.tongdonhang ?? 0),
    TongChiTieu: Number(item.TongChiTieu ?? item.tongchitieu ?? 0),
    NgayThamGia: item.NgayThamGia || item.ngaythamgia || item.CreatedAt || item.createdat || '',
  }
}

function normalizeOrder(item = {}) {
  return {
    MaHD: item.MaHD || item.mahd,
    MaKH: item.MaKH || item.makh,
    NgayLap: item.NgayLap || item.ngaylap || '',
    TongThanhToan: Number(item.TongThanhToan ?? item.tongthanhtoan ?? 0),
    TrangThai: item.TrangThai || item.trangthai || 'Pending',
  }
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ── KPI card ─────────────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-3">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-base font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function KhachHang() {
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading,   setLoading]   = useState(false)

  // Filters
  const [search,     setSearch]     = useState('')
  const [filterHang, setFilterHang] = useState('')

  // Modal
  const [modalCustomer, setModalCustomer] = useState(null)   // customer object | null
  const [modalMode,     setModalMode]     = useState('view') // 'view' | 'edit' | 'add'

  /* ── Load ── */
  const loadCustomers = async () => {
    setLoading(true)
    try {
      const [customerRes, orderRes] = await Promise.all([
        api.get('/khach-hang', { params: { page: 1, limit: 10000 } }),
        api.get('/hoa-don', { params: { page: 1, limit: 500 } }),
      ])
      setCustomers((customerRes.data || []).map(normalizeCustomer))
      setOrders((orderRes.data || []).map(normalizeOrder))
    } catch {
      toast.error('Không tải được danh sách khách hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCustomers() }, [])

  /* ── Filter ── */
  const filtered = useMemo(() => {
    let list = customers
    if (filterHang) list = list.filter(c => c.HangThanhVien === filterHang)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c =>
        c.TenKH.toLowerCase().includes(q) || c.SDT.includes(q)
      )
    }
    return list
  }, [customers, filterHang, search])

  /* ── KPI ── */
  const totalKimCuong = customers.filter(c => c.HangThanhVien === 'Kim cương').length
  const totalVang     = customers.filter(c => c.HangThanhVien === 'Vàng').length
  const totalPoints  = customers.reduce((s, c) => s + (c.DiemTichLuy || 0), 0)

  /* ── Lịch sử đơn hàng của KH được chọn ── */
  const selectedOrders = useMemo(() => {
    if (!modalCustomer) return []
    return orders.filter((o) => o.MaKH === modalCustomer.MaKH)
  }, [modalCustomer, orders])

  /* ── Mở modal ── */
  const closeModal = () => { setModalCustomer(null); setModalMode('view') }
  const openView = (customer) => { setModalCustomer(customer); setModalMode('view') }
  const openAdd  = ()         => { setModalCustomer(null);    setModalMode('add')  }

  /* ── Lưu (add / edit) ── */
  const handleSave = async (data) => {
    try {
      if (modalMode === 'add') {
        await api.post('/khach-hang', {
          TenKH: data.TenKH,
          SDT: data.SDT,
          Email: data.Email || null,
        })
        toast.success('Đã thêm khách hàng mới')
      } else {
        await api.put(`/khach-hang/${modalCustomer.MaKH}`, {
          TenKH: data.TenKH,
          Email: data.Email || modalCustomer?.Email || null,
          DiemTichLuy: data.DiemTichLuy,
          HangThanhVien: data.HangThanhVien,
        })
        toast.success('Đã cập nhật thông tin')
      }
      loadCustomers()
      closeModal()
    } catch {
      toast.error('Không thể lưu thông tin khách hàng')
    }
  }

  /* ── Reset filters ── */
  const hasFilter = search || filterHang
  const resetFilters = () => { setSearch(''); setFilterHang('') }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <KpiCard
          icon={<Users size={18} className="text-brand-600" />}
          label="Tổng khách hàng" value={`${customers.length} người`} color="bg-amber-50"
        />
        <KpiCard
          icon={<Trophy size={18} className="text-yellow-500" />}
          label="Vàng + Kim cương" value={`${totalVang + totalKimCuong} người`} color="bg-yellow-50"
        />
        <KpiCard
          icon={<Star size={18} className="text-purple-500" />}
          label="Tổng điểm tích lũy" value={totalPoints.toLocaleString()} color="bg-purple-50"
        />
      </div>

      {/* ── Thanh công cụ ── */}
      <div className="card shrink-0 flex flex-wrap items-center gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm tên hoặc số điện thoại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-8 text-sm w-full"
          />
        </div>

        {/* Lọc hạng */}
        <select
          value={filterHang}
          onChange={e => setFilterHang(e.target.value)}
          className="input text-sm w-40"
        >
          {HANG_FILTER.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
        </select>

        {/* Reset */}
        {hasFilter && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-600 transition-colors"
          >
            <RefreshCw size={13} />
            Đặt lại
          </button>
        )}

        {/* Thêm KH */}
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-1.5 text-sm ml-auto"
        >
          <UserPlus size={15} />
          Thêm khách hàng
        </button>
      </div>

      {/* ── Bảng ── */}
      <div className="card flex-1 flex flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100
                        text-[11px] font-semibold text-gray-400 uppercase tracking-wide rounded-t-xl">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Khách hàng</div>
          <div className="col-span-2 text-center">Hạng</div>
          <div className="col-span-2 text-right">Điểm tích lũy</div>
          <div className="col-span-2 text-right">Tổng chi tiêu</div>
          <div className="col-span-1 text-center">Tham gia</div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" /> Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users size={36} className="mb-2 opacity-30" />
              <p className="text-sm">Không tìm thấy khách hàng nào</p>
              {hasFilter && (
                <button onClick={resetFilters} className="text-xs text-brand-500 mt-1 hover:underline">
                  Xoá bộ lọc
                </button>
              )}
            </div>
          ) : filtered.map((customer, i) => {
            const mem = MEMBERSHIP[customer.HangThanhVien] || MEMBERSHIP['Đồng']
            return (
              <div
                key={customer.MaKH}
                onClick={() => openView(customer)}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-amber-50/40 cursor-pointer
                           transition-colors items-center group"
              >
                {/* STT */}
                <div className="col-span-1 text-center text-xs text-gray-400">{i + 1}</div>

                {/* Tên + SĐT */}
                <div className="col-span-4">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition-colors">
                    {customer.TenKH}
                  </p>
                  <p className="text-xs text-gray-400">{customer.SDT}</p>
                </div>

                {/* Hạng */}
                <div className="col-span-2 flex justify-center">
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1',
                    mem.cls
                  )}>
                    {mem.icon} {customer.HangThanhVien}
                  </span>
                </div>

                {/* Điểm */}
                <div className="col-span-2 text-right">
                  <p className="text-sm font-semibold text-amber-600">
                    {(customer.DiemTichLuy || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-gray-400">điểm</p>
                </div>

                {/* Tổng chi tiêu */}
                <div className="col-span-2 text-right">
                  <p className="text-xs font-semibold text-gray-700">
                    {fmtCurrency(customer.TongChiTieu || 0)}
                  </p>
                  <p className="text-[11px] text-gray-400">{customer.TongDonHang || 0} đơn</p>
                </div>

                {/* Ngày tham gia */}
                <div className="col-span-1 text-center text-[11px] text-gray-400">
                  {fmtDate(customer.NgayThamGia)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer count */}
        <div className="px-4 py-3 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400">{filtered.length} khách hàng</p>
        </div>
      </div>

      {/* ── Modal ── */}
      {(modalCustomer || modalMode === 'add') && (
        <KhachHangModal
          customer={modalCustomer}
          mode={modalMode}
          onClose={closeModal}
          onSave={handleSave}
          orderHistory={selectedOrders}
        />
      )}

    </div>
  )
}
