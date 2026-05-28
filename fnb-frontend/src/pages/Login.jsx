import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Coffee, Lock, User, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

/* ── Feature flag ─────────────────────────────────────────────────────────── */
const USE_MOCK = true

// Tài khoản mock — dùng khi chưa kết nối DB
// Key = username đăng nhập, vaiTro = DB role name
const MOCK_ACCOUNTS = {
  'admin':    { maTK: 1, maNV: 'NV001', hoTen: 'Trần Yến Nhi',   vaiTro: 'role_admin',           maCN: 'CN001', tenCN: 'Chi nhánh Quận 1', tenDangNhap: 'admin',    matKhau: 'Admin@123'   },
  'readonly': { maTK: 2, maNV: 'NV002', hoTen: 'Trần Thị Bình',  vaiTro: 'role_readonly',        maCN: 'CN001', tenCN: 'Chi nhánh Quận 1', tenDangNhap: 'readonly', matKhau: 'Readonly@123'},
  'cashier':  { maTK: 3, maNV: 'NV003', hoTen: 'Lê Văn Cường',   vaiTro: 'role_cashier',         maCN: 'CN001', tenCN: 'Chi nhánh Quận 1', tenDangNhap: 'cashier',  matKhau: 'Cashier@123' },
  'warehouse':{ maTK: 4, maNV: 'NV005', hoTen: 'Hoàng Minh Đức', vaiTro: 'role_warehouse_staff', maCN: 'CN001', tenCN: 'Chi nhánh Quận 1', tenDangNhap: 'warehouse',matKhau: 'Warehouse@123'},
}

// Map vai trò → trang mặc định sau đăng nhập
const ROLE_HOME = {
  role_admin:           '/dashboard',
  role_readonly:        '/dashboard',
  role_cashier:         '/pos',
  role_warehouse_staff: '/kho/ton-kho',
}

export default function Login() {
  const navigate   = useNavigate()
  const login      = useAuthStore((s) => s.login)
  const isLoading  = useAuthStore((s) => s.isLoading)

  const [form, setForm]           = useState({ tenDangNhap: '', matKhau: '' })
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')

  const handleChange = (e) => {
    setError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tenDangNhap || !form.matKhau) {
      setError('Vui lòng nhập đầy đủ thông tin.')
      return
    }

    if (USE_MOCK) {
      // Mock login — kiểm tra tài khoản hardcoded
      await new Promise(r => setTimeout(r, 500))
      const account = MOCK_ACCOUNTS[form.tenDangNhap]
      if (!account || account.matKhau !== form.matKhau) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.')
        return
      }
      const mockToken = 'mock-jwt-token-' + account.vaiTro
      localStorage.setItem('fnb_token', mockToken)
      // Set store trực tiếp (bypass api call)
      useAuthStore.setState({ token: mockToken, user: account })
      toast.success(`Chào mừng, ${account.hoTen}! 👋`)
      navigate(ROLE_HOME[account.vaiTro] || '/dashboard', { replace: true })
      return
    }

    const res = await login(form.tenDangNhap, form.matKhau)

    if (res.ok) {
      toast.success(`Chào mừng, ${res.user.hoTen}! 👋`)
      const home = ROLE_HOME[res.user.vaiTro] || '/dashboard'
      navigate(home, { replace: true })
    } else {
      setError(res.message)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Cột trái: Branding ────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-brand-900 flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Coffee size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FnB Chain</span>
        </div>

        {/* Minh hoạ trung tâm */}
        <div>
          <div className="grid grid-cols-2 gap-3 mb-10">
            {[
              { label: 'Hóa đơn hôm nay', value: '247', color: 'bg-brand-500/20 text-brand-400' },
              { label: 'Doanh thu', value: '8.4M ₫', color: 'bg-green-500/20 text-green-400' },
              { label: 'Tồn kho cảnh báo', value: '3 NL', color: 'bg-red-500/20 text-red-400' },
              { label: 'Ca làm hôm nay', value: '12 NV', color: 'bg-blue-500/20 text-blue-400' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${item.color} border border-white/10`}>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs mt-1 opacity-80">{item.label}</div>
              </div>
            ))}
          </div>

          <h2 className="text-white text-3xl font-bold leading-tight mb-3">
            Quản lý chuỗi F&B<br />
            <span className="text-brand-400">thông minh & hiệu quả</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Hệ thống tích hợp POS · Kho vận · CRM · Báo cáo real-time
            cho toàn bộ chuỗi chi nhánh.
          </p>
        </div>

        {/* Footer */}
        <p className="text-gray-600 text-xs">IE103 — Hệ Quản Trị Cơ Sở Dữ Liệu</p>
      </div>

      {/* ── Cột phải: Form đăng nhập ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <Coffee size={20} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">FnB Chain</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập</h1>
          <p className="text-gray-500 text-sm mb-8">
            Nhập thông tin tài khoản được cấp để tiếp tục
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên đăng nhập */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="tenDangNhap"
                  value={form.tenDangNhap}
                  onChange={handleChange}
                  placeholder="Nhập tên đăng nhập..."
                  autoComplete="username"
                  className="input pl-9"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="matKhau"
                  type={showPass ? 'text' : 'password'}
                  value={form.matKhau}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu..."
                  autoComplete="current-password"
                  className="input pl-9 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Thông báo lỗi */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 text-sm mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Hint tài khoản demo */}
          <div className="mt-8 p-3.5 bg-amber-50 border border-amber-100 rounded-lg space-y-1">
            <p className="text-xs font-medium text-amber-800 mb-1.5">Tài khoản demo:</p>
            <p className="text-xs text-amber-700 font-mono">admin / Admin@123 <span className="opacity-60">(role_admin)</span></p>
            <p className="text-xs text-amber-700 font-mono">readonly / Readonly@123 <span className="opacity-60">(role_readonly)</span></p>
            <p className="text-xs text-amber-700 font-mono">cashier / Cashier@123 <span className="opacity-60">(role_cashier)</span></p>
            <p className="text-xs text-amber-700 font-mono">warehouse / Warehouse@123 <span className="opacity-60">(role_warehouse_staff)</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}