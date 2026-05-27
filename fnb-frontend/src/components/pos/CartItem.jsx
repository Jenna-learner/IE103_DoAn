/**
 * CartItem — Dòng sản phẩm trong giỏ hàng
 * Có nút tăng/giảm/xoá
 */
import { Plus, Minus, X } from 'lucide-react'
import { fmtCurrency } from '../../lib/format'

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      {/* Emoji */}
      <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-xl shrink-0">
        {item.emoji || '☕'}
      </div>

      {/* Tên + đơn giá */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.TenSP}</p>
        <p className="text-xs text-gray-400">{fmtCurrency(item.GiaBan)} / cái</p>
      </div>

      {/* Bộ điều chỉnh số lượng */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onDecrease}
          className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center
                     text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          <Minus size={11} />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-gray-800">
          {item.SoLuong}
        </span>
        <button
          onClick={onIncrease}
          className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center
                     text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Thành tiền */}
      <div className="w-20 text-right shrink-0">
        <p className="text-sm font-semibold text-gray-800">
          {fmtCurrency(item.GiaBan * item.SoLuong)}
        </p>
      </div>

      {/* Xoá */}
      <button
        onClick={onRemove}
        className="w-6 h-6 flex items-center justify-center text-gray-300
                   hover:text-red-500 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
