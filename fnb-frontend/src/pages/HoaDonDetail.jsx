/**
 * HoaDonDetail.jsx — Trang chi tiết hóa đơn (/hoa-don/:maHD)
 *
 * - Hiển thị đầy đủ: header, khách hàng, sản phẩm, thanh toán
 * - Nút Huỷ đơn: role_admin + role_readonly + role_cashier
 * - Nút In hóa đơn (window.print)
 * - Nút ← Quay lại danh sách
 *
 * USE_MOCK = true → tìm trong MOCK_ORDERS
 * USE_MOCK = false → GET /api/v1/hoa-don/:maHD
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Printer, XCircle, Store, User,
  CreditCard, Clock, Hash, ShoppingBag, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { MOCK_ORDERS } from '../lib/mock'
import { fmtCurrency, membershipStyle } from '../lib/format'
import { useAuthStore } from '../store/authStore'

/* ── Feature flag ─────────────────────────────────────────────────────────── */
const USE_MOCK = true

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const STATUS_STYLE = {
  Completed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-600',
}
const STATUS_LABEL = { Completed: 'Hoàn thành', Pending: 'Đang xử lý', Cancelled: 'Đã huỷ' }
const PAY_ICON  = { Cash: '💵', Card: '💳', 'E-Wallet': '📱' }
const PAY_LABEL = { Cash: 'Tiền mặt', Card: 'Thẻ ngân hàng', 'E-Wallet': 'Ví điện tử' }

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── InfoCard nhỏ ─────────────────────────────────────────────────────────── */
function InfoCard({ icon, title, children }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-brand-500">{icon}</span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function HoaDonDetail() {
  const { maHD } = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuthStore()

  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  // role_cashier + role_admin + quan_ly đều được huỷ
  const canCancel = ['role_admin', 'role_cashier'].includes(user?.vaiTro)

  /* ── Load ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (USE_MOCK) {
          await new Promise(r => setTimeout(r, 250))
          const found = MOCK_ORDERS.find(o => o.MaHD === maHD)
          if (!found) { toast.error('Không tìm thấy hóa đơn'); navigate('/hoa-don'); return }
          setOrder(found)
        } else {
          const data = await api.get(`/hoa-don/${maHD}`)
          setOrder(data)
        }
      } catch {
        toast.error('Không tải được hóa đơn')
        navigate('/hoa-don')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [maHD])

  /* ── Huỷ đơn ── */
  const handleCancel = async () => {
    if (!window.confirm(`Bạn có chắc muốn huỷ đơn hàng ${order.MaHD}?`)) return
    setCancelling(true)
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400))
        setOrder(prev => ({ ...prev, TrangThai: 'Cancelled' }))
        toast.success('Đã huỷ hóa đơn')
      } else {
        await api.patch(`/hoa-don/${order.MaHD}/huy`)
        toast.success('Đã huỷ hóa đơn và hoàn kho')
        setOrder(prev => ({ ...prev, TrangThai: 'Cancelled' }))
      }
    } catch {
      toast.error('Không thể huỷ hóa đơn')
    } finally {
      setCancelling(false)
    }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm">Đang tải hóa đơn...</span>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Topbar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/hoa-don')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-1.5 text-sm px-3 py-1.5"
          >
            <Printer size={14} />
            In hóa đơn
          </button>
          {canCancel && order.TrangThai !== 'Cancelled' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn-danger flex items-center gap-1.5 text-sm px-3 py-1.5 disabled:opacity-60"
            >
              <XCircle size={14} />
              {cancelling ? 'Đang huỷ...' : 'Huỷ đơn'}
            </button>
          )}
        </div>
      </div>

      {/* ── Header card ── */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash size={14} className="text-gray-400" />
              <span className="font-bold text-gray-800 text-lg tracking-wide">{order.MaHD}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Clock size={13} />
              {fmtDateTime(order.NgayLap)}
            </div>
          </div>
          <span className={clsx(
            'px-3 py-1 rounded-full text-sm font-semibold',
            STATUS_STYLE[order.TrangThai] || 'bg-gray-100 text-gray-600'
          )}>
            {STATUS_LABEL[order.TrangThai] || order.TrangThai}
          </span>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard icon={<Store size={14} />} title="Chi nhánh & Nhân viên">
          <p className="text-sm font-semibold text-gray-800">{order.TenCN}</p>
          <p className="text-xs text-gray-500 mt-0.5">Thu ngân: {order.TenNhanVien || '—'}</p>
        </InfoCard>

        <InfoCard icon={<User size={14} />} title="Khách hàng">
          {order.TenKH ? (
            <>
              <p className="text-sm font-semibold text-gray-800">{order.TenKH}</p>
              <p className="text-xs text-gray-500 mt-0.5">{order.SDTKH}</p>
              {order.HangThanhVien && (
                <span className={clsx(
                  'inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold',
                  membershipStyle(order.HangThanhVien).cls
                )}>
                  {membershipStyle(order.HangThanhVien).icon} {order.HangThanhVien}
                </span>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Khách vãng lai</p>
          )}
        </InfoCard>
      </div>

      {/* ── Phương thức thanh toán ── */}
      {order.thanhToan && (
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Phương thức thanh toán</p>
            <p className="text-sm font-semibold text-gray-800">
              {PAY_ICON[order.thanhToan.PhuongThuc]} {PAY_LABEL[order.thanhToan.PhuongThuc] || order.thanhToan.PhuongThuc}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Mã giao dịch</p>
            <p className="text-xs font-mono text-gray-600">{order.thanhToan.MaTT}</p>
          </div>
          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold shrink-0">
            Thành công
          </span>
        </div>
      )}

      {/* ── Danh sách sản phẩm ── */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ShoppingBag size={15} className="text-brand-500" />
          <span className="text-sm font-semibold text-gray-700">
            Sản phẩm ({order.chiTiet?.length || 0} loại)
          </span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100
                        text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          <div className="col-span-5">Sản phẩm</div>
          <div className="col-span-2 text-center">SL</div>
          <div className="col-span-3 text-right">Đơn giá</div>
          <div className="col-span-2 text-right">Thành tiền</div>
        </div>

        {/* Rows */}
        {(order.chiTiet || []).map((item, i) => (
          <div
            key={item.MaSP}
            className={clsx(
              'grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-gray-50 last:border-0',
              i % 2 === 1 ? 'bg-gray-50/40' : ''
            )}
          >
            <div className="col-span-5 font-medium text-gray-800">{item.TenSP}</div>
            <div className="col-span-2 text-center text-gray-600">x{item.SoLuong}</div>
            <div className="col-span-3 text-right text-gray-500 text-xs self-center">{fmtCurrency(item.DonGia)}</div>
            <div className="col-span-2 text-right font-semibold text-gray-800 text-xs self-center">{fmtCurrency(item.ThanhTien)}</div>
          </div>
        ))}
      </div>

      {/* ── Tóm tắt thanh toán ── */}
      <div className="card space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tạm tính</span>
          <span>{fmtCurrency(order.TongTienHang)}</span>
        </div>
        {order.GiamGia > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Giảm giá thành viên</span>
            <span>− {fmtCurrency(order.GiamGia)}</span>
          </div>
        )}
        <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
          <span className="font-bold text-gray-800">Tổng thanh toán</span>
          <span className="font-bold text-xl text-brand-600">{fmtCurrency(order.TongThanhToan)}</span>
        </div>
      </div>

    </div>
  )
}
