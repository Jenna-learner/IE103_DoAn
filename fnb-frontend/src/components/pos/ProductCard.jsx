/**
 * ProductCard — Thẻ sản phẩm trong lưới POS
 * Click để thêm vào giỏ hàng
 */
import { Plus } from 'lucide-react'
import { fmtCurrency } from '../../lib/format'
import clsx from 'clsx'

export default function ProductCard({ product, onAdd, inCart }) {
  const isOutOfStock = product.TrangThai === 'Out of stock'

  return (
    <button
      onClick={() => !isOutOfStock && onAdd(product)}
      disabled={isOutOfStock}
      className={clsx(
        'relative w-full text-left rounded-xl border transition-all duration-150 overflow-hidden group',
        isOutOfStock
          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
          : 'border-gray-100 bg-white hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        inCart && !isOutOfStock && 'border-brand-400 ring-2 ring-brand-100'
      )}
    >
      {/* Khu vực emoji / ảnh sản phẩm */}
      <div className={clsx(
        'h-20 flex items-center justify-center text-4xl transition-colors',
        isOutOfStock ? 'bg-gray-50' : 'bg-amber-50 group-hover:bg-amber-100'
      )}>
        <span>{product.emoji || '☕'}</span>
      </div>

      {/* Nút thêm nhanh */}
      {!isOutOfStock && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-brand-500 rounded-full
                        flex items-center justify-center opacity-0 group-hover:opacity-100
                        transition-opacity shadow">
          <Plus size={13} className="text-white" />
        </div>
      )}

      {/* Số lượng trong giỏ */}
      {inCart > 0 && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-brand-500 rounded-full
                        flex items-center justify-center text-white text-[10px] font-bold shadow">
          {inCart}
        </div>
      )}

      {/* Thông tin */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-1">
          {product.TenSP}
        </p>
        <p className="text-brand-600 font-bold text-sm">{fmtCurrency(product.GiaBan)}</p>
        {isOutOfStock && (
          <p className="text-red-400 text-[10px] mt-0.5">Hết hàng</p>
        )}
      </div>
    </button>
  )
}
