/**
 * OrderDetailModal — Popup chi tiết hóa đơn
 * Hiển thị: header đơn hàng, danh sách sản phẩm, tóm tắt thanh toán
 * Props: order (object), onClose (fn), onCancel (fn, chỉ cho quản lý)
 */
import { X, User, Store, CreditCard, Clock, Hash, Printer } from 'lucide-react'
import { fmtCurrency, membershipStyle, orderStatusStyle } from '../../lib/format'
import clsx from 'clsx'

const PAY_ICON = { Cash: '💵', Card: '💳', 'E-Wallet': '📱' }
const PAY_LABEL = { Cash: 'Tiền mặt', Card: 'Thẻ ngân hàng', 'E-Wallet': 'Ví điện tử' }

const StatusBadge = ({ status }) => {
  const map = {
    Completed: 'bg-green-100 text-green-700',
    Pending:   'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-600',
  }
  const label = { Completed: 'Hoàn thành', Pending: 'Đang xử lý', Cancelled: 'Đã huỷ' }
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold', map[status] || 'bg-gray-100 text-gray-600')}>
      {label[status] || status}
    </span>
  )
}

export default function OrderDetailModal({ order, onClose, onCancel, canCancel }) {
  if (!order) return null

  const fmtDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Hash size={15} className="text-gray-400" />
              <span className="font-bold text-gray-800 text-sm tracking-wide">{order.MaHD}</span>
              <StatusBadge status={order.TrangThai} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock size={11} /> {fmtDate(order.NgayLap)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400
                       hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Nội dung cuộn ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Chi nhánh / nhân viên */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Store size={13} className="text-brand-500" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Chi nhánh</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{order.TenCN}</p>
              <p className="text-xs text-gray-400 mt-0.5">Thu ngân: {order.TenNhanVien || '—'}</p>
            </div>

            {/* Khách hàng */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User size={13} className="text-brand-500" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Khách hàng</span>
              </div>
              {order.TenKH ? (
                <>
                  <p className="text-sm font-medium text-gray-800">{order.TenKH}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{order.SDTKH}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">Khách vãng lai</p>
              )}
            </div>
          </div>

          {/* Phương thức thanh toán */}
          {order.thanhToan && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-3 py-2.5">
              <CreditCard size={15} className="text-blue-500 shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-blue-600 font-semibold">Thanh toán</span>
                <p className="text-sm font-medium text-gray-800">
                  {PAY_ICON[order.thanhToan.PhuongThuc]} {PAY_LABEL[order.thanhToan.PhuongThuc] || order.thanhToan.PhuongThuc}
                </p>
              </div>
              <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                Thành công
              </span>
            </div>
          )}

          {/* Danh sách sản phẩm */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Sản phẩm ({order.chiTiet?.length || 0})
            </p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase">
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-center">SL</div>
                <div className="col-span-3 text-right">Đơn giá</div>
                <div className="col-span-2 text-right">T.Tiền</div>
              </div>
              {/* Items */}
              {(order.chiTiet || []).map((item, i) => (
                <div
                  key={item.MaSP}
                  className={clsx(
                    'grid grid-cols-12 gap-2 px-3 py-2.5 text-sm',
                    i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                  )}
                >
                  <div className="col-span-5 font-medium text-gray-800 truncate">{item.TenSP}</div>
                  <div className="col-span-2 text-center text-gray-600">x{item.SoLuong}</div>
                  <div className="col-span-3 text-right text-gray-500 text-xs">{fmtCurrency(item.DonGia)}</div>
                  <div className="col-span-2 text-right font-semibold text-gray-800 text-xs">{fmtCurrency(item.ThanhTien)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tóm tắt tiền */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{fmtCurrency(order.TongTienHang)}</span>
            </div>
            {order.GiamGia > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá thành viên</span>
                <span>- {fmtCurrency(order.GiamGia)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between font-bold text-base">
              <span className="text-gray-800">Tổng thanh toán</span>
              <span className="text-brand-600">{fmtCurrency(order.TongThanhToan)}</span>
            </div>
          </div>

        </div>

        {/* ── Footer actions ── */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Printer size={14} />
            In hóa đơn
          </button>
          <div className="flex gap-2">
            {canCancel && order.TrangThai !== 'Cancelled' && (
              <button
                onClick={() => onCancel(order.MaHD)}
                className="btn-danger text-sm px-4 py-1.5"
              >
                Huỷ đơn
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary text-sm px-4 py-1.5"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
