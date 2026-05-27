/**
 * POS.jsx — Màn hình Bán hàng tại quầy
 *
 * Layout 2 cột:
 *   Trái (60%): Danh mục tab | Tìm kiếm | Lưới sản phẩm
 *   Phải (40%): Giỏ hàng | CRM tra cứu KH | Thanh toán
 *
 * ⚙️  USE_MOCK = true  → dùng dữ liệu mẫu (chưa cần DB)
 *     USE_MOCK = false → gọi API thật (sau khi kết nối ZeroTier)
 */
import { useState, useMemo } from 'react'
import { Search, ShoppingCart, UserCheck, UserX, Trash2,
         CreditCard, Wallet, Banknote, CheckCircle, Loader2,
         RotateCcw, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import ProductCard  from '../components/pos/ProductCard'
import CartItem     from '../components/pos/CartItem'
import { fmtCurrency, membershipStyle } from '../lib/format'
import {
  MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_CUSTOMERS, DISCOUNT_RATE
} from '../lib/mock'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

// ── Cấu hình chế độ ───────────────────────────────────────
const USE_MOCK = true   // ← Đổi thành false khi kết nối DB

// ── Phương thức thanh toán ────────────────────────────────
const PAYMENT_METHODS = [
  { key: 'Cash',     label: 'Tiền mặt', icon: Banknote },
  { key: 'Card',     label: 'Thẻ',      icon: CreditCard },
  { key: 'E-Wallet', label: 'Ví điện tử', icon: Wallet },
]

// ─────────────────────────────────────────────────────────
export default function POS() {
  const user = useAuthStore((s) => s.user)

  // ── State: Danh mục & Sản phẩm ─────────────────────────
  const [categories]       = useState(MOCK_CATEGORIES)
  const [products]         = useState(MOCK_PRODUCTS)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch]                 = useState('')

  // ── State: Giỏ hàng ─────────────────────────────────────
  const [cart, setCart] = useState([])   // [{ MaSP, TenSP, GiaBan, SoLuong, emoji }]

  // ── State: Khách hàng CRM ───────────────────────────────
  const [phoneInput,  setPhoneInput]  = useState('')
  const [customer,    setCustomer]    = useState(null)  // object hoặc null
  const [lookingUp,   setLookingUp]   = useState(false)
  const [notFound,    setNotFound]    = useState(false)

  // ── State: Thanh toán ───────────────────────────────────
  const [payMethod,   setPayMethod]   = useState('Cash')
  const [isCheckout,  setIsCheckout]  = useState(false)

  // ── Lọc sản phẩm ────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat    = activeCategory === 'all' || p.MaLoai === activeCategory
      const matchSearch = p.TenSP.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [products, activeCategory, search])

  // ── Tính toán giỏ hàng ───────────────────────────────────
  const tongTienHang = cart.reduce((s, i) => s + i.GiaBan * i.SoLuong, 0)
  const discountRate = customer ? (DISCOUNT_RATE[customer.HangThanhVien] || 0) : 0
  const giamGia      = Math.round(tongTienHang * discountRate)
  const tongThanhToan = tongTienHang - giamGia
  const diemCong     = Math.floor(tongThanhToan / 10000)

  // ── Thêm sản phẩm vào giỏ ───────────────────────────────
  const handleAddProduct = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.MaSP === product.MaSP)
      if (existing) {
        return prev.map((i) =>
          i.MaSP === product.MaSP ? { ...i, SoLuong: i.SoLuong + 1 } : i
        )
      }
      return [...prev, { ...product, SoLuong: 1 }]
    })
  }

  // ── Tăng/giảm/xoá trong giỏ ─────────────────────────────
  const handleIncrease = (maSP) => setCart((p) => p.map((i) => i.MaSP === maSP ? { ...i, SoLuong: i.SoLuong + 1 } : i))
  const handleDecrease = (maSP) => setCart((p) => {
    const item = p.find((i) => i.MaSP === maSP)
    if (item.SoLuong <= 1) return p.filter((i) => i.MaSP !== maSP)
    return p.map((i) => i.MaSP === maSP ? { ...i, SoLuong: i.SoLuong - 1 } : i)
  })
  const handleRemove  = (maSP) => setCart((p) => p.filter((i) => i.MaSP !== maSP))
  const clearCart     = () => { setCart([]); setCustomer(null); setPhoneInput(''); setNotFound(false) }

  // ── Tra cứu khách hàng ───────────────────────────────────
  const handleLookup = async () => {
    if (!phoneInput.trim()) return
    setLookingUp(true)
    setNotFound(false)
    setCustomer(null)

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 500))  // Giả lập delay
      const found = MOCK_CUSTOMERS[phoneInput.trim()]
      if (found) { setCustomer(found); toast.success(`Tìm thấy: ${found.TenKH}`) }
      else        { setNotFound(true);  toast.error('Không tìm thấy khách hàng') }
    } else {
      try {
        const res = await api.get(`/khach-hang/tra-cuu?sdt=${phoneInput.trim()}`)
        if (res.data) { setCustomer(res.data); toast.success(`Tìm thấy: ${res.data.TenKH}`) }
        else          { setNotFound(true); toast.error('Không tìm thấy khách hàng') }
      } catch { setNotFound(true) }
    }
    setLookingUp(false)
  }

  // ── Đăng ký khách mới ────────────────────────────────────
  const handleRegisterNew = () => {
    // Placeholder — sẽ mở modal đăng ký sau
    toast('Tính năng đăng ký khách mới sẽ có ở bước tiếp theo.', { icon: '🚧' })
  }

  // ── Thanh toán ───────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Giỏ hàng đang trống!'); return }
    setIsCheckout(true)

    if (USE_MOCK) {
      // Giả lập gọi API
      await new Promise((r) => setTimeout(r, 800))
      const fakeHD = `HD${Date.now()}`
      toast.success(`✅ Thanh toán thành công! Mã HĐ: ${fakeHD}`)
      clearCart()
    } else {
      try {
        const payload = {
          MaCN:         user?.maCN,
          MaKH:         customer?.MaKH || null,
          phuongThuc:   payMethod,
          items:        cart.map((i) => ({ MaSP: i.MaSP, SoLuong: i.SoLuong })),
        }
        const res = await api.post('/hoa-don', payload)
        toast.success(`✅ Thanh toán thành công! Mã HĐ: ${res.data.MaHD}`)
        clearCart()
      } catch (err) {
        toast.error(err.message || 'Thanh toán thất bại.')
      }
    }
    setIsCheckout(false)
  }

  // ── Số lượng sản phẩm trong giỏ (để hiện badge) ─────────
  const getQtyInCart = (maSP) => cart.find((i) => i.MaSP === maSP)?.SoLuong || 0

  // ─────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-[calc(100vh-3.5rem-2.5rem)] -m-5 p-5">

      {/* ══════════════════════════════════════════════════
          CỘT TRÁI — Danh mục & Sản phẩm
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Thanh tìm kiếm */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên sản phẩm..."
            className="input pl-9 bg-white shadow-sm"
          />
        </div>

        {/* Tab danh mục */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 shrink-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeCategory === 'all'
                ? 'bg-brand-500 text-white shadow'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
            )}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.MaLoai}
              onClick={() => setActiveCategory(cat.MaLoai)}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === cat.MaLoai
                  ? 'bg-brand-500 text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              )}
            >
              {cat.TenLoai}
            </button>
          ))}
        </div>

        {/* Lưới sản phẩm */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Search size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.MaSP}
                  product={p}
                  onAdd={handleAddProduct}
                  inCart={getQtyInCart(p.MaSP)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          CỘT PHẢI — Giỏ hàng + Thanh toán
      ══════════════════════════════════════════════════ */}
      <div className="w-80 xl:w-96 flex flex-col gap-3 shrink-0">

        {/* ── Giỏ hàng ─────────────────────────────────── */}
        <div className="card flex-1 flex flex-col overflow-hidden p-0">
          {/* Header giỏ hàng */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-brand-500" />
              <span className="font-semibold text-sm text-gray-800">Giỏ hàng</span>
              {cart.length > 0 && (
                <span className="bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cart.reduce((s, i) => s + i.SoLuong, 0)}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} /> Xoá hết
              </button>
            )}
          </div>

          {/* Danh sách items */}
          <div className="flex-1 overflow-y-auto px-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-gray-300">
                <ShoppingCart size={32} className="mb-2" />
                <p className="text-xs">Chưa có sản phẩm</p>
                <p className="text-xs">Bấm sản phẩm bên trái để thêm</p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItem
                  key={item.MaSP}
                  item={item}
                  onIncrease={() => handleIncrease(item.MaSP)}
                  onDecrease={() => handleDecrease(item.MaSP)}
                  onRemove={() => handleRemove(item.MaSP)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── CRM: Tra cứu khách hàng ───────────────────── */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Khách hàng
          </p>

          {!customer ? (
            <>
              <div className="flex gap-2">
                <input
                  value={phoneInput}
                  onChange={(e) => { setPhoneInput(e.target.value); setNotFound(false) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="Nhập số điện thoại..."
                  className="input flex-1 text-sm"
                  maxLength={11}
                />
                <button
                  onClick={handleLookup}
                  disabled={lookingUp || !phoneInput.trim()}
                  className="btn-primary px-3 py-0 text-xs shrink-0 h-[38px]"
                >
                  {lookingUp ? <Loader2 size={14} className="animate-spin" /> : 'Tra cứu'}
                </button>
              </div>

              {notFound && (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-orange-600">
                    <UserX size={14} />
                    <span className="text-xs">Khách vãng lai</span>
                  </div>
                  <button
                    onClick={handleRegisterNew}
                    className="text-xs text-brand-600 font-medium hover:underline"
                  >
                    Đăng ký mới
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Đã tìm thấy khách hàng */
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <UserCheck size={15} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{customer.TenKH}</p>
                    <p className="text-xs text-gray-500">{customer.SDT}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCustomer(null); setPhoneInput(''); setNotFound(false) }}
                  className="text-gray-300 hover:text-red-500"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              {/* Hạng thành viên + điểm */}
              <div className="flex items-center justify-between">
                <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium',
                  membershipStyle(customer.HangThanhVien).cls)}>
                  {membershipStyle(customer.HangThanhVien).icon} {customer.HangThanhVien}
                </span>
                <span className="text-xs text-gray-500">
                  {customer.DiemTichLuy} điểm
                  {diemCong > 0 && cart.length > 0 && (
                    <span className="text-green-600 font-medium"> +{diemCong}</span>
                  )}
                </span>
              </div>

              {discountRate > 0 && (
                <div className="text-xs text-green-600 bg-green-50 rounded-lg px-2.5 py-1.5 font-medium">
                  🎉 Giảm {discountRate * 100}% — tiết kiệm {fmtCurrency(giamGia)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Phương thức thanh toán ───────────────────── */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Phương thức thanh toán
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setPayMethod(key)}
                className={clsx(
                  'flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-colors',
                  payMethod === key
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tổng kết + Nút thanh toán ────────────────── */}
        <div className="card p-4 space-y-3">
          {/* Bảng tính tiền */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Tổng tiền hàng</span>
              <span>{fmtCurrency(tongTienHang)}</span>
            </div>
            {giamGia > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá ({discountRate * 100}%)</span>
                <span>-{fmtCurrency(giamGia)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1.5 border-t border-gray-100">
              <span>Tổng thanh toán</span>
              <span className="text-brand-600">{fmtCurrency(tongThanhToan)}</span>
            </div>
          </div>

          {/* Nút thanh toán */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckout}
            className={clsx(
              'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2',
              cart.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-[0.98]'
            )}
          >
            {isCheckout ? (
              <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
            ) : (
              <><CheckCircle size={16} /> Thanh toán — {fmtCurrency(tongThanhToan)}</>
            )}
          </button>

          {/* Nút phụ: Xem lịch sử */}
          <button
            onClick={() => window.location.href = '/hoa-don'}
            className="w-full py-2 rounded-lg border border-gray-100 text-gray-500
                       hover:bg-gray-50 text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Receipt size={13} /> Xem lịch sử hóa đơn
          </button>
        </div>

      </div>
    </div>
  )
}
